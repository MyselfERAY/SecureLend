import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class EmailService {
  abstract sendEmail(to: string, subject: string, htmlBody: string): Promise<void>;
}
