import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InAppNotificationService } from '../in-app-notification/in-app-notification.service';
import { SmsService } from '../notification/sms.service';
import { EmailService } from '../notification/email.service';
import { UpdateReminderPreferenceDto } from './dto/reminder-preference.dto';

interface ReminderPrefsRow {
  user_id: string;
  channel_sms: boolean;
  channel_email: boolean;
  remind_7_days: boolean;
  remind_3_days: boolean;
  remind_1_day: boolean;
  overdue_reminder: boolean;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DuePaymentRow {
  payment_id: string;
  due_date: Date;
  amount: number;
  period_label: string;
  tenant_id: string;
  email: string | null;
  phone: string;
  channel_sms: boolean;
  channel_email: boolean;
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class PaymentReminderService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(PaymentReminderService.name);
  private schedulerHandle?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inAppNotification: InAppNotificationService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  onApplicationBootstrap(): void {
    this.schedulerHandle = setInterval(() => {
      this.processReminders().catch((err) =>
        this.logger.error('Reminder processing error', err),
      );
    }, SIX_HOURS_MS);
  }

  onModuleDestroy(): void {
    if (this.schedulerHandle) clearInterval(this.schedulerHandle);
  }

  async getPreferences(userId: string): Promise<Record<string, unknown>> {
    const rows = await this.prisma.$queryRaw<ReminderPrefsRow[]>`
      SELECT user_id, channel_sms, channel_email,
             remind_7_days, remind_3_days, remind_1_day,
             overdue_reminder, enabled, created_at, updated_at
      FROM payment_reminder_prefs
      WHERE user_id = ${userId}::uuid
    `;

    if (rows.length > 0) return this.toResponse(rows[0]);

    return {
      userId,
      enabled: true,
      channelSms: false,
      channelEmail: true,
      remind7Days: true,
      remind3Days: true,
      remind1Day: true,
      overdueReminder: true,
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateReminderPreferenceDto,
  ): Promise<Record<string, unknown>> {
    const enabled = dto.enabled ?? true;
    const channelSms = dto.channelSms ?? false;
    const channelEmail = dto.channelEmail ?? true;
    const remind7Days = dto.remind7Days ?? true;
    const remind3Days = dto.remind3Days ?? true;
    const remind1Day = dto.remind1Day ?? true;
    const overdueReminder = dto.overdueReminder ?? true;

    const existing = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM payment_reminder_prefs WHERE user_id = ${userId}::uuid
    `;

    if (existing.length === 0) {
      await this.prisma.$executeRaw`
        INSERT INTO payment_reminder_prefs
          (user_id, channel_sms, channel_email, remind_7_days, remind_3_days, remind_1_day, overdue_reminder, enabled)
        VALUES
          (${userId}::uuid, ${channelSms}, ${channelEmail}, ${remind7Days}, ${remind3Days}, ${remind1Day}, ${overdueReminder}, ${enabled})
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE payment_reminder_prefs
        SET channel_sms = ${channelSms},
            channel_email = ${channelEmail},
            remind_7_days = ${remind7Days},
            remind_3_days = ${remind3Days},
            remind_1_day = ${remind1Day},
            overdue_reminder = ${overdueReminder},
            enabled = ${enabled},
            updated_at = NOW()
        WHERE user_id = ${userId}::uuid
      `;
    }

    return this.getPreferences(userId);
  }

  async processReminders(): Promise<void> {
    this.logger.log('Processing payment reminders...');

    const [rows7, rows3, rows1, rowsOverdue] = await Promise.all([
      this.query7DayPayments(),
      this.query3DayPayments(),
      this.query1DayPayments(),
      this.queryOverduePayments(),
    ]);

    await Promise.all([
      ...rows7.map((r) => this.dispatchReminder(r, 7, false)),
      ...rows3.map((r) => this.dispatchReminder(r, 3, false)),
      ...rows1.map((r) => this.dispatchReminder(r, 1, false)),
      ...rowsOverdue.map((r) => this.dispatchReminder(r, 0, true)),
    ]);

    const total = rows7.length + rows3.length + rows1.length + rowsOverdue.length;
    this.logger.log(`Reminders dispatched: ${total} total`);
  }

  private query7DayPayments(): Promise<DuePaymentRow[]> {
    return this.prisma.$queryRaw<DuePaymentRow[]>`
      SELECT ps.id AS payment_id, ps.due_date, ps.amount::float8 AS amount,
             ps.period_label, c.tenant_id, u.email, u.phone,
             prp.channel_sms, prp.channel_email
      FROM payment_schedules ps
      JOIN contracts c ON ps.contract_id = c.id
      JOIN users u ON c.tenant_id = u.id
      JOIN payment_reminder_prefs prp ON prp.user_id = c.tenant_id
      WHERE ps.status = 'PENDING'
        AND prp.enabled = TRUE
        AND prp.remind_7_days = TRUE
        AND ps.due_date::date = CURRENT_DATE + INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = c.tenant_id
            AND n.entity_id = ps.id
            AND n.type = 'PAYMENT_DUE'
            AND n.created_at::date = CURRENT_DATE
        )
    `;
  }

  private query3DayPayments(): Promise<DuePaymentRow[]> {
    return this.prisma.$queryRaw<DuePaymentRow[]>`
      SELECT ps.id AS payment_id, ps.due_date, ps.amount::float8 AS amount,
             ps.period_label, c.tenant_id, u.email, u.phone,
             prp.channel_sms, prp.channel_email
      FROM payment_schedules ps
      JOIN contracts c ON ps.contract_id = c.id
      JOIN users u ON c.tenant_id = u.id
      JOIN payment_reminder_prefs prp ON prp.user_id = c.tenant_id
      WHERE ps.status = 'PENDING'
        AND prp.enabled = TRUE
        AND prp.remind_3_days = TRUE
        AND ps.due_date::date = CURRENT_DATE + INTERVAL '3 days'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = c.tenant_id
            AND n.entity_id = ps.id
            AND n.type = 'PAYMENT_DUE'
            AND n.created_at::date = CURRENT_DATE
        )
    `;
  }

  private query1DayPayments(): Promise<DuePaymentRow[]> {
    return this.prisma.$queryRaw<DuePaymentRow[]>`
      SELECT ps.id AS payment_id, ps.due_date, ps.amount::float8 AS amount,
             ps.period_label, c.tenant_id, u.email, u.phone,
             prp.channel_sms, prp.channel_email
      FROM payment_schedules ps
      JOIN contracts c ON ps.contract_id = c.id
      JOIN users u ON c.tenant_id = u.id
      JOIN payment_reminder_prefs prp ON prp.user_id = c.tenant_id
      WHERE ps.status = 'PENDING'
        AND prp.enabled = TRUE
        AND prp.remind_1_day = TRUE
        AND ps.due_date::date = CURRENT_DATE + INTERVAL '1 day'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = c.tenant_id
            AND n.entity_id = ps.id
            AND n.type = 'PAYMENT_DUE'
            AND n.created_at::date = CURRENT_DATE
        )
    `;
  }

  private queryOverduePayments(): Promise<DuePaymentRow[]> {
    return this.prisma.$queryRaw<DuePaymentRow[]>`
      SELECT ps.id AS payment_id, ps.due_date, ps.amount::float8 AS amount,
             ps.period_label, c.tenant_id, u.email, u.phone,
             prp.channel_sms, prp.channel_email
      FROM payment_schedules ps
      JOIN contracts c ON ps.contract_id = c.id
      JOIN users u ON c.tenant_id = u.id
      JOIN payment_reminder_prefs prp ON prp.user_id = c.tenant_id
      WHERE ps.status IN ('PENDING', 'OVERDUE')
        AND prp.enabled = TRUE
        AND prp.overdue_reminder = TRUE
        AND ps.due_date::date = CURRENT_DATE - INTERVAL '1 day'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = c.tenant_id
            AND n.entity_id = ps.id
            AND n.type = 'PAYMENT_OVERDUE'
            AND n.created_at::date = CURRENT_DATE
        )
    `;
  }

  private async dispatchReminder(
    row: DuePaymentRow,
    daysBefore: number,
    isOverdue: boolean,
  ): Promise<void> {
    const amount = row.amount.toLocaleString('tr-TR');
    const dueDate = new Date(row.due_date).toLocaleDateString('tr-TR');

    let title: string;
    let body: string;
    let type: NotificationType;

    if (isOverdue) {
      type = NotificationType.PAYMENT_OVERDUE;
      title = 'Vadesi Gecen Odeme';
      body = `${row.period_label} donemi kira odemeniz (${amount} TL) ${dueDate} tarihinde vadesi gecmistir. Lutfen en kisa surede odeme yapiniz.`;
    } else {
      type = NotificationType.PAYMENT_DUE;
      title = daysBefore === 1 ? 'Kira Odemesi Yarin' : 'Kira Odemesi Hatirlatmasi';
      body =
        daysBefore === 1
          ? `Yarin (${dueDate}) ${row.period_label} donemi kira odemeniz (${amount} TL) bulunmaktadir.`
          : `${daysBefore} gun sonra (${dueDate}) ${row.period_label} donemi kira odemeniz (${amount} TL) bulunmaktadir.`;
    }

    try {
      await this.inAppNotification.create(
        row.tenant_id,
        type,
        title,
        body,
        'PaymentSchedule',
        row.payment_id,
      );
    } catch (err) {
      this.logger.warn(`In-app notification failed for payment ${row.payment_id}: ${err}`);
    }

    if (row.channel_sms && row.phone) {
      try {
        await this.smsService.sendNotification(row.phone, `${title}: ${body}`);
      } catch (err) {
        this.logger.warn(`SMS failed for payment ${row.payment_id}: ${err}`);
      }
    }

    if (row.channel_email && row.email) {
      try {
        await this.emailService.sendEmail(row.email, title, `<h3>${title}</h3><p>${body}</p>`);
      } catch (err) {
        this.logger.warn(`Email failed for payment ${row.payment_id}: ${err}`);
      }
    }

    this.logger.log(
      `Reminder dispatched: ${isOverdue ? 'overdue' : `${daysBefore}d`} for payment ${row.payment_id}`,
    );
  }

  private toResponse(row: ReminderPrefsRow): Record<string, unknown> {
    return {
      userId: row.user_id,
      enabled: row.enabled,
      channelSms: row.channel_sms,
      channelEmail: row.channel_email,
      remind7Days: row.remind_7_days,
      remind3Days: row.remind_3_days,
      remind1Day: row.remind_1_day,
      overdueReminder: row.overdue_reminder,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
