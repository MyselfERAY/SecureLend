export { validateTckn } from './validation/tckn';
export { tcknSchema, createApplicationSchema } from './validation/schemas';
export type { CreateApplicationInput } from './validation/schemas';
export { maskTckn } from './utils/tckn-mask';
export { validateTurkishIban } from './validators/iban';
export type {
  JSendSuccess,
  JSendFail,
  JSendError,
  JSendResponse,
} from './types/api-response';
export { ApplicationStatus } from './types/application';
export type { ApplicationResult } from './types/application';
export { TBK_LEASE_TEMPLATE_VERSION, TBK_LEASE_SECTIONS } from './legal/contract-template';
export {
  KVKK_VERSION,
  KVKK_AYDINLATMA_METNI,
  KVKK_ACIK_RIZA_METNI,
  KVKK_ACIK_RIZA_KMH_METNI,
  GIZLILIK_POLITIKASI,
  KULLANIM_KOSULLARI,
} from './legal/kvkk-texts';
export {
  ON_BILGILENDIRME_FORMU_VERSION,
  ON_BILGILENDIRME_FORMU_METNI,
  CAYMA_HAKKI_METNI,
} from './legal/on-bilgilendirme';
