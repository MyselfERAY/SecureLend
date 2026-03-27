import { Router } from 'express';
import { KpsService } from '@securelend/kps';
import { z } from 'zod';

const router = Router();

const identityVerificationSchema = z.object({
  tcKimlikNo: z.string().length(11, 'TC Kimlik No 11 haneli olmalıdır'),
  ad: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  soyad: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  dogumYili: z.number().int().min(1900).max(new Date().getFullYear())
});

const kpsService = new KpsService({
  serviceUrl: process.env.KPS_SERVICE_URL || 'https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx',
  timeout: 10000
});

router.post('/verify', async (req, res) => {
  try {
    const validatedData = identityVerificationSchema.parse(req.body);
    
    const result = await kpsService.verifyIdentity(validatedData);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Kimlik doğrulama işlemi başarısız'
      });
    }
    
    res.json({
      success: true,
      valid: result.valid,
      message: result.message
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri formatı',
        errors: error.errors
      });
    }
    
    console.error('Identity verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

export default router;