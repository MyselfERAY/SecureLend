import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InAppNotificationService } from '../in-app-notification/in-app-notification.service';
import { EmailService } from '../notification/email.service';

interface ExpiringContractRow {
  contract_id: string;
  monthly_rent: number;
  end_date: Date;
  tenant_id: string;
  landlord_id: string;
  tenant_email: string | null;
  landlord_email: string | null;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ContractRenewalService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ContractRenewalService.name);
  private schedulerHandle?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inAppNotification: InAppNotificationService,
    private readonly emailService: EmailService,
  ) {}

  onApplicationBootstrap(): void {
    this.schedulerHandle = setInterval(() => {
      this.processRenewalReminders().catch((err) =>
        this.logger.error('Renewal reminder processing error', err),
      );
    }, TWENTY_FOUR_HOURS_MS);
  }

  onModuleDestroy(): void {
    if (this.schedulerHandle) clearInterval(this.schedulerHandle);
  }

  async processRenewalReminders(): Promise<void> {
    this.logger.log('Processing contract renewal reminders...');

    const [r60, r30, r7] = await Promise.all([
      this.queryExpiringContracts60(),
      this.queryExpiringContracts30(),
      this.queryExpiringContracts7(),
    ]);

    await Promise.all([
      ...r60.map((c) => this.dispatchReminder(c, 60)),
      ...r30.map((c) => this.dispatchReminder(c, 30)),
      ...r7.map((c) => this.dispatchReminder(c, 7)),
    ]);

    const total = r60.length + r30.length + r7.length;
    this.logger.log(`Contract renewal reminders dispatched: ${total} total`);
  }

  private queryExpiringContracts60(): Promise<ExpiringContractRow[]> {
    return this.prisma.$queryRaw<ExpiringContractRow[]>`
      SELECT c.id AS contract_id,
             c.monthly_rent::float8 AS monthly_rent,
             c.end_date,
             c.tenant_id,
             c.landlord_id,
             t.email AS tenant_email,
             l.email AS landlord_email
      FROM contracts c
      JOIN users t ON c.tenant_id = t.id
      JOIN users l ON c.landlord_id = l.id
      WHERE c.status = 'ACTIVE'
        AND c.end_date::date = CURRENT_DATE + INTERVAL '60 days'
        AND NOT EXISTS (
          SELECT 1 FROM contract_renewal_reminder_logs rrl
          WHERE rrl.contract_id = c.id AND rrl.days_before = 60
        )
    `;
  }

  private queryExpiringContracts30(): Promise<ExpiringContractRow[]> {
    return this.prisma.$queryRaw<ExpiringContractRow[]>`
      SELECT c.id AS contract_id,
             c.monthly_rent::float8 AS monthly_rent,
             c.end_date,
             c.tenant_id,
             c.landlord_id,
             t.email AS tenant_email,
             l.email AS landlord_email
      FROM contracts c
      JOIN users t ON c.tenant_id = t.id
      JOIN users l ON c.landlord_id = l.id
      WHERE c.status = 'ACTIVE'
        AND c.end_date::date = CURRENT_DATE + INTERVAL '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM contract_renewal_reminder_logs rrl
          WHERE rrl.contract_id = c.id AND rrl.days_before = 30
        )
    `;
  }

  private queryExpiringContracts7(): Promise<ExpiringContractRow[]> {
    return this.prisma.$queryRaw<ExpiringContractRow[]>`
      SELECT c.id AS contract_id,
             c.monthly_rent::float8 AS monthly_rent,
             c.end_date,
             c.tenant_id,
             c.landlord_id,
             t.email AS tenant_email,
             l.email AS landlord_email
      FROM contracts c
      JOIN users t ON c.tenant_id = t.id
      JOIN users l ON c.landlord_id = l.id
      WHERE c.status = 'ACTIVE'
        AND c.end_date::date = CURRENT_DATE + INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM contract_renewal_reminder_logs rrl
          WHERE rrl.contract_id = c.id AND rrl.days_before = 7
        )
    `;
  }

  private async dispatchReminder(
    contract: ExpiringContractRow,
    daysBefore: number,
  ): Promise<void> {
    const rent = contract.monthly_rent.toLocaleString('tr-TR');
    const endDate = new Date(contract.end_date).toLocaleDateString('tr-TR');
    const title = `Sozlesme Yenileme — ${daysBefore} Gun Kaldi`;
    const body =
      `Kira sozlesmeniz ${endDate} tarihinde sona eriyor. Aylik kira: ${rent} TL. ` +
      `Yenilemek veya sonlandirmak icin sozlesme detaylarini inceleyin.`;

    try {
      await this.inAppNotification.createForMultipleUsers(
        [contract.tenant_id, contract.landlord_id],
        NotificationType.SYSTEM,
        title,
        body,
        'ContractRenewal',
        contract.contract_id,
      );
    } catch (err) {
      this.logger.warn(
        `In-app notification failed for contract ${contract.contract_id}: ${err}`,
      );
    }

    const webUrl = process.env['WEB_URL'] ?? 'https://kiraguvence.com';
    const contractUrl = `${webUrl}/dashboard/contracts/${contract.contract_id}`;
    const emailHtml = `
      <h2 style="color:#1e293b">Sozlesme Yenileme Hatirlatmasi</h2>
      <p>Kira sozlesmeniz <strong>${endDate}</strong> tarihinde sona eriyor.</p>
      <p>Aylik kira: <strong>${rent} TL</strong></p>
      <p><strong>${daysBefore} gun</strong> kaldi. Yenileme kararinizi platforma bildirin.</p>
      <a href="${contractUrl}"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
        Sozlesmemi Yenile
      </a>
    `;

    if (contract.tenant_email) {
      await this.emailService
        .sendEmail(contract.tenant_email, title, emailHtml)
        .catch((err) =>
          this.logger.warn(`Tenant email failed for contract ${contract.contract_id}: ${err}`),
        );
    }

    if (contract.landlord_email) {
      await this.emailService
        .sendEmail(contract.landlord_email, title, emailHtml)
        .catch((err) =>
          this.logger.warn(`Landlord email failed for contract ${contract.contract_id}: ${err}`),
        );
    }

    await this.prisma.$executeRaw`
      INSERT INTO contract_renewal_reminder_logs (contract_id, days_before)
      VALUES (${contract.contract_id}::uuid, ${daysBefore})
    `;

    this.logger.log(
      `Renewal reminder (${daysBefore}d) dispatched for contract ${contract.contract_id}`,
    );
  }
}
