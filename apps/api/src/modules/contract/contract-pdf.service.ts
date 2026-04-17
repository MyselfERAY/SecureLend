import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import PDFDocument = require('pdfkit');

@Injectable()
export class ContractPdfService {
  private fontDir: string;

  constructor(private readonly prisma: PrismaService) {
    // Resolve font directory — works both locally and in Docker
    const candidates = [
      path.join(process.cwd(), 'assets', 'fonts'),
      path.join(__dirname, '..', '..', '..', 'assets', 'fonts'),
      path.join(process.cwd(), '..', '..', 'apps', 'api', 'assets', 'fonts'),
    ];
    this.fontDir = candidates.find((d) => fs.existsSync(d)) || candidates[0];
  }

  async generatePdf(contractId: string, userId: string): Promise<Buffer> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: true,
        tenant: { select: { id: true, fullName: true, tcknMasked: true, phone: true, email: true, address: true } },
        landlord: { select: { id: true, fullName: true, tcknMasked: true, phone: true, email: true, address: true } },
        signatures: { include: { user: { select: { fullName: true } } } },
      },
    });

    if (!contract) throw new NotFoundException('Sozlesme bulunamadi');
    if (contract.tenantId !== userId && contract.landlordId !== userId) {
      throw new ForbiddenException('Bu sozlesmeye erisim yetkiniz yok');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 55, right: 55 },
        info: {
          Title: `Kira Sozlesmesi - ${contract.property.title}`,
          Author: 'KiraGuvence.com',
          Subject: 'Konut Kira Sozlesmesi',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register Turkish-compatible font
      const fontPath = path.join(this.fontDir, 'NotoSans-Regular.ttf');
      const hasCustomFont = fs.existsSync(fontPath);

      if (hasCustomFont) {
        doc.registerFont('Regular', fontPath);
        doc.registerFont('Bold', fontPath);    // same variable font, we fake bold with size
        doc.registerFont('Italic', path.join(this.fontDir, 'NotoSans-Italic.ttf'));
      }

      const fontR = hasCustomFont ? 'Regular' : 'Helvetica';
      const fontB = hasCustomFont ? 'Bold' : 'Helvetica-Bold';
      const fontI = hasCustomFont ? 'Italic' : 'Helvetica-Oblique';

      // ─── KAPAK / BASLIK ───
      doc.fontSize(16).font(fontB).text('KONUT KiRA SoZLEsMESi', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).font(fontR).fillColor('#444444')
        .text('6098 Sayili Turk Borclar Kanunu Kapsaminda', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#888888')
        .text(`Sozlesme No: ${contract.id}`, { align: 'center' });
      doc.fontSize(8)
        .text(`Duzenleme Tarihi: ${contract.createdAt.toLocaleDateString('tr-TR')}`, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(8)
        .text('KiraGuvence.com - Dijital Kira Guvence Platformu', { align: 'center' });

      doc.moveDown(0.8);
      this.drawLine(doc);
      doc.moveDown(0.8);

      // ─── MADDE 1: TARAFLAR ───
      this.sectionTitle(doc, fontB, 'MADDE 1 - TARAFLAR');

      this.subTitle(doc, fontB, '1.1 KiRAYA VEREN (Ev Sahibi)');
      this.fieldRow(doc, fontB, fontR, 'Ad Soyad', contract.landlord.fullName);
      this.fieldRow(doc, fontB, fontR, 'T.C. Kimlik No', contract.landlord.tcknMasked);
      if (contract.landlord.phone) this.fieldRow(doc, fontB, fontR, 'Telefon', contract.landlord.phone);
      if (contract.landlord.email) this.fieldRow(doc, fontB, fontR, 'E-posta', contract.landlord.email);
      if (contract.landlord.address) this.fieldRow(doc, fontB, fontR, 'Adres', contract.landlord.address);

      doc.moveDown(0.5);

      this.subTitle(doc, fontB, '1.2 KiRACI');
      this.fieldRow(doc, fontB, fontR, 'Ad Soyad', contract.tenant.fullName);
      this.fieldRow(doc, fontB, fontR, 'T.C. Kimlik No', contract.tenant.tcknMasked);
      if (contract.tenant.phone) this.fieldRow(doc, fontB, fontR, 'Telefon', contract.tenant.phone);
      if (contract.tenant.email) this.fieldRow(doc, fontB, fontR, 'E-posta', contract.tenant.email);
      if (contract.tenant.address) this.fieldRow(doc, fontB, fontR, 'Adres', contract.tenant.address);

      doc.moveDown(0.8);

      // ─── MADDE 2: KiRALANAN TASINMAZ ───
      this.sectionTitle(doc, fontB, 'MADDE 2 - KiRALANAN TASINMAZ');
      this.fieldRow(doc, fontB, fontR, 'Tasinmaz Adi', contract.property.title);

      const addressParts = [
        contract.property.addressLine1,
        contract.property.addressLine2,
        contract.property.neighborhood,
        contract.property.street,
        contract.property.district,
        contract.property.city,
      ].filter(Boolean);
      this.fieldRow(doc, fontB, fontR, 'Adres', addressParts.join(', '));

      if (contract.property.propertyType) {
        this.fieldRow(doc, fontB, fontR, 'Tasinmaz Tipi', this.propertyTypeLabel(contract.property.propertyType));
      }
      if (contract.property.roomCount) this.fieldRow(doc, fontB, fontR, 'Oda Sayisi', contract.property.roomCount);
      if (contract.property.areaM2) this.fieldRow(doc, fontB, fontR, 'Brut Alan', `${contract.property.areaM2} m2`);
      if (contract.property.floor != null) {
        this.fieldRow(doc, fontB, fontR, 'Bulundugu Kat / Toplam Kat', `${contract.property.floor} / ${contract.property.totalFloors ?? '-'}`);
      }
      if (contract.uavtCode) this.fieldRow(doc, fontB, fontR, 'UAVT Adres Kodu', contract.uavtCode);

      const extras: string[] = [];
      if (contract.furnitureIncluded) extras.push('Esyali');
      else extras.push('Esyasiz');
      this.fieldRow(doc, fontB, fontR, 'Esya Durumu', extras.join(', '));

      doc.moveDown(0.8);

      // ─── MADDE 3: KiRA BEDELi VE ODEME ───
      this.sectionTitle(doc, fontB, 'MADDE 3 - KiRA BEDELi VE ODEME KOSULLARI');

      const rent = Number(contract.monthlyRent);
      this.fieldRow(doc, fontB, fontR, 'Aylik Kira Bedeli', `${rent.toLocaleString('tr-TR')} ${contract.currency}`);
      if (contract.depositAmount) {
        const dep = Number(contract.depositAmount);
        this.fieldRow(doc, fontB, fontR, 'Depozito (Guven Bedeli)', `${dep.toLocaleString('tr-TR')} ${contract.currency}`);
      }
      this.fieldRow(doc, fontB, fontR, 'Odeme Gunu', `Her ayin ${contract.paymentDayOfMonth}. gunu`);
      this.fieldRow(doc, fontB, fontR, 'Odeme Yontemi', 'Banka duzenli odeme talimati (Kredili Mevduat Hesabi uzerinden)');

      // IBAN only to landlord
      if (userId === contract.landlordId && contract.landlordIban) {
        this.fieldRow(doc, fontB, fontR, 'Alici IBAN', contract.landlordIban);
      }

      doc.moveDown(0.4);
      doc.fontSize(8.5).font(fontR).fillColor('#333333')
        .text(
          '3.1 Kira bedeli, her ay yukarida belirtilen gunde kiracinin KMH (Kredili Mevduat Hesabi) ' +
          'uzerinden banka duzenli odeme talimati ile kiraya verenin hesabina otomatik olarak aktarilir. ' +
          'Platform herhangi bir odeme araciligi yapmamakta olup, tum finansal islemler banka tarafindan gerceklestirilir.',
          { lineGap: 2 },
        );
      doc.moveDown(0.2);
      doc.text(
        '3.2 Kiraci, kira bedelini odemede temerrud ederse (TBK m.315) kiraya veren yazili bildirimle ' +
        'en az otuz gunluk sure vererek sozlesmeyi feshedebilir. Konut kiralarinda bu sure altmis gun olarak uygulanir.',
        { lineGap: 2 },
      );
      doc.moveDown(0.2);
      doc.text(
        '3.3 Depozito bedeli, sozlesme sonunda kiralananin eksiksiz ve hasarsiz teslimi halinde ' +
        '3 (uc) ay icinde kiraciya iade edilir (TBK m.342). Kiraya veren depozito bedelini vadeli ' +
        'mevduat hesabinda tutmak zorundadir.',
        { lineGap: 2 },
      );

      doc.moveDown(0.8);

      // ─── MADDE 4: SOZLESME SURESi VE YENiLEME ───
      this.sectionTitle(doc, fontB, 'MADDE 4 - SoZLESME SURESi VE YENiLEME');
      this.fieldRow(doc, fontB, fontR, 'Baslangic Tarihi', contract.startDate.toLocaleDateString('tr-TR'));
      this.fieldRow(doc, fontB, fontR, 'Bitis Tarihi', contract.endDate.toLocaleDateString('tr-TR'));
      this.fieldRow(doc, fontB, fontR, 'ihbar (Bildirim) Suresi', `${contract.noticePeriodDays ?? 30} gun`);

      if (contract.rentIncreaseType && contract.rentIncreaseType !== 'NONE') {
        const label = contract.rentIncreaseType === 'TUFE'
          ? 'TUFE 12 aylik ortalama (TBK m.344 siniri ile)'
          : `Sabit oran: %${Number(contract.rentIncreaseRate ?? 0)}`;
        this.fieldRow(doc, fontB, fontR, 'Kira Artis Yontemi', label);
      }

      doc.moveDown(0.4);
      doc.fontSize(8.5).font(fontR).fillColor('#333333')
        .text(
          '4.1 Taraflardan herhangi biri, sozlesme bitis tarihinden en az 15 (on bes) gun once ' +
          'yazili bildirimde bulunmadigi takdirde sozlesme ayni kosullarla 1 (bir) yil uzatilmis sayilir (TBK m.347).',
          { lineGap: 2 },
        );
      doc.moveDown(0.2);
      doc.text(
        '4.2 Yenilenen donemde kira bedeli artisi, bir onceki kira yilindaki 12 aylik ' +
        'TUFE ortalamasini gecemez (TBK m.344). Bes yillik kira suresinin sonunda kira bedeli ' +
        'hakim tarafindan emsal kiralara gore belirlenebilir (TBK m.344/3).',
        { lineGap: 2 },
      );
      doc.moveDown(0.2);
      doc.text(
        '4.3 Kiraci, belirli sureli sözlesmede surenin bitiminden en az 15 gun once bildirimde ' +
        'bulunarak sozlesmeyi sona erdirebilir. Kiraya verenin fesih hakki TBK m.350-352 ile sinirlidir.',
        { lineGap: 2 },
      );

      doc.moveDown(0.8);

      // ─── MADDE 5: KiRACININ YUKUMLULUKLERi ───
      this.checkPageSpace(doc, 250);
      this.sectionTitle(doc, fontB, 'MADDE 5 - KiRACININ YUKUMLULUKLERi');
      const tenantObligations = [
        'Kiralanan tasinmazi ozenle kullanmak ve komsu haklarina saygi gostermekle yukumludur (TBK m.316).',
        'Kiralananin olagan kullanimdan kaynaklanan kucuk bakim ve onarimlarini yapmakla yukumludur (TBK m.317).',
        'Kiraya verenin yazili onay vermesi halinde kiralananin tamamini veya bir bolumunu ucuncu kisilere devredebilir veya alt kiraya verebilir (TBK m.322).',
        'Kiralanan yalnizca konut amacli kullanilacaktir. Amac disi kullanim (isyeri, depo vb.) TBK m.316 uyarinca fesih sebebi teskil eder.',
        'Kiralananin icinde veya ortak alanlarda diger sakinleri rahatsiz edecek faaliyetlerde bulunamaz.',
        'Kiralananin mevcut durumunu gosterir tutanak (eklerin ilgili bolumleri) ile teslim alir. Sozlesme sonunda ayni durumda geri teslim etmekle yukumludur.',
        'Kiralanan icin yaptiracagi tadilat veya degisiklikler icin kiraya verenin yazili onayini almak zorundadir (TBK m.321).',
        'Kiralananin ic islerindeki ariza, hasar veya ayiplari derhal kiraya verene bildirmek zorundadir (TBK m.318). Bildirmemekten dogan zararlardan kiraci sorumludur.',
      ];

      tenantObligations.forEach((clause, idx) => {
        doc.fontSize(8.5).font(fontR).fillColor('#333333')
          .text(`5.${idx + 1} ${clause}`, { lineGap: 2 });
        doc.moveDown(0.25);
      });

      doc.moveDown(0.5);

      // ─── MADDE 6: KiRAYA VERENiN YUKUMLULUKLERi ───
      this.checkPageSpace(doc, 180);
      this.sectionTitle(doc, fontB, 'MADDE 6 - KiRAYA VERENiN YUKUMLULUKLERi');
      const landlordObligations = [
        'Kiralanan tasinmazi sozlesmede belirtilen amaca uygun ve kullanima elverisli bir sekilde teslim etmek ve sozlesme suresince bu halde bulundurmak zorundadir (TBK m.301).',
        'Kiralananin yapisal ve buyuk onarimlarini (cati, dis cephe, tesisat vb.) yapmakla yukumludur (TBK m.317).',
        'Kiracinin kiralananin kullanimi ile ilgili yukumluluklerini yerine getirmesi halinde, kiracinin huzurlu kullanimini saglamak zorundadir.',
        'Kiralananin ayipli teslimi halinde kiraci, ayibin giderilmesini, kira bedelinden indirim yapilmasini veya sozlesmenin feshini talep edebilir (TBK m.304-306).',
        'Kiralananin bulundugu binanin sigorta yukumlulugu (yangin, dogal afet) aksine anlasma yoksa kiraya verene aittir.',
        'Kiraya veren, kiralananin zorunlu onarimlarini kiraciya bildirmek ve en az 10 gun onceden haber vermekle yukumludur. Zorunlu onarimlar sirasinda kiracinin kira indirim hakki saklidir (TBK m.319).',
      ];

      landlordObligations.forEach((clause, idx) => {
        doc.fontSize(8.5).font(fontR).fillColor('#333333')
          .text(`6.${idx + 1} ${clause}`, { lineGap: 2 });
        doc.moveDown(0.25);
      });

      doc.moveDown(0.5);

      // ─── MADDE 7: OZeL KOSULLAR ───
      this.checkPageSpace(doc, 120);
      this.sectionTitle(doc, fontB, 'MADDE 7 - OZEL KOSULLAR');

      doc.fontSize(8.5).font(fontR).fillColor('#333333')
        .text(`7.1 Evcil Hayvan: ${contract.petsAllowed ? 'izinlidir.' : 'Kiraya verenin yazili izni olmaksizin evcil hayvan beslenemez.'}`, { lineGap: 2 });
      doc.moveDown(0.2);
      doc.text(`7.2 Alt Kiraya Verme: ${contract.sublettingAllowed ? 'Kiraya verenin bilgisi dahilinde izinlidir.' : 'Kesinlikle yasaktir (TBK m.322).'}`, { lineGap: 2 });
      doc.moveDown(0.2);
      doc.text(`7.3 Esya Durumu: Kiralanan ${contract.furnitureIncluded ? 'esyali olarak teslim edilmistir. Esya listesi ayrica tutulacaktir.' : 'bos (esyasiz) olarak teslim edilmistir.'}`, { lineGap: 2 });

      if (contract.terms) {
        doc.moveDown(0.4);
        this.subTitle(doc, fontB, '7.4 Ek Genel Kosullar');
        doc.fontSize(8.5).font(fontR).fillColor('#333333').text(contract.terms, { lineGap: 2 });
      }

      if (contract.specialClauses) {
        doc.moveDown(0.4);
        this.subTitle(doc, fontB, `7.${contract.terms ? '5' : '4'} Taraflarin Karsilikli Anlasarak Belirledigil Ozel Sartlar`);
        doc.fontSize(8.5).font(fontR).fillColor('#333333').text(contract.specialClauses, { lineGap: 2 });
      }

      doc.moveDown(0.8);

      // ─── MADDE 8: FESiH VE TAHLiYE ───
      this.checkPageSpace(doc, 200);
      this.sectionTitle(doc, fontB, 'MADDE 8 - FESiH VE TAHLiYE');
      const terminationClauses = [
        'Kiraci, belirli sureli sozlesmede surenin bitiminden en az 15 gun once yazili bildirimde bulunarak sozlesmeyi sona erdirebilir. Bildirimin noter veya iadeli taahhutlu mektupla yapilmasi sarttir.',
        'Kiraya veren, TBK m.350 (gereksinim), TBK m.351 (yeni malik gereksinimi) veya TBK m.352 (tahliye taahhudu, iki haklii ihtar, yeniden imar/insaat) hallerinde fesih ve tahliye talep edebilir.',
        'Kira bedelinin 30 gun icinde odenmemesi halinde kiraya veren yazili ihtar ceker. ihtar suresi konut kiralarinda 30 gun, isyeri kiralarinda 10 gundur (TBK m.315).',
        'Bir kira yili icinde iki hakli ihtarin mevcut olmasi halinde kiraya veren, sozlesmenin sona ermesini muteakip 1 ay icinde dava acarak tahliye isteyebilir (TBK m.352/2).',
        'Tahliye sirasinda kiralananin mevcut durum tespit tutanagi duzenlenir. Kiracinin sebep oldugu hasar ve eksiklikler depozito bedelinden mahsup edilir.',
        'Sozlesme feshedildikten sonra kiracinin tasinmazda kalmaya devam etmesi halinde fuzuli isgal hukumleri uygulanir ve ecri misil talep hakki saklidir.',
      ];

      terminationClauses.forEach((clause, idx) => {
        doc.fontSize(8.5).font(fontR).fillColor('#333333')
          .text(`8.${idx + 1} ${clause}`, { lineGap: 2 });
        doc.moveDown(0.25);
      });

      doc.moveDown(0.5);

      // ─── MADDE 9: DiGER HUKUMLER ───
      this.checkPageSpace(doc, 200);
      this.sectionTitle(doc, fontB, 'MADDE 9 - DiGER HUKUMLER');
      const miscClauses = [
        'Bu sozlesmede duzenlenmeyen hususlarda 6098 sayili Turk Borclar Kanunu ile ilgili mevzuat hukumleri uygulanir.',
        'Kiracinin olumu halinde, birlikte yasayan es veya aile bireyleri ayni kosullarla kiraciligin devamini talep edebilir (TBK m.333). Kiraya veren bu durumda sozlesmeyi belirli kosullar disinda sona erdiremez.',
        'isbu sozlesmeden dogan uyusmazliklarda kiralananin bulundugu yerdeki Sulh Hukuk Mahkemeleri ve icra Mudurlugu yetkilidir.',
        'Bu sozlesme toplam 9 (dokuz) maddeden ibaret olup, taraflarin karsilikli iradelerini yansitmaktadir.',
        'Sozlesme, her iki tarafin islak imzasi ile yururluge girer.',
      ];

      miscClauses.forEach((clause, idx) => {
        doc.fontSize(8.5).font(fontR).fillColor('#333333')
          .text(`9.${idx + 1} ${clause}`, { lineGap: 2 });
        doc.moveDown(0.25);
      });

      doc.moveDown(0.8);

      // ─── MADDE 10: MESAFELI SOZLESME VE CAYMA HAKKI (6502) ───
      this.checkPageSpace(doc, 210);
      this.sectionTitle(doc, fontB, 'MADDE 10 - MESAFELI SOZLESME VE CAYMA HAKKI');
      doc.fontSize(8.5).font(fontR).fillColor('#666666')
        .text('(6502 Sayili Tuketicinin Korunmasi Hakkinda Kanun m.48 ve Mesafeli Sozlesmeler Yonetmeligi)', { lineGap: 2 });
      doc.moveDown(0.4);

      const withdrawalClauses = [
        'Isbu kira sozlesmesi, 6502 sayili Tuketicinin Korunmasi Hakkinda Kanun (TKHK) ve Mesafeli Sozlesmeler Yonetmeligi kapsaminda dijital ortamda (mesafeli usulde) akdedilmistir.',
        'Sozlesme taraflarindan tuketici konumundaki kiraci, sozlesmenin kurulmasindan itibaren 14 (on dort) takvim gunu icerisinde herhangi bir gerekce gostermeksizin ve cezai sart odemeksizin sozlesmeden cayma hakkina sahiptir (TKHK m.48/1).',
        'Cayma hakkinin kullanilmasi icin; info@kiraguvence.com adresine yazili e-posta gonderilmesi veya platform uzerindeki "Cayma Bildirimi" formu araciligiyla bildirimde bulunulmasi yeterlidir. Cayma bildirimi aninda cayma suresi kullanilmis sayilir.',
        'Cayma bildiriminin alinmasindan itibaren en gec 14 (on dort) gun icerisinde, tahsil edilen tutarlar odeme aracina gore iade edilir.',
        'Kiracinin acik onayi ile cayma suresi dolmadan ifasina baslanmis hizmetler bakimindan cayma hakki kullanilmayabilir (Yonetmelik m.15). Bu durum, kira sozlesmesi hizmetinin aktif hale gelmesini kapsamaktadir.',
        'Sozlesme kapsaminda uyusmazlik halinde kiraci; Tuketici Hakem Heyeti, Tuketici Mahkemesi veya Ticaret Bakanligi TUBIS sistemi (tuketici.gtb.gov.tr) araciligiyla sikayet basvurusunda bulunabilir.',
      ];

      withdrawalClauses.forEach((clause, idx) => {
        doc.fontSize(8.5).font(fontR).fillColor('#333333')
          .text(`10.${idx + 1} ${clause}`, { lineGap: 2 });
        doc.moveDown(0.25);
      });

      doc.moveDown(0.5);
      doc.fontSize(8).font(fontR).fillColor('#888888')
        .text('ON BILGILENDIRME: Taraflara 6502 sayili TKHK m.48 kapsaminda Mesafeli Sozlesmeler Yonetmeligi\'nin ongoerdugu on bilgilendirme formu sunulmus ve taraflarca okunup anlasilmistir.', { lineGap: 2 });

      doc.moveDown(0.8);

      // ─── iMZALAR ───
      this.checkPageSpace(doc, 220);
      this.drawLine(doc);
      doc.moveDown(0.5);
      this.sectionTitle(doc, fontB, 'iMZALAR');

      doc.fontSize(8.5).font(fontR).fillColor('#555555')
        .text('isbu sozlesme, asagida isimleri ve imzalari bulunan taraflarca okunmus, anlasma saglanarakislak imza ile imzalanmistir.', { lineGap: 2 });
      doc.moveDown(0.8);

      const boxY = doc.y;
      const leftX = 55;
      const rightX = 310;
      const boxWidth = 200;
      const lineSpacing = 22;

      // ─── Left box: KiRAYA VEREN ───
      doc.rect(leftX - 5, boxY - 5, boxWidth + 20, 130).strokeColor('#cccccc').lineWidth(0.5).stroke();

      doc.fontSize(10).font(fontB).fillColor('#1a365d').text('KiRAYA VEREN', leftX, boxY);
      doc.moveDown(0.4);

      const leftFieldY = boxY + 20;
      doc.fontSize(8.5).font(fontB).fillColor('#555555').text('Ad Soyad:', leftX, leftFieldY);
      doc.moveTo(leftX + 55, leftFieldY + 12).lineTo(leftX + boxWidth, leftFieldY + 12).strokeColor('#aaaaaa').lineWidth(0.5).stroke();

      doc.fontSize(8.5).font(fontB).text('T.C. Kimlik No:', leftX, leftFieldY + lineSpacing);
      doc.moveTo(leftX + 80, leftFieldY + lineSpacing + 12).lineTo(leftX + boxWidth, leftFieldY + lineSpacing + 12).strokeColor('#aaaaaa').stroke();

      doc.fontSize(8.5).font(fontB).text('Tarih:', leftX, leftFieldY + lineSpacing * 2);
      doc.moveTo(leftX + 35, leftFieldY + lineSpacing * 2 + 12).lineTo(leftX + boxWidth, leftFieldY + lineSpacing * 2 + 12).strokeColor('#aaaaaa').stroke();

      doc.fontSize(8.5).font(fontB).text('imza:', leftX, leftFieldY + lineSpacing * 3);
      // Empty space for signature

      // ─── Right box: KiRACI ───
      doc.rect(rightX - 5, boxY - 5, boxWidth + 20, 130).strokeColor('#cccccc').lineWidth(0.5).stroke();

      doc.fontSize(10).font(fontB).fillColor('#1a365d').text('KiRACI', rightX, boxY);

      const rightFieldY = boxY + 20;
      doc.fontSize(8.5).font(fontB).fillColor('#555555').text('Ad Soyad:', rightX, rightFieldY);
      doc.moveTo(rightX + 55, rightFieldY + 12).lineTo(rightX + boxWidth, rightFieldY + 12).strokeColor('#aaaaaa').lineWidth(0.5).stroke();

      doc.fontSize(8.5).font(fontB).text('T.C. Kimlik No:', rightX, rightFieldY + lineSpacing);
      doc.moveTo(rightX + 80, rightFieldY + lineSpacing + 12).lineTo(rightX + boxWidth, rightFieldY + lineSpacing + 12).strokeColor('#aaaaaa').stroke();

      doc.fontSize(8.5).font(fontB).text('Tarih:', rightX, rightFieldY + lineSpacing * 2);
      doc.moveTo(rightX + 35, rightFieldY + lineSpacing * 2 + 12).lineTo(rightX + boxWidth, rightFieldY + lineSpacing * 2 + 12).strokeColor('#aaaaaa').stroke();

      doc.fontSize(8.5).font(fontB).text('imza:', rightX, rightFieldY + lineSpacing * 3);
      // Empty space for signature

      doc.y = boxY + 145;

      // ─── FOOTER ───
      doc.moveDown(1.5);
      this.drawLine(doc);
      doc.moveDown(0.4);
      doc.fontSize(7).font(fontR).fillColor('#999999')
        .text(
          'Bu sozlesme KiraGuvence.com kira guvence platformu uzerinden dijital ortamda (mesafeli usulde) olusturulmustur. ' +
          '6098 sayili TBK m.299-378 hukumlerine tabi olup 6502 sayili TKHK m.48 kapsaminda cayma hakki bildirimi icermektedir. ' +
          'Platform odeme araciligi yapmamakta olup, kira tahsilati banka duzenli odeme talimati ile gerceklestirilmektedir. ' +
          'Sikayet: info@kiraguvence.com | TUBIS: tuketici.gtb.gov.tr',
          { align: 'center', lineGap: 2 },
        );

      doc.end();
    });
  }

  // ─── Helpers ─────────────────────

  private sectionTitle(doc: PDFKit.PDFDocument, fontB: string, text: string) {
    doc.fontSize(11).font(fontB).fillColor('#1a365d').text(text);
    doc.moveDown(0.35);
  }

  private subTitle(doc: PDFKit.PDFDocument, fontB: string, text: string) {
    doc.fontSize(9.5).font(fontB).fillColor('#2d3748').text(text);
    doc.moveDown(0.2);
  }

  private fieldRow(doc: PDFKit.PDFDocument, fontB: string, fontR: string, label: string, value: string) {
    const y = doc.y;
    doc.fontSize(8.5).font(fontB).fillColor('#555555').text(`${label}:`, 55, y, { continued: false });
    doc.fontSize(8.5).font(fontR).fillColor('#000000').text(value, 210, y);
    doc.moveDown(0.15);
  }

  private drawLine(doc: PDFKit.PDFDocument) {
    doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor('#cccccc').stroke();
  }

  private checkPageSpace(doc: PDFKit.PDFDocument, needed: number) {
    if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  private propertyTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      APARTMENT: 'Daire',
      HOUSE: 'Mustakil Ev',
      VILLA: 'Villa',
      OFFICE: 'Ofis',
      SHOP: 'Dukkan',
      COMMERCIAL: 'Ticari',
    };
    return labels[type] || type;
  }
}
