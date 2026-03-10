import { z } from 'zod';
import { validateTckn } from './tckn';

export const tcknSchema = z
  .string()
  .length(11, 'TCKN 11 haneli olmalıdır')
  .regex(/^\d+$/, 'TCKN sadece rakam içermelidir')
  .refine((val) => val[0] !== '0', 'TCKN 0 ile başlayamaz')
  .refine(validateTckn, 'Geçersiz TCKN');

export const createApplicationSchema = z.object({
  tckn: tcknSchema,
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
