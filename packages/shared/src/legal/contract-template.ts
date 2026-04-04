export const TBK_LEASE_TEMPLATE_VERSION = '1.0';

export const TBK_LEASE_SECTIONS = {
  title: 'KONUT KIRA SOZLESMESI',
  subtitle: 'Turk Borclar Kanunu 299-356. Maddeleri Kapsaminda',
  sections: [
    {
      id: 'parties',
      title: 'MADDE 1 - TARAFLAR',
      template: 'Kiraya Veren (Ev Sahibi): {{landlordName}} (TCKN: {{landlordTckn}})\nKiraci: {{tenantName}} (TCKN: {{tenantTckn}})',
    },
    {
      id: 'property',
      title: 'MADDE 2 - KIRALANAN TASINMAZ',
      template: 'Adres: {{propertyAddress}}\nTasinmaz Tipi: {{propertyType}}',
    },
    {
      id: 'duration',
      title: 'MADDE 3 - KIRA SURESI',
      template: 'Baslangic Tarihi: {{startDate}}\nBitis Tarihi: {{endDate}}\nSozlesme suresi {{durationMonths}} aydir.',
    },
    {
      id: 'rent',
      title: 'MADDE 4 - KIRA BEDELI',
      template: 'Aylik kira bedeli {{monthlyRent}} TL olup, her ayin {{paymentDay}}. gunu odenecektir.',
    },
    {
      id: 'deposit',
      title: 'MADDE 5 - DEPOZITO',
      template: 'Depozito tutari {{depositAmount}} TL olup, sozlesme sonunda tasinmazin eksiksiz teslimi halinde iade edilecektir.',
    },
    {
      id: 'increase',
      title: 'MADDE 6 - KIRA ARTISI',
      template: 'Kira artisi {{increaseType}} bazinda uygulanacaktir. TBK Madde 344 uyarinca, konut kiralarinda yillik artis orani TUFE oranini gecemez.',
    },
    {
      id: 'maintenance',
      title: 'MADDE 7 - BAKIM VE ONARIM',
      template: 'Kiraci, kiralanan tasinmazi ozenle kullanmak ve kucuk onarimlardan sorumludur (TBK 317). Buyuk onarimlar kiraya verene aittir (TBK 301).',
    },
    {
      id: 'termination',
      title: 'MADDE 8 - FESIH VE TAHLIYE',
      template: 'Taraflar, fesih bildirimini en az {{noticePeriodDays}} gun onceden yapmakla yukumludur. TBK 347 uyarinca, kiraci her zaman 15 gun onceden bildirmek kaydiyla sozlesmeyi feshedebilir.',
    },
    {
      id: 'subletting',
      title: 'MADDE 9 - ALT KIRAYA VERME',
      template: '{{sublettingClause}}',
    },
    {
      id: 'furniture',
      title: 'MADDE 10 - DEMIRBASLAR',
      template: '{{furnitureClause}}',
    },
    {
      id: 'pets',
      title: 'MADDE 11 - EVCIL HAYVAN',
      template: '{{petsClause}}',
    },
    {
      id: 'kmh',
      title: 'MADDE 12 - KMH (KIRA MEVDUAT HESABI)',
      template: 'Kiraci, kira odemelerini SecureLend platformu uzerinden KMH hesabi araciligiyla yapacaktir. Bu hesap, kira odemelerinin guvence altina alinmasini saglar.',
    },
    {
      id: 'disputes',
      title: 'MADDE 13 - UYUSMAZLIK',
      template: 'Bu sozlesmeden dogan uyusmazliklarda tasinmazin bulundugu yerdeki sulh hukuk mahkemeleri yetkilidir.',
    },
  ],
};
