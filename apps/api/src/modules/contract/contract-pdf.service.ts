import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument = require('pdfkit');

@Injectable()
export class ContractPdfService {
  constructor(private readonly prisma: PrismaService) {}

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
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
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

      // ─── HEADER ───
      doc.fontSize(18).font('Helvetica-Bold').text('KONUT KIRA SOZLESMESI', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
        .text('KiraGuvence.com | Dijital Kira Guvence Platformu', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(8).text(`Sozlesme No: ${contract.id}`, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(8).text(`Olusturulma Tarihi: ${contract.createdAt.toLocaleDateString('tr-TR')}`, { align: 'center' });

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(1);

      // ─── TARAFLAR ───
      this.sectionTitle(doc, 'MADDE 1 - TARAFLAR');

      this.subTitle(doc, 'KIRAYA VEREN (Ev Sahibi)');
      this.fieldRow(doc, 'Ad Soyad', contract.landlord.fullName);
      this.fieldRow(doc, 'T.C. Kimlik No', contract.landlord.tcknMasked);
      if (contract.landlord.phone) this.fieldRow(doc, 'Telefon', contract.landlord.phone);
      if (contract.landlord.email) this.fieldRow(doc, 'E-posta', contract.landlord.email);
      if (contract.landlord.address) this.fieldRow(doc, 'Adres', contract.landlord.address);

      doc.moveDown(0.5);

      this.subTitle(doc, 'KIRACI');
      this.fieldRow(doc, 'Ad Soyad', contract.tenant.fullName);
      this.fieldRow(doc, 'T.C. Kimlik No', contract.tenant.tcknMasked);
      if (contract.tenant.phone) this.fieldRow(doc, 'Telefon', contract.tenant.phone);
      if (contract.tenant.email) this.fieldRow(doc, 'E-posta', contract.tenant.email);
      if (contract.tenant.address) this.fieldRow(doc, 'Adres', contract.tenant.address);

      doc.moveDown(0.8);

      // ─── KIRALANAN ───
      this.sectionTitle(doc, 'MADDE 2 - KIRALANAN TASINMAZ');
      this.fieldRow(doc, 'Tasinmaz Adi', contract.property.title);
      this.fieldRow(doc, 'Adres', [
        contract.property.addressLine1,
        contract.property.addressLine2,
        contract.property.district,
        contract.property.city,
      ].filter(Boolean).join(', '));
      if (contract.property.propertyType) this.fieldRow(doc, 'Tasinmaz Tipi', this.propertyTypeLabel(contract.property.propertyType));
      if (contract.property.roomCount) this.fieldRow(doc, 'Oda Sayisi', `${contract.property.roomCount}`);
      if (contract.property.areaM2) this.fieldRow(doc, 'Alan', `${contract.property.areaM2} m2`);
      if (contract.property.floor != null) this.fieldRow(doc, 'Kat', `${contract.property.floor}/${contract.property.totalFloors ?? '-'}`);
      if (contract.uavtCode) this.fieldRow(doc, 'UAVT Kodu', contract.uavtCode);

      doc.moveDown(0.8);

      // ─── KIRA BEDELI VE ODEME ───
      this.sectionTitle(doc, 'MADDE 3 - KIRA BEDELI VE ODEME KOSULLARI');
      this.fieldRow(doc, 'Aylik Kira Bedeli', `${Number(contract.monthlyRent).toLocaleString('tr-TR')} ${contract.currency}`);
      if (contract.depositAmount) {
        this.fieldRow(doc, 'Depozito', `${Number(contract.depositAmount).toLocaleString('tr-TR')} ${contract.currency}`);
      }
      this.fieldRow(doc, 'Odeme Gunu', `Her ayin ${contract.paymentDayOfMonth}. gunu`);
      this.fieldRow(doc, 'Odeme Yontemi', 'Banka duzenlimm odeme talimati (Konut Mortgage Hesabi)');

      // Show landlord IBAN only to landlord
      if (userId === contract.landlordId && contract.landlordIban) {
        this.fieldRow(doc, 'Alici IBAN', contract.landlordIban);
      }

      doc.moveDown(0.8);

      // ─── SURE ───
      this.sectionTitle(doc, 'MADDE 4 - SOZLESME SURESI');
      this.fieldRow(doc, 'Baslangic Tarihi', contract.startDate.toLocaleDateString('tr-TR'));
      this.fieldRow(doc, 'Bitis Tarihi', contract.endDate.toLocaleDateString('tr-TR'));
      this.fieldRow(doc, 'Ihbar Suresi', `${contract.noticePeriodDays ?? 30} gun`);

      if (contract.rentIncreaseType && contract.rentIncreaseType !== 'NONE') {
        const increaseLabel = contract.rentIncreaseType === 'TUFE' ? 'TUFE 12 aylik ortalama' : `Sabit oran: %${Number(contract.rentIncreaseRate ?? 0)}`;
        this.fieldRow(doc, 'Kira Artis Yontemi', increaseLabel);
      }

      doc.moveDown(0.8);

      // ─── EK KOSULLAR ───
      this.sectionTitle(doc, 'MADDE 5 - EK KOSULLAR');
      this.fieldRow(doc, 'Esyali', contract.furnitureIncluded ? 'Evet' : 'Hayir');
      this.fieldRow(doc, 'Evcil Hayvan', contract.petsAllowed ? 'Izinli' : 'Izinsiz');
      this.fieldRow(doc, 'Alt Kiraya Verme', contract.sublettingAllowed ? 'Izinli' : 'Izinsiz');

      if (contract.terms) {
        doc.moveDown(0.5);
        this.subTitle(doc, 'Genel Kosullar');
        doc.fontSize(9).font('Helvetica').fillColor('#333333').text(contract.terms, { lineGap: 3 });
      }

      if (contract.specialClauses) {
        doc.moveDown(0.5);
        this.subTitle(doc, 'Ozel Kosullar');
        doc.fontSize(9).font('Helvetica').fillColor('#333333').text(contract.specialClauses, { lineGap: 3 });
      }

      doc.moveDown(0.8);

      // ─── GENEL HUKUMLER (TBK 299-378) ───
      this.sectionTitle(doc, 'MADDE 6 - GENEL HUKUMLER');
      const generalClauses = this.getGeneralClauses();
      generalClauses.forEach((clause, idx) => {
        doc.fontSize(9).font('Helvetica').fillColor('#333333')
          .text(`${idx + 1}. ${clause}`, { lineGap: 2 });
        doc.moveDown(0.3);
      });

      // ─── IMZALAR ───
      doc.addPage();
      this.sectionTitle(doc, 'MADDE 7 - IMZALAR VE ONAY');

      if (contract.signatures.length > 0) {
        doc.fontSize(9).font('Helvetica').fillColor('#333333')
          .text('Bu sozlesme asagidaki taraflarca dijital ortamda imzalanmistir:');
        doc.moveDown(0.5);

        contract.signatures.forEach((sig) => {
          const roleLabel = sig.role === 'LANDLORD' ? 'Kiraya Veren' : 'Kiraci';
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
            .text(`${roleLabel}: ${sig.user.fullName}`);
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text(`Imza Tarihi: ${sig.signedAt.toLocaleString('tr-TR')}`);
          doc.fontSize(8).text(`IP Adresi: ${sig.ipAddress}`);
          doc.moveDown(0.5);
        });

        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#888888')
          .text(
            'Dijital imzalar, 6098 sayili Turk Borclar Kanunu ve 5070 sayili Elektronik Imza Kanunu ' +
            'kapsaminda gecerli kabul edilir. Imza sirasinda IP adresi ve zaman damgasi kaydedilmistir.',
            { lineGap: 2 },
          );
      } else {
        doc.fontSize(10).font('Helvetica').fillColor('#999999').text('Henuz imza atilmamistir.');
        doc.moveDown(2);

        // Signature boxes
        const boxY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');

        // Left box - Landlord
        doc.text('KIRAYA VEREN', 50, boxY);
        doc.fontSize(9).font('Helvetica').text(contract.landlord.fullName, 50, boxY + 15);
        doc.moveDown(1);
        doc.moveTo(50, boxY + 80).lineTo(250, boxY + 80).strokeColor('#999999').stroke();
        doc.fontSize(8).text('Imza / Tarih', 50, boxY + 85);

        // Right box - Tenant
        doc.fontSize(9).font('Helvetica-Bold').text('KIRACI', 320, boxY);
        doc.fontSize(9).font('Helvetica').text(contract.tenant.fullName, 320, boxY + 15);
        doc.moveTo(320, boxY + 80).lineTo(520, boxY + 80).strokeColor('#999999').stroke();
        doc.fontSize(8).text('Imza / Tarih', 320, boxY + 85);
      }

      // ─── FOOTER ───
      doc.moveDown(3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(0.5);
      doc.fontSize(7).font('Helvetica').fillColor('#999999')
        .text(
          'Bu sozlesme KiraGuvence.com dijital kira guvence platformu uzerinden olusturulmustur. ' +
          'Sozlesme, 6098 sayili Turk Borclar Kanunu (TBK) madde 299-378 hukumlerine tabidir. ' +
          'Platform, odeme araciligi yapmamakta olup banka duzenli odeme talimati ile kira tahsilati gerceklestirilmektedir.',
          { align: 'center', lineGap: 2 },
        );

      doc.end();
    });
  }

  // ─── Helpers ─────────────────────

  private sectionTitle(doc: PDFKit.PDFDocument, text: string) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a365d').text(text);
    doc.moveDown(0.4);
  }

