import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

@Injectable()
export class MockEmailService extends EmailService {
  private readonly logger = new Logger(MockEmailService.name);

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
    this.logger.log(
      `[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${htmlBody.length} chars`,
    );
  }
}
