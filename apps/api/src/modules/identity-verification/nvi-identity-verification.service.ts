import { Injectable, Logger } from '@nestjs/common';
import { IdentityVerificationService } from './identity-verification.service';
import { IdentityResult } from './interfaces/identity-result.interface';

@Injectable()
export class NviIdentityVerificationService extends IdentityVerificationService {
  private readonly logger = new Logger(NviIdentityVerificationService.name);
  private readonly nviUrl =
    'https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx';

  async verifyIdentity(_tckn: string): Promise<IdentityResult> {
    this.logger.warn(
      'verifyIdentity called without birthYear/name — cannot query NVI',
    );
    return { verified: false, verifiedAt: new Date() };
  }

  async verifyByTcknAndBirthYear(
    tckn: string,
    birthYear: number,
    firstName: string,
    lastName: string,
  ): Promise<IdentityResult> {
    const envelope = this.buildSoapEnvelope(tckn, firstName, lastName, birthYear);

    try {
      const response = await fetch(this.nviUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: 'http://tckimlik.nvi.gov.tr/WS/TCKimlikNoDogrula',
        },
        body: envelope,
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.error(`NVI HTTP error: ${response.status}`);
        throw new Error('NVI servisi yanıt vermedi');
      }

      const text = await response.text();
      const verified = this.parseResult(text);

      return {
        verified,
        fullName: verified ? `${firstName} ${lastName}` : undefined,
        verifiedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        'NVI verification failed',
        error instanceof Error ? error.message : String(error),
      );
      throw new Error('Kimlik doğrulama servisi geçici olarak kullanılamıyor');
    }
  }

  private buildSoapEnvelope(
    tckn: string,
    firstName: string,
    lastName: string,
    birthYear: number,
  ): string {
    const safeFirst = this.escapeXml(firstName.toUpperCase());
    const safeLast = this.escapeXml(lastName.toUpperCase());
    return (
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
      ' xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
      ' xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
      '<soap:Body>' +
      '<TCKimlikNoDogrula xmlns="http://tckimlik.nvi.gov.tr/WS">' +
      `<TCKimlikNo>${tckn}</TCKimlikNo>` +
      `<Ad>${safeFirst}</Ad>` +
      `<Soyad>${safeLast}</Soyad>` +
      `<DogumYili>${birthYear}</DogumYili>` +
      '</TCKimlikNoDogrula>' +
      '</soap:Body>' +
      '</soap:Envelope>'
    );
  }

  private parseResult(xml: string): boolean {
    const match =
      /<TCKimlikNoDogrulaResult>(true|false)<\/TCKimlikNoDogrulaResult>/.exec(
        xml,
      );
    return match?.[1] === 'true';
  }

  private escapeXml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
