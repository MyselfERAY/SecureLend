import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

@Injectable()
export class MockEmailService extends EmailService {
  private readonly logger = new Logger(MockEmailService.name);

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
    // Extract the first link from the body for quick debugging
    const linkMatch = htmlBody.match(/href="([^"]+)"/);
    const firstLink = linkMatch ? linkMatch[1] : '(no link)';
    this.logger.log(
      `[MOCK EMAIL] ✉ To: ${to} | Subject: ${subject} | Body: ${htmlBody.length} chars | Link: ${firstLink}`,
    );
  }
}
