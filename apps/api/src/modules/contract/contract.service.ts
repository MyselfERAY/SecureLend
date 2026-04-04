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
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bankService: BankService,
    private readonly inAppNotificationService: InAppNotificationService,
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

    // Notify tenant about new contract
    try {
      await this.inAppNotificationService.create(
        dto.tenantId,
        NotificationType.CONTRACT_CREATED,
        'Yeni Sozlesme Olusturuldu',
        'Sizin icin yeni bir kira sozlesmesi olusturuldu. Lutfen inceleyin ve imzalayin.',
        'Contract',
        contract.id,
      );
    } catch (err) {
      this.logger.warn(`Failed to create notification for contract ${contract.id}: ${err}`);
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

    return {
      id: contract.id,
      status: contract.status,
      landlordIban: contract.landlordIban,
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

    // ─── KMH ZORUNLULUK KONTROLU (Kiraci icin) ───
    let selectedKmhAccountId: string | undefined;
    if (role === UserRole.TENANT) {
      let kmhAccount;

      if (kmhAccountId) {
        // Kiracı belirli bir KMH hesabı seçti
        kmhAccount = await this.prisma.bankAccount.findFirst({
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
      } else {
        // Fallback: tek KMH hesabı varsa otomatik seç
        const kmhAccounts = await this.prisma.bankAccount.findMany({
          where: {
            userId,
            accountType: BankAccountType.KMH,
            status: BankAccountStatus.ACTIVE,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (kmhAccounts.length === 0) {
          throw new BadRequestException(
            'Sozlesme imzalamak icin oncelikle KMH (Kira Mevduat Hesabi) basvurusu yapmaniz ve onboarding isleminizi tamamlamaniz gerekmektedir. Banka sayfasindan KMH basvurusu yapabilirsiniz.',
          );
        }

        if (kmhAccounts.length > 1) {
          throw new BadRequestException(
            'Birden fazla aktif KMH hesabiniz var. Lutfen sozlesme icin kullanmak istediginiz hesabi secin.',
          );
        }

        kmhAccount = kmhAccounts[0];
      }

      const kmhLimit = Number(kmhAccount.creditLimit ?? 0);
      const monthlyRent = Number(contract.monthlyRent);
      if (kmhLimit < monthlyRent) {
        throw new BadRequestException(
          `KMH limitiniz (${kmhLimit.toLocaleString('tr-TR')} TL) sozlesme kira bedelini (${monthlyRent.toLocaleString('tr-TR')} TL) karsilamiyor. Daha yuksek limitli bir KMH basvurusu yapmaniz gerekmektedir.`,
        );
      }

      selectedKmhAccountId = kmhAccount.id;
    }

    // Will this be the second signature (activating the contract)?
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
        newStatus = ContractStatus.ACTIVE;
        await tx.contract.update({
          where: { id: contractId },
          data: { status: ContractStatus.ACTIVE },
        });

        // Update property status to RENTED
        await tx.property.update({
          where: { id: contract.propertyId },
          data: { status: 'RENTED' },
        });

        // Auto-add TENANT role to tenant if missing
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

    // ─── IN-APP NOTIFICATIONS ───
    try {
      if (result === ContractStatus.ACTIVE) {
        // Contract activated: notify both parties
        await this.inAppNotificationService.createForMultipleUsers(
          [contract.tenantId, contract.landlordId],
          NotificationType.CONTRACT_ACTIVATED,
          'Sozlesme Aktif',
          'Kira sozlesmesi her iki tarafca imzalandi ve aktif hale geldi.',
          'Contract',
          contractId,
        );
      } else {
        // Contract signed but not yet active: notify the other party
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

    // ─── BANKA BILDIRIMI (Sozlesme aktif olunca) ───
    if (result === ContractStatus.ACTIVE) {
      try {
        const bankResult = await this.bankService.notifyContractSigned(contractId, selectedKmhAccountId);
        this.logger.log(
          `Bank notified for contract ${contractId}: ${bankResult.message}`,
        );
      } catch (err) {
        // Best-effort: banka bildirimi basarisiz olsa bile sozlesme aktif kalir
        this.logger.error(
          `Failed to notify bank for contract ${contractId}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(`Contract ${contractId} signed by ${role}, status: ${result}`);
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

  async uploadDocumentPhoto(contractId: string, userId: string, _photoBase64: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.tenantId !== userId && contract.landlordId !== userId)
      throw new ForbiddenException('Bu sozlesmenin tarafi degilsiniz');

    const photoKey = `contracts/${contractId}/document-${Date.now()}.jpg`;

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
}