  private subTitle(doc: PDFKit.PDFDocument, text: string) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#2d3748').text(text);
    doc.moveDown(0.2);
  }

  private fieldRow(doc: PDFKit.PDFDocument, label: string, value: string) {
    const y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#555555').text(`${label}:`, 50, y, { continued: false });
    doc.fontSize(9).font('Helvetica').fillColor('#000000').text(value, 200, y);
    doc.moveDown(0.15);
  }

  private propertyTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      APARTMENT: 'Daire',
      HOUSE: 'Mustakil Ev',
      OFFICE: 'Ofis',
      SHOP: 'Dukkan',
    };
    return labels[type] || type;
  }

  private getGeneralClauses(): string[] {
    return [
      'Kiraci, kiralanan tasinmazi ozene kullanmak ve komsu haklarina saygi gostermekle yukumludur (TBK m.316).',
      'Kiraci, kira bedelini sozlesmede belirtilen tarihte ve sekilde odemekle yukumludur. Odemede temerrut halinde TBK m.315 hukumleri uygulanir.',
      'Kiraci, kiraya verenin yazili izni olmadan kiralananin tamamini veya bir bolumunu ucuncu kisilere devredemez veya alt kiraya veremez (TBK m.322).',
      'Kiralananin olagan kullanimdan kaynaklanan kucuk onarimlar kiraciya, buyuk onarimlar ve yapisal degisiklikler kiraya verene aittir (TBK m.317).',
      'Kiraci, kiralananin mevcut durumunu gosterir bir tutanak ile teslim alir. Sozlesme sonunda ayni durumda iade etmekle yukumludur.',
      'Kiralanan, yalnizca sozlesmede belirtilen amac icin kullanilabilir. Amac disi kullanim fesih sebebidir.',
      'Kiraci, kiralananin icinde veya ortak alanlarda diger kiracilari ve komshulari rahatsiz edecek faaliyetlerde bulunamaz.',
      'Kiraya veren, kiralananin kullanima uygun durumda teslimini ve sozlesme suresince bu durumda muhafazasini saglamakla yukumludur (TBK m.301).',
      'Depozito bedeli, kira sozlesmesinin sona ermesi ve kiralananin eksiksiz iade edilmesi uzerine 3 ay icinde kiraciya iade edilir (TBK m.342).',
      'Kira sozlesmesinin yenilenmesinde kira artisi, bir onceki kira yilinin 12 aylik TUFE ortalamasini gecemez (TBK m.344).',
      'Taraflardan herhangi biri, sozlesme bitis tarihinden en az 15 gun once yazili bildirimde bulunmadigi takdirde sozlesme ayni kosullarla 1 yil uzatilmis sayilir (TBK m.347).',
      'Kiralananin sigorta yukumlulugu aksine anlasmaya varilmadikca kiraya verene aittir.',
      'Kiracinin olumu halinde, birlikte yasayan es veya aile bireyleri ayni kosullarla sozlesmeye devam edebilir (TBK m.333).',
      'Bu sozlesmede yer almayan hususlarda 6098 sayili Turk Borclar Kanunu ile ilgili mevzuat hukumleri uygulanir.',
      'Isbu sozlesmeden dogan uyusmazliklarda kiralananin bulundugu yerdeki Sulh Hukuk Mahkemeleri ve Icra Mudurlugu yetkilidir.',
    ];
  }
}
