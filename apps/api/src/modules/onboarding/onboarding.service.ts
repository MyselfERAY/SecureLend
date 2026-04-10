import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notification/email.service';
import { SmsService } from '../notification/sms.service';

interface OnboardingStep {
  dayLabel: string;
  entityType: string;
  windowHoursMin: number;
  windowHoursMax: number;
  subject: string;
  buildBody: (name: string) => string;
  buildSms: (name: string) => string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    dayLabel: '24h',
    entityType: 'ONBOARDING_24H',
    windowHoursMin: 23,
    windowHoursMax: 25,
    subject: 'Kiranızı güvence altına almak için 3 adım',
    buildBody: (name: string) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#1a56db">Merhaba ${name},</h2>
        <p>KiraGüvence platformuna hoş geldiniz! Kira ödemelerinizi güvence altına almak için yalnızca <strong>3 adım</strong> yeterli:</p>
        <ol>
          <li style="margin-bottom:12px">
            <strong>Mülkünüzü Ekleyin</strong><br>
            Kiralık mülkünüzün bilgilerini sisteme kaydedin.
          </li>
          <li style="margin-bottom:12px">
            <strong>Sözleşme Oluşturun</strong><br>
            Dijital kira sözleşmenizi dakikalar içinde hazırlayın ve imzalayın.
          </li>
          <li style="margin-bottom:12px">
            <strong>Güvencenizi Aktive Edin</strong><br>
            Ödeme takibi ve güvence sistemini başlatın.
          </li>
        </ol>
        <a href="https://kiraguvence.com/dashboard" style="display:inline-block;background:#1a56db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:10px">
          Hemen Başlayın
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Sorularınız için <a href="mailto:info@kiraguvence.com">info@kiraguvence.com</a> adresine yazabilirsiniz.
        </p>
      </div>
    `,
    buildSms: (name: string) =>
      `Merhaba ${name}! KiraGüvence hesabınız hazır. Mülkünüzü ekleyip sözleşmenizi oluşturmak için: kiraguvence.com/dashboard`,
  },
  {
    dayLabel: '48h',
    entityType: 'ONBOARDING_48H',
    windowHoursMin: 47,
    windowHoursMax: 49,
    subject: 'Platformu henüz keşfetmediniz mi?',
    buildBody: (name: string) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#1a56db">Merhaba ${name},</h2>
        <p>KiraGüvence'ye kaydoldunuz ancak henüz bir mülk eklemediniz. Size neler sunduğumuzu hatırlatmak istedik:</p>
        <ul style="line-height:1.8">
          <li>Dijital kira sözleşmesi ve e-imza</li>
          <li>Otomatik ödeme takibi ve hatırlatmalar</li>
          <li>KMH (Kredili Mevduat Hesabı) finansman seçenekleri</li>
          <li>Güvenli mesajlaşma ve destek</li>
        </ul>
        <a href="https://kiraguvence.com/dashboard/properties" style="display:inline-block;background:#1a56db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:10px">
          Mülk Ekle
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Yardıma ihtiyacınız varsa <a href="mailto:info@kiraguvence.com">info@kiraguvence.com</a> adresine ulaşabilirsiniz.
        </p>
      </div>
    `,
    buildSms: (name: string) =>
      `Merhaba ${name}! Kira güvencenizi henüz oluşturmadınız. Hemen başlamak için: kiraguvence.com/dashboard`,
  },
  {
    dayLabel: '7d',
    entityType: 'ONBOARDING_7D',
    windowHoursMin: 167,
    windowHoursMax: 169,
    subject: 'Son hatırlatma: Kira güvencenizi kurun',
    buildBody: (name: string) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#1a56db">Merhaba ${name},</h2>
        <p>KiraGüvence'ye kaydolmanızın üzerinden bir hafta geçti. Hâlâ kira güvencenizi oluşturmadınız.</p>
        <p>Platformumuzda kayıtlı kullanıcılar:</p>
        <ul style="line-height:1.8">
          <li>Kira ödemelerini %100 güvence altına alıyor</li>
          <li>Sözleşme anlaşmazlıklarında hukuki destek alıyor</li>
          <li>Dijital süreçlerle zamandan tasarruf ediyor</li>
        </ul>
        <a href="https://kiraguvence.com/dashboard" style="display:inline-block;background:#e02424;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:10px">
          Şimdi Başlayın
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Hesabınızı silmek isterseniz <a href="mailto:info@kiraguvence.com">info@kiraguvence.com</a> adresine yazabilirsiniz.
        </p>
      </div>
    `,
    buildSms: (name: string) =>
      `Merhaba ${name}! 7 gündür KiraGüvence'yi kullanmadınız. Kira güvencenizi kurmak için: kiraguvence.com/dashboard`,
  },
];

@Injectable()
export class OnboardingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OnboardingService.name);
  private intervalHandle?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  onModuleInit(): void {
    // Run every 30 minutes
    this.intervalHandle = setInterval(
      () => void this.processOnboardingReminders(),
      30 * 60 * 1000,
    );
    // Initial run after 10 seconds to let DB connections settle
    setTimeout(() => void this.processOnboardingReminders(), 10_000);
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async processOnboardingReminders(): Promise<void> {
    this.logger.debug('Processing onboarding reminders...');

    for (const step of ONBOARDING_STEPS) {
      try {
        await this.processStep(step);
      } catch (err) {
        this.logger.error(
          `Onboarding step ${step.entityType} failed: ${String(err)}`,
        );
      }
    }
  }

  private async processStep(step: OnboardingStep): Promise<void> {
    const now = Date.now();
    const windowStart = new Date(now - step.windowHoursMax * 60 * 60 * 1000);
    const windowEnd = new Date(now - step.windowHoursMin * 60 * 60 * 1000);

    // Find users who registered in the time window and have no contracts yet
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: windowStart, lte: windowEnd },
        isActive: true,
        landlordContracts: { none: {} },
        tenantContracts: { none: {} },
        // Has not already received this step's notification
        notifications: {
          none: { type: NotificationType.SYSTEM, entityType: step.entityType },
        },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
    });

    if (users.length === 0) {
      return;
    }

    this.logger.log(
      `Sending ${step.dayLabel} onboarding reminders to ${users.length} user(s)`,
    );

    for (const user of users) {
      await this.sendReminderToUser(user, step);
    }
  }

  private async sendReminderToUser(
    user: { id: string; fullName: string; phone: string; email: string | null },
    step: OnboardingStep,
  ): Promise<void> {
    const firstName = user.fullName.split(' ')[0] ?? user.fullName;

    // Send email if available, otherwise fall back to SMS only
    if (user.email) {
      await this.emailService.sendEmail(
        user.email,
        step.subject,
        step.buildBody(firstName),
      );
    }

    await this.smsService.sendNotification(
      user.phone,
      step.buildSms(firstName),
    );

    // Record the notification to prevent duplicate sends
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        entityType: step.entityType,
        title: step.subject,
        body: `Onboarding hatırlatma gönderildi (${step.dayLabel})`,
      },
    });

    this.logger.log(
      `Onboarding ${step.dayLabel} reminder sent to user ${user.id}`,
    );
  }
}
