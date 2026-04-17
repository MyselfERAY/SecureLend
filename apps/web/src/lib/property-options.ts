/**
 * Mülk formu için ortak seçenekler.
 *
 * Hem onboarding wizard hem dashboard Mülklerim sayfası aynı kaynağı
 * kullansın ki kullanıcı iki yerde farklı opsiyon görmesin ve DB'de
 * aynı değerler tutulsun.
 *
 * DİKKAT: propertyType değerleri backend DTO enum'u ile eşleşmek zorunda
 * (apps/api/src/modules/property/dto/create-property.dto.ts).
 */

export const PROPERTY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'APARTMENT', label: 'Daire' },
  { value: 'HOUSE', label: 'Müstakil Ev' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STUDIO', label: 'Stüdyo' },
  { value: 'OFFICE', label: 'Ofis' },
  { value: 'SHOP', label: 'Dükkan' },
  { value: 'COMMERCIAL', label: 'Ticari' },
  { value: 'OTHER', label: 'Diğer' },
];

export const ROOM_COUNT_OPTIONS: string[] = [
  '1+0',
  '1+1',
  '2+1',
  '3+1',
  '3+2',
  '4+1',
  '4+2',
  '5+1',
  '5+2',
  '6+1',
  '6+2',
];

export const PROPERTY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);
