/** DB'deki eski ASCII Türkçe metinleri düzeltir (category, tag vb.) */
const turkishMap: Record<string, string> = {
  'Guvenli Odeme': 'Güvenli Ödeme',
  'Kiraci Rehberi': 'Kiracı Rehberi',
  'Kira Sozlesmesi': 'Kira Sözleşmesi',
  'Kira Guvencesi': 'Kira Güvencesi',
  'Ev Sahibi Icin': 'Ev Sahibi İçin',
  'Kiraci Icin': 'Kiracı İçin',
  'Odeme Rehberi': 'Ödeme Rehberi',
  'Sozlesme Rehberi': 'Sözleşme Rehberi',
  'Guvence Rehberi': 'Güvence Rehberi',
};

export function fixTurkish(text: string): string {
  return turkishMap[text] || text;
}
