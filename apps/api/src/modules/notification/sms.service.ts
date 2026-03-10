import { Injectable } from '@nestjs/common';
import { SmsResult } from './interfaces/sms-result.interface';

@Injectable()
export abstract class SmsService {
  abstract sendOtp(phone: string, code: string): Promise<SmsResult>;
  abstract sendNotification(phone: string, message: string): Promise<SmsResult>;
}
