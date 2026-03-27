import * as soap from 'soap';
import { parseString } from 'xml2js';
import { KpsIdentityRequest, KpsIdentityResponse, KpsSoapResponse, KpsConfig } from './types';

export class KpsService {
  private config: KpsConfig;

  constructor(config: KpsConfig) {
    this.config = config;
  }

  async verifyIdentity(request: KpsIdentityRequest): Promise<KpsIdentityResponse> {
    try {
      const soapEnvelope = this.buildSoapEnvelope(request);
      
      const response = await this.sendSoapRequest(soapEnvelope);
      
      return this.parseSoapResponse(response);
    } catch (error) {
      console.error('KPS identity verification error:', error);
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildSoapEnvelope(request: KpsIdentityRequest): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TCKimlikNoDogrula xmlns="http://tckimlik.nvi.gov.tr/WS">
      <TCKimlikNo>${request.tcKimlikNo}</TCKimlikNo>
      <Ad>${request.ad}</Ad>
      <Soyad>${request.soyad}</Soyad>
      <DogumYili>${request.dogumYili}</DogumYili>
    </TCKimlikNoDogrula>
  </soap:Body>
</soap:Envelope>`;
  }

  private async sendSoapRequest(soapEnvelope: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tckimlik.nvi.gov.tr/WS/TCKimlikNoDogrula'
        },
        body: soapEnvelope,
        timeout: this.config.timeout
      };

      fetch(this.config.serviceUrl, options)
        .then(response => response.text())
        .then(resolve)
        .catch(reject);
    });
  }

  private parseSoapResponse(xmlResponse: string): Promise<KpsIdentityResponse> {
    return new Promise((resolve) => {
      parseString(xmlResponse, (err, result: KpsSoapResponse) => {
        if (err) {
          resolve({
            success: false,
            valid: false,
            error: 'XML parsing error'
          });
          return;
        }

        const body = result['soap:Envelope']['soap:Body'];
        
        if (body['soap:Fault']) {
          resolve({
            success: false,
            valid: false,
            error: body['soap:Fault'].faultstring
          });
          return;
        }

        if (body.TCKimlikNoDogrulaResponse) {
          const isValid = body.TCKimlikNoDogrulaResponse.TCKimlikNoDogrulaResult === 'true';
          resolve({
            success: true,
            valid: isValid,
            message: isValid ? 'Identity verified' : 'Identity not verified'
          });
        } else {
          resolve({
            success: false,
            valid: false,
            error: 'Invalid response format'
          });
        }
      });
    });
  }
}