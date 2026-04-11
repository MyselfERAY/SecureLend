import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ContractStatus, UserRole, BankAccountType, BankAccountStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BankService } from '../bank/bank.service';
import { InAppNotificationService } from '../in-app-notification/in-app-notification.service';
import { EmailService } from '../notification/email.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bankService: BankService,
    private readonly inAppNotificationService: InAppNotificationService,
    private readonly emailService: EmailService,
  ) {}

  async create(landlordId: string, dto: CreateContractDto) {
    // Validate landlord owns the property
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Mulk bulunamadi');
    if (property.ownerId !== landlordId)
      throw new ForbiddenException('Bu mulk size ait degil');

    // Validate tenant exists
    const tenant = await this.prisma.user.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) throw new NotFoundException('Kiraci bulunamadi');
    if (tenant.id === landlordId)
      throw new BadRequestException('Kendinizle sozlesme olusturulamaz');

    // Fetch landlord for email/name
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
    });
    if (!landlord) throw new NotFoundException('Ev sahibi bulunamadi');

    // Auto-add TENANT role if missing (same pattern as property.service LANDLORD auto-assign)
    if (!tenant.roles.includes(UserRole.TENANT)) {
      await this.prisma.user.update({
        where: { id: dto.tenantId },
        data: { roles: { push: UserRole.TENANT } },
      });
    }

    const contract = await this.prisma.$transaction(async (tx) => {
      const c = await tx.contract.create({
        data: {
          propertyId: dto.propertyId,
          tenantId: dto.tenantId,
          landlordId,
          landlordIban: dto.landlordIban,
          monthlyRent: dto.monthlyRent,
          depositAmount: dto.depositAmount,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          paymentDayOfMonth: dto.paymentDayOfMonth,
          terms: dto.terms,
          specialClauses: dto.specialClauses,
          rentIncreaseType: dto.rentIncreaseType,
          rentIncreaseRate: dto.rentIncreaseRate,
          furnitureIncluded: dto.furnitureIncluded ?? false,
          petsAllowed: dto.petsAllowed ?? false,
          sublettingAllowed: dto.sublettingAllowed ?? false,
          noticePeriodDays: dto.noticePeriodDays ?? 30,
          status: ContractStatus.PENDING_SIGNATURES,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: landlordId,
          action: 'CONTRACT_CREATED',
          entityType: 'Contract',
          entityId: c.id,
          metadata: { tenantId: dto.tenantId, propertyId: dto.propertyId, landlordIban: dto.landlordIban },
        },
      });

      return c;
    });

    this.logger.log(`Contract ${contract.id} created`);

    // Notify both parties about new contract (in-app)
    try {
      await this.inAppNotificationService.create(
        dto.tenantId,
        NotificationType.CONTRACT_CREATED,
        'Yeni Sozlesme Olusturuldu',
        'Sizin icin yeni bir kira sozlesmesi olusturuldu. Lutfen inceleyin ve imzalayin.',
        'Contract',
        contract.id,
      );
      await this.inAppNotificationService.create(
        landlordId,
        NotificationType.CONTRACT_CREATED,
        'Sozlesme Olusturuldu',
        'Olusturdugunuz kira sozlesmesi kiraciya iletildi. Sozlesmeyi imzalamayi unutmayin.',
        'Contract',
        contract.id,
      );
    } catch (err) {
      this.logger.warn(`Failed to create in-app notification for contract ${contract.id}: ${err}`);
    }

    // Send signature request emails to both parties
    const contractUrl = this.buildContractUrl(contract.id);
    const propertyTitle = property.title ?? `${property.city}/${property.district}`;

    if (tenant.email) {
      try {
        await this.emailService.sendEmail(
          tenant.email,
          'Kira Sozlesmesi Imzanizi Bekliyor',
          this.buildSignatureRequestEmail({
            recipientName: tenant.fullName,
            otherPartyName: landlord.fullName,
            otherPartyRole: 'Ev Sahibi',
            propertyTitle,
            monthlyRent: Number(contract.monthlyRent),
            startDate: contract.startDate.toISOString().split('T')[0],
            endDate: contract.endDate.toISOString().split('T')[0],
            contractUrl,
          }),
        );
        this.logger.log(`Signature request email sent to tenant ${tenant.email} for contract ${contract.id}`);
      } catch (err) {
        this.logger.warn(`Failed to send signature email to tenant for contract ${contract.id}: ${err}`);
      }
    } else {
      this.logger.warn(`Tenant ${tenant.id} has no email address — skipping signature email for contract ${contract.id}`);
    }

    if (landlord.email) {
      try {
        await this.emailService.sendEmail(
          landlord.email,
          'Kira Sozlesmesi Imzanizi Bekliyor',
          this.buildSignatureRequestEmail({
            recipientName: landlord.fullName,
            otherPartyName: tenant.fullName,
            otherPartyRole: 'Kiraci',
            propertyTitle,
            monthlyRent: Number(contract.monthlyRent),
            startDate: contract.startDate.toISOString().split('T')[0],
            endDate: contract.endDate.toISOString().split('T')[0],
            contractUrl,
          }),
        );
        this.logger.log(`Signature request email sent to landlord ${landlord.email} for contract ${contract.id}`);
      } catch (err) {
        this.logger.warn(`Failed to send signature email to landlord for contract ${contract.id}: ${err}`);
      }
    } else {
      this.logger.warn(`Landlord ${landlordId} has no email address — skipping signature email for contract ${contract.id}`);
    }

    return this.getContractDetail(contract.id);
  }

  async getMyContracts(userId: string) {
    const contracts = await this.prisma.contract.findMany({
      where: { OR: [{ tenantId: userId }, { landlordId: userId }] },
      include: {
        property: { select: { title: true, city: true, district: true } },
        tenant: { select: { fullName: true } },
        landlord: { select: { fullName: true } },
        signatures: { select: { userId: true, role: true, signedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return contracts.map((c) => this.formatContractSummary(c, userId));
  }

  async getContractDetail(contractId: string, userId?: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: true,
        tenant: { select: { id: true, fullName: true, tcknMasked: true } },
        landlord: { select: { id: true, fullName: true, tcknMasked: true } },
        signatures: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');

    // Authorization check
    if (userId && contract.tenantId !== userId && contract.landlordId !== userId) {
      throw new ForbiddenException('Bu sozlesmeye erisim yetkiniz yok');
    }

    // Get tenant's ALL active KMH accounts for this contract context
    const tenantKmhAccounts = await this.prisma.bankAccount.findMany({
      where: {
        userId: contract.tenantId,
        accountType: BankAccountType.KMH,
        status: BankAccountStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });

    // tenantKmhInfo: ilk (en son) hesap bilgisi (geriye uyumluluk icin)
    let tenantKmhInfo: any = null;
    if (tenantKmhAccounts.length > 0) {
      tenantKmhInfo = {
        accountId: tenantKmhAccounts[0].id,
        accountNumber: tenantKmhAccounts[0].accountNumber,
        creditLimit: Number(tenantKmhAccounts[0].creditLimit),
        status: tenantKmhAccounts[0].status,
      };
    }

    // tenantKmhAccounts: tüm aktif KMH hesapları (seçim için)
    const tenantKmhList = tenantKmhAccounts.map((acc) => ({
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      creditLimit: Number(acc.creditLimit),
      status: acc.status,
      contractId: acc.contractId,
    }));

    // Hide landlord IBAN from tenants
    const showIban = !userId || userId === contract.landlordId;

    return {
      id: contract.id,
      status: contract.status,
      landlordIban: showIban ? contract.landlordIban : undefined,
      monthlyRent: Number(contract.monthlyRent),
      depositAmount: contract.depositAmount ? Number(contract.depositAmount) : undefined,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
      paymentDayOfMonth: contract.paymentDayOfMonth,
      terms: contract.terms,
      specialClauses: contract.specialClauses,
      rentIncreaseType: contract.rentIncreaseType,
      rentIncreaseRate: contract.rentIncreaseRate ? Number(contract.rentIncreaseRate) : undefined,
      furnitureIncluded: contract.furnitureIncluded,
      petsAllowed: contract.petsAllowed,
      sublettingAllowed: contract.sublettingAllowed,
      noticePeriodDays: contract.noticePeriodDays,
      documentPhotoUrl: contract.documentPhotoUrl,
      documentPhotoKey: contract.documentPhotoKey,
      uavtCode: contract.uavtCode,
      bankActivationRef: contract.bankActivationRef,
      property: {
        id: contract.property.id,
        title: contract.property.title,
        city: contract.property.city,
        district: contract.property.district,
        addressLine1: contract.property.addressLine1,
      },
      tenant: contract.tenant,
      landlord: contract.landlord,
      tenantKmhInfo,
      tenantKmhAccounts: tenantKmhList,
      signatures: contract.signatures.map((s) => ({
        role: s.role,
        signedAt: s.signedAt.toISOString(),
        signedByName: s.user.fullName,
      })),
      createdAt: contract.createdAt.toISOString(),
    };
  }

  async signContract(
    userId: string,
    contractId: string,
    ipAddress: string,
    userAgent: string,
    kmhAccountId?: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { signatures: true },
    });

    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.status !== ContractStatus.PENDING_SIGNATURES)
      throw new BadRequestException('Bu sozlesme imzaya acik degil');

    // Determine role
    let role: UserRole;
    if (userId === contract.tenantId) role = UserRole.TENANT;
    else if (userId === contract.landlordId) role = UserRole.LANDLORD;
    else throw new ForbiddenException('Bu sozlesmenin tarafi degilsiniz');

    // Check not already signed
    const alreadySigned = contract.signatures.some((s) => s.userId === userId);
    if (alreadySigned)
      throw new BadRequestException('Bu sozlesmeyi zaten imzaladiniz');

    // Will this be the second signature?
    const otherPartySigned = contract.signatures.length === 1;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.contractSignature.create({
        data: {
          contractId,
          userId,
          role,
          ipAddress,
          userAgent,
        },
      });

      let newStatus = contract.status;
      if (otherPartySigned) {
        // Both parties signed → move to PENDING_ACTIVATION (requires UAVT + bank verification)
        newStatus = ContractStatus.PENDING_ACTIVATION;
        await tx.contract.update({
          where: { id: contractId },
          data: { status: ContractStatus.PENDING_ACTIVATION },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: otherPartySigned ? 'CONTRACT_ACTIVATED' : 'CONTRACT_SIGNED',
          entityType: 'Contract',
          entityId: contractId,
          metadata: { role, newStatus },
          ipAddress,
        },
      });

      return newStatus;
    });

    // Fetch both parties for email notifications
    const [tenantUser, landlordUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: contract.tenantId } }),
      this.prisma.user.findUnique({ where: { id: contract.landlordId } }),
    ]);

    // ─── IN-APP NOTIFICATIONS ───
    try {
      if (result === ContractStatus.PENDING_ACTIVATION) {
        // Both signed → pending activation: notify both parties
        await this.inAppNotificationService.createForMultipleUsers(
          [contract.tenantId, contract.landlordId],
          NotificationType.CONTRACT_SIGNED,
          'Imzalar Tamamlandi',
          'Kira sozlesmesi her iki tarafca imzalandi. Sozlesmeyi aktif hale getirmek icin UAVT dogrulamasi gerekiyor.',
          'Contract',
          contractId,
        );
      } else {
        // First signature: notify the other party
        const otherPartyId = userId === contract.tenantId ? contract.landlordId : contract.tenantId;
        await this.inAppNotificationService.create(
          otherPartyId,
          NotificationType.CONTRACT_SIGNED,
          'Sozlesme Imzalandi',
          'Kira sozlesmesi diger tarafca imzalandi. Lutfen siz de imzalayin.',
          'Contract',
          contractId,
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to create notification for contract sign ${contractId}: ${err}`);
    }

    // ─── EMAIL NOTIFICATIONS ───
    const contractUrl = this.buildContractUrl(contractId);
    try {
      if (result === ContractStatus.PENDING_ACTIVATION) {
        // Both parties signed — notify both: activation step needed
        if (tenantUser?.email) {
          await this.emailService.sendEmail(
            tenantUser.email,
            'Tum Imzalar Tamamlandi — Sozlesmeyi Aktive Edin',
            this.buildBothSignedEmail({
              recipientName: tenantUser.fullName,
              contractUrl,
              isTenant: true,
            }),
          );
          this.logger.log(`Both-signed email sent to tenant ${tenantUser.email} for contract ${contractId}`);
        }
        if (landlordUser?.email) {
          await this.emailService.sendEmail(
            landlordUser.email,
            'Tum Imzalar Tamamlandi — Sozlesme Bekleniyor',
            this.buildBothSignedEmail({
              recipientName: landlordUser.fullName,
              contractUrl,
              isTenant: false,
            }),
          );
          this.logger.log(`Both-signed email sent to landlord ${landlordUser.email} for contract ${contractId}`);
        }
      } else {
        // First signature — remind the unsigned party
        const isSignerTenant = userId === contract.tenantId;
        const otherPartyUser = isSignerTenant ? landlordUser : tenantUser;
        const signerUser = isSignerTenant ? tenantUser : landlordUser;
        if (otherPartyUser?.email) {
          await this.emailService.sendEmail(
            otherPartyUser.email,
            'Kira Sozlesmesi Imzanizi Bekliyor',
            this.buildCounterpartySignedEmail({
              recipientName: otherPartyUser.fullName,
              signerName: signerUser?.fullName ?? 'Diger taraf',
              contractUrl,
            }),
          );
          this.logger.log(`Counter-party signed email sent to ${otherPartyUser.email} for contract ${contractId}`);
        } else {
          this.logger.warn(`Unsigned party has no email for contract ${contractId} — skipping reminder email`);
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to send sign email for contract ${contractId}: ${err}`);
    }

    this.logger.log(`Contract ${contractId} signed by ${role}, status: ${result}`);
    return this.getContractDetail(contractId);
  }

  /**
   * Activate a contract after both parties have signed.
   * Requires UAVT code for property-owner verification via bank.
   *
   * Steps:
   * 1. Validate UAVT — bank verifies tapu-malik match
   * 2. Check no other active contract exists for same UAVT
   * 3. If actual rent > estimated rent at KMH application, flag for limit adjustment
   * 4. Bank creates payment order and confirms
   * 5. Contract becomes ACTIVE
   */
  async activateContract(
    userId: string,
    contractId: string,
    uavtCode: string,
    kmhAccountId?: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { property: true },
    });

    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.status !== ContractStatus.PENDING_ACTIVATION)
      throw new BadRequestException('Bu sozlesme aktivasyona uygun degil');
    if (contract.tenantId !== userId)
      throw new ForbiddenException('Sadece kiraci sozlesmeyi aktive edebilir');

    // ─── 1. UAVT ile mülk-malik eşleşmesi (banka API placeholder) ───
    // Gerçek entegrasyonda: banka UAVT → tapu → malik TCKN döner,
    // ev sahibi TCKN ile eşleştirilir
    const landlord = await this.prisma.user.findUnique({
      where: { id: contract.landlordId },
      select: { tcknHash: true },
    });

    // PLACEHOLDER: Banka UAVT doğrulaması
    // const bankVerification = await this.bankService.verifyUavtOwnership(uavtCode, landlord.tcknHash);
    // if (!bankVerification.matched) throw new BadRequestException('UAVT ile mulk sahipligi eslesmedi');
    this.logger.log(`UAVT verification placeholder: ${uavtCode} for contract ${contractId}`);

    // ─── 2. Aynı UAVT ile aktif sözleşme var mı? ───
    const existingActive = await this.prisma.contract.findFirst({
      where: {
        uavtCode,
        status: ContractStatus.ACTIVE,
        id: { not: contractId },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'Bu UAVT numarasina ait aktif bir sozlesme zaten mevcut. Ayni mulk icin birden fazla aktif sozlesme olusturulamaz.',
      );
    }

    // ─── 3. KMH hesap kontrolü ve limit ayarlaması ───
    let selectedKmhAccountId: string | undefined;

    if (kmhAccountId) {
      const kmhAccount = await this.prisma.bankAccount.findFirst({
        where: {
          id: kmhAccountId,
          userId,
          accountType: BankAccountType.KMH,
          status: BankAccountStatus.ACTIVE,
        },
      });
      if (!kmhAccount) {
        throw new BadRequestException('Secilen KMH hesabi bulunamadi veya aktif degil');
      }

      const kmhLimit = Number(kmhAccount.creditLimit ?? 0);
      const monthlyRent = Number(contract.monthlyRent);
      if (kmhLimit < monthlyRent) {
        throw new BadRequestException(
          `KMH limitiniz (${kmhLimit.toLocaleString('tr-TR')} TL) sozlesme kira bedelini (${monthlyRent.toLocaleString('tr-TR')} TL) karsilamiyor.`,
        );
      }

      // Check if estimated rent at KMH application was lower than actual contract rent
      // If so, bank may want to adjust the limit
      const kmhApp = await this.prisma.kmhApplication.findFirst({
        where: { userId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      });
      if (kmhApp) {
        const estimatedRent = Number(kmhApp.estimatedRent);
        if (monthlyRent > estimatedRent) {
          // PLACEHOLDER: Bankaya limit güncelleme talebi
          // await this.bankService.requestLimitAdjustment(kmhAccount.id, monthlyRent);
          this.logger.warn(
            `Contract rent (${monthlyRent}) exceeds KMH estimated rent (${estimatedRent}). ` +
            `Bank may adjust limit for account ${kmhAccount.id}.`,
          );
        }
      }

      selectedKmhAccountId = kmhAccount.id;
    } else {
      // Auto-select single KMH account
      const kmhAccounts = await this.prisma.bankAccount.findMany({
        where: {
          userId,
          accountType: BankAccountType.KMH,
          status: BankAccountStatus.ACTIVE,
        },
      });

      if (kmhAccounts.length === 0) {
        throw new BadRequestException('Aktif KMH hesabiniz bulunamadi.');
      }
      if (kmhAccounts.length > 1) {
        throw new BadRequestException('Birden fazla aktif KMH hesabiniz var. Lutfen birini secin.');
      }

      const kmhAccount = kmhAccounts[0];
      const kmhLimit = Number(kmhAccount.creditLimit ?? 0);
      if (kmhLimit < Number(contract.monthlyRent)) {
        throw new BadRequestException(
          `KMH limitiniz (${kmhLimit.toLocaleString('tr-TR')} TL) sozlesme kira bedelini karsilamiyor.`,
        );
      }
      selectedKmhAccountId = kmhAccount.id;
    }

    // ─── 4. Banka onayı: ödeme talimatı oluşturma ───
    let bankActivationRef: string | undefined;
    try {
      const bankResult = await this.bankService.notifyContractSigned(contractId, selectedKmhAccountId);
      bankActivationRef = bankResult.paymentOrderId;
      this.logger.log(`Bank activation confirmed for contract ${contractId}: ${bankResult.message}`);
    } catch (err) {
      this.logger.error(`Bank activation failed for contract ${contractId}: ${(err as Error).message}`);
      throw new BadRequestException(
        'Banka odeme talimati olusturulamadi. Lutfen daha sonra tekrar deneyin.',
      );
    }

    // ─── 5. Aktivasyon: transaction ile ACTIVE'e geçir ───
    await this.prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.ACTIVE,
          uavtCode,
          bankActivationRef,
        },
      });

      // Update property status to RENTED
      await tx.property.update({
        where: { id: contract.propertyId },
        data: { status: 'RENTED' },
      });

      // Auto-add TENANT role if missing
      const tenant = await tx.user.findUniqueOrThrow({
        where: { id: contract.tenantId },
      });
      if (!tenant.roles.includes(UserRole.TENANT)) {
        await tx.user.update({
          where: { id: contract.tenantId },
          data: { roles: { push: UserRole.TENANT } },
        });
      }

      // Generate payment schedule
      const scheduleItems = this.generatePaymentScheduleData(contract);
      if (scheduleItems.length > 0) {
        await tx.paymentSchedule.createMany({ data: scheduleItems });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CONTRACT_ACTIVATED',
          entityType: 'Contract',
          entityId: contractId,
          metadata: { uavtCode, bankActivationRef, kmhAccountId: selectedKmhAccountId },
        },
      });
    });

    // ─── Notifications ───
    try {
      await this.inAppNotificationService.createForMultipleUsers(
        [contract.tenantId, contract.landlordId],
        NotificationType.CONTRACT_ACTIVATED,
        'Sozlesme Aktif',
        'Kira sozlesmesi aktif hale geldi. UAVT dogrulamasi tamamlandi, odeme talimati olusturuldu.',
        'Contract',
        contractId,
      );
    } catch (err) {
      this.logger.warn(`Failed to create activation notification for ${contractId}: ${err}`);
    }

    this.logger.log(`Contract ${contractId} activated with UAVT ${uavtCode}`);
    return this.getContractDetail(contractId);
  }

  async terminate(userId: string, contractId: string, reason: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.tenantId !== userId && contract.landlordId !== userId)
      throw new ForbiddenException('Bu sozlesmenin tarafi degilsiniz');
    if (contract.status !== ContractStatus.ACTIVE)
      throw new BadRequestException('Sadece aktif sozlesmeler feshedilebilir');

    await this.prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.TERMINATED,
          terminatedAt: new Date(),
          terminationReason: reason,
        },
      });

      // Cancel active payment orders
      await tx.paymentOrder.updateMany({
        where: { contractId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      await tx.property.update({
        where: { id: contract.propertyId },
        data: { status: 'ACTIVE' },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CONTRACT_TERMINATED',
          entityType: 'Contract',
          entityId: contractId,
          metadata: { reason },
        },
      });
    });

    // Notify the other party about termination
    try {
      const otherPartyId = userId === contract.tenantId ? contract.landlordId : contract.tenantId;
      await this.inAppNotificationService.create(
        otherPartyId,
        NotificationType.CONTRACT_TERMINATED,
        'Sozlesme Feshedildi',
        `Kira sozlesmesi feshedildi. Sebep: ${reason}`,
        'Contract',
        contractId,
      );
    } catch (err) {
      this.logger.warn(`Failed to create notification for contract termination ${contractId}: ${err}`);
    }

    return this.getContractDetail(contractId);
  }

  async uploadDocumentPhoto(contractId: string, userId: string, photoBase64: string) {
    if (!photoBase64 || photoBase64.length === 0) {
      throw new ForbiddenException('Fotograf verisi bos');
    }

    // Decode and validate MIME type
    const buffer = Buffer.from(photoBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      throw new ForbiddenException('Fotograf cok buyuk (max 5MB)');
    }

    // Check JPEG (FF D8 FF) or PNG (89 50 4E 47) magic bytes
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    if (!isJpeg && !isPng) {
      throw new ForbiddenException('Sadece JPEG ve PNG dosyalari kabul edilir');
    }

    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.tenantId !== userId && contract.landlordId !== userId)
      throw new ForbiddenException('Bu sozlesmenin tarafi degilsiniz');

    const ext = isJpeg ? 'jpg' : 'png';
    const photoKey = `contracts/${contractId}/document-${Date.now()}.${ext}`;

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        documentPhotoUrl: `pending-upload://${photoKey}`,
        documentPhotoKey: photoKey,
      },
    });

    this.logger.log(`Document photo uploaded for contract ${contractId} by user ${userId}`);
    return { photoKey, message: 'Belge kaydedildi. Dosya depolama aktif olunca yuklenecek.' };
  }

  // ─── Helpers ─────────────────────────────

  private generatePaymentScheduleData(contract: {
    id: string;
    monthlyRent: any;
    startDate: Date;
    endDate: Date;
    paymentDayOfMonth: number;
    currency: string;
  }) {
    const items: Array<{
      contractId: string;
      dueDate: Date;
      amount: number;
      currency: string;
      periodLabel: string;
    }> = [];

    const months = [
      'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
      'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik',
    ];

    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const day = contract.paymentDayOfMonth;

    let year = start.getUTCFullYear();
    let month = start.getUTCMonth();

    while (true) {
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const actualDay = Math.min(day, lastDay);
      const dueDate = new Date(Date.UTC(year, month, actualDay));

      if (dueDate > end) break;

      if (dueDate >= start) {
        items.push({
          contractId: contract.id,
          dueDate,
          amount: Number(contract.monthlyRent),
          currency: contract.currency,
          periodLabel: `${months[month]} ${year}`,
        });
      }

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    return items;
  }

  private formatContractSummary(c: any, userId: string) {
    return {
      id: c.id,
      status: c.status,
      monthlyRent: Number(c.monthlyRent),
      startDate: c.startDate.toISOString().split('T')[0],
      endDate: c.endDate.toISOString().split('T')[0],
      propertyTitle: c.property.title,
      tenantName: c.tenant.fullName,
      landlordName: c.landlord.fullName,
      isSigned: c.signatures.some((s: any) => s.userId === userId),
      signatureCount: c.signatures.length,
    };
  }

  private buildContractUrl(contractId: string): string {
    const webUrl = process.env.WEB_URL ?? 'https://kiraguvence.com';
    return `${webUrl}/dashboard/contracts/${contractId}`;
  }

  private buildSignatureRequestEmail(params: {
    recipientName: string;
    otherPartyName: string;
    otherPartyRole: string;
    propertyTitle: string;
    monthlyRent: number;
    startDate: string;
    endDate: string;
    contractUrl: string;
  }): string {
    const { recipientName, otherPartyName, otherPartyRole, propertyTitle, monthlyRent, startDate, endDate, contractUrl } = params;
    return `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #1a56db; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; }
  .body { padding: 28px 32px; color: #333; line-height: 1.6; }
  .details { background: #f0f4ff; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
  .details table { width: 100%; border-collapse: collapse; }
  .details td { padding: 6px 0; font-size: 14px; }
  .details td:first-child { color: #555; width: 40%; }
  .details td:last-child { font-weight: 600; color: #111; }
  .btn { display: inline-block; margin: 24px 0 8px; background: #1a56db; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600; }
  .footer { padding: 16px 32px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #888; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>KiraGuvence — Kira Sozlesmesi</h1></div>
  <div class="body">
    <p>Sayın <strong>${recipientName}</strong>,</p>
    <p><strong>${otherPartyName}</strong> (${otherPartyRole}) tarafindan bir kira sozlesmesi olusturuldu ve imzanizi bekliyor.</p>
    <div class="details">
      <table>
        <tr><td>Mulk</td><td>${propertyTitle}</td></tr>
        <tr><td>Aylik Kira</td><td>${monthlyRent.toLocaleString('tr-TR')} TL</td></tr>
        <tr><td>Baslangic Tarihi</td><td>${startDate}</td></tr>
        <tr><td>Bitis Tarihi</td><td>${endDate}</td></tr>
      </table>
    </div>
    <p>Sozlesmeyi incelemek ve imzalamak icin asagidaki butona tiklayin:</p>
    <a href="${contractUrl}" class="btn">Sozlesmeyi Goruntule ve Imzala</a>
    <p style="font-size:13px; color:#666;">Butonu goremediyseniz su linki kopyalayin:<br><a href="${contractUrl}">${contractUrl}</a></p>
    <p>Herhangi bir sorunuz icin <a href="mailto:info@kiraguvence.com">info@kiraguvence.com</a> adresine yazabilirsiniz.</p>
  </div>
  <div class="footer">Bu e-posta KiraGuvence platformu tarafindan otomatik olarak gonderilmistir.</div>
</div>
</body>
</html>`;
  }

  private buildCounterpartySignedEmail(params: {
    recipientName: string;
    signerName: string;
    contractUrl: string;
  }): string {
    const { recipientName, signerName, contractUrl } = params;
    return `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #1a56db; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; }
  .body { padding: 28px 32px; color: #333; line-height: 1.6; }
  .alert { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 4px; margin: 20px 0; }
  .btn { display: inline-block; margin: 24px 0 8px; background: #1a56db; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600; }
  .footer { padding: 16px 32px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #888; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>KiraGuvence — Imzaniz Gerekiyor</h1></div>
  <div class="body">
    <p>Sayın <strong>${recipientName}</strong>,</p>
    <div class="alert">
      <strong>${signerName}</strong> kira sozlesmesini imzaladi. Sozlesmenin tamamlanmasi icin sizin de imzaniz bekleniyor.
    </div>
    <p>Sozlesmeyi incelemek ve imzalamak icin asagidaki butona tiklayin:</p>
    <a href="${contractUrl}" class="btn">Sozlesmeyi Imzala</a>
    <p style="font-size:13px; color:#666;">Butonu goremediyseniz su linki kopyalayin:<br><a href="${contractUrl}">${contractUrl}</a></p>
    <p>Herhangi bir sorunuz icin <a href="mailto:info@kiraguvence.com">info@kiraguvence.com</a> adresine yazabilirsiniz.</p>
  </div>
  <div class="footer">Bu e-posta KiraGuvence platformu tarafindan otomatik olarak gonderilmistir.</div>
</div>
</body>
</html>`;
  }

  private buildBothSignedEmail(params: {
    recipientName: string;
    contractUrl: string;
    isTenant: boolean;
  }): string {
    const { recipientName, contractUrl, isTenant } = params;
    const actionText = isTenant
      ? 'Sozlesmeyi aktif hale getirmek icin UAVT dogrulamasini tamamlamaniz gerekiyor.'
      : 'Kiracinin UAVT dogrulamasini tamamlamasinı bekliyorsunuz.';
    return `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #059669; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; }
  .body { padding: 28px 32px; color: #333; line-height: 1.6; }
  .success { background: #ecfdf5; border-left: 4px solid #059669; padding: 14px 18px; border-radius: 4px; margin: 20px 0; }
  .btn { display: inline-block; margin: 24px 0 8px; background: #059669; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600; }
  .footer { padding: 16px 32px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #888; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>KiraGuvence — Tum Imzalar Tamamlandi</h1></div>
  <div class="body">
    <p>Sayın <strong>${recipientName}</strong>,</p>
    <div class="success">
      Kira sozlesmesi her iki tarafca imzalandi.
    </div>
    <p>${actionText}</p>
    <a href="${contractUrl}" class="btn">Sozlesmeyi Goruntule</a>
    <p style="font-size:13px; color:#666;">Butonu goremediyseniz su linki kopyalayin:<br><a href="${contractUrl}">${contractUrl}</a></p>
    <p>Herhangi bir sorunuz icin <a href="mailto:info@kiraguvence.com">info@kiraguvence.com</a> adresine yazabilirsiniz.</p>
  </div>
  <div class="footer">Bu e-posta KiraGuvence platformu tarafindan otomatik olarak gonderilmistir.</div>
</div>
</body>
</html>`;
  }
}
