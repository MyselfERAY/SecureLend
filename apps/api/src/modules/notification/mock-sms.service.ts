import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SmsService } from './sms.service';
import { SmsResult } from './interfaces/sms-result.interface';

@Injectable()
export class MockSmsService extends SmsService {
  private readonly logger = new Logger(MockSmsService.name);

  async sendOtp(phone: string, code: string): Promise<SmsResult> {
    await this.simulateLatency();
    this.logger.log(`[MOCK SMS] OTP ${code} sent to ${this.maskPhone(phone)}`);
    return { sent: true, messageId: randomUUID(), sentAt: new Date() };
  }

  async sendNotification(phone: string, message: string): Promise<SmsResult> {
    await this.simulateLatency();
    this.logger.log(
      `[MOCK SMS] Notification to ${this.maskPhone(phone)}: ${message}`,
    );
    return { sent: true, messageId: randomUUID(), sentAt: new Date() };
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) return '****';
    return `****${phone.slice(-4)}`;
  }

  private simulateLatency(): Promise<void> {
    return new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
  }
}
