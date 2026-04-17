import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class EncryptionService {
  abstract hash(plainText: string): string;
  abstract verify(plainText: string, hash: string): boolean;
}
