export interface KpsIdentityRequest {
  tcKimlikNo: string;
  ad: string;
  soyad: string;
  dogumYili: number;
}

export interface KpsIdentityResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  error?: string;
}

export interface KpsSoapResponse {
  'soap:Envelope': {
    'soap:Body': {
      TCKimlikNoDogrulaResponse?: {
        TCKimlikNoDogrulaResult: string;
      };
      'soap:Fault'?: {
        faultstring: string;
      };
    };
  };
}

export interface KpsConfig {
  serviceUrl: string;
  timeout: number;
}