import { Injectable, ForbiddenException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface TenantScoreResult {
  userId: string;
  overallScore: number;
  timelinessScore: number;
  regularityScore: number;
  amountAccuracyScore: number;
  totalEligiblePayments: number;
  completedPayments: number;
  onTimePayments: number;
  latePayments: number;
  partialPayments: number;
  overduePayments: number;
  isReliableTenant: boolean;
  depositDiscountPercent: number;
  hasEnoughData: boolean;
  lastCalculatedAt: string;
}

// Skor eşikleri
const SCORE_RELIABLE_THRESHOLD = 80;   // Güvenilir Kiracı etiketi
const SCORE_DISCOUNT_30_THRESHOLD = 90; // %30 depozito indirimi
const SCORE_DISCOUNT_20_THRESHOLD = 80; // %20 depozito indirimi
const SCORE_DISCOUNT_10_THRESHOLD = 70; // %10 depozito indirimi

// Zamanindelik ağırlıkları (gecikme günü → puan katsayısı)
function timelinessWeight(daysLate: number): number {
  if (daysLate <= 0) return 1.0;   // Vade gününde veya erken
  if (daysLate <= 3) return 0.75;  // 1-3 gün gecikme
  if (daysLate <= 7) return 0.50;  // 4-7 gün gecikme
  return 0.20;                      // 7+ gün gecikme
}

@Injectable()
export class TenantScoreService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiracının tüm ödeme geçmişinden güvenilirlik skoru hesaplar
   * ve tenant_reliability_score tablosuna kaydeder.
   */
  async calculateAndSave(tenantId: string): Promise<TenantScoreResult> {
    const payments = await this.prisma.paymentSchedule.findMany({
      where: { contract: { tenantId } },
    });

    const completed = payments.filter((p) => p.status === PaymentStatus.COMPLETED);
    const overdue = payments.filter((p) => p.status === PaymentStatus.OVERDUE);
    const failed = payments.filter((p) => p.status === PaymentStatus.FAILED);
    // Skorlamaya dahil edilen ödemeler: tamamlanan + geciken + başarısız
    const eligible = completed.length + overdue.length + failed.length;

    const hasEnoughData = eligible >= 1;

    let timelinessScore = 0;
    let regularityScore = hasEnoughData ? 40 : 0;
    let amountAccuracyScore = 0;
    let onTimePayments = 0;
    let latePayments = 0;
    let partialPayments = 0;

    if (completed.length > 0) {
      // --- Zamanindelik Skoru (0-40 puan) ---
      let timelinessSum = 0;
      for (const p of completed) {
        const daysLate =
          p.paidAt
            ? Math.max(0, Math.floor((p.paidAt.getTime() - p.dueDate.getTime()) / 86_400_000))
            : 0;
        const w = timelinessWeight(daysLate);
        timelinessSum += w;
        if (daysLate <= 0) {
          onTimePayments++;
        } else {
          latePayments++;
        }
      }
      timelinessScore = (timelinessSum / completed.length) * 40;

      // --- Tutar Doğruluğu Skoru (0-20 puan) ---
      let amountSum = 0;
      for (const p of completed) {
        const paid = Number(p.paidAmount ?? p.amount);
        const due = Number(p.amount);
        const ratio = due > 0 ? Math.min(1, paid / due) : 1;
        if (ratio < 1.0) partialPayments++;
        amountSum += ratio;
      }
      amountAccuracyScore = (amountSum / completed.length) * 20;
    }

    // --- Düzenlilik Skoru (0-40 puan) ---
    if (eligible > 0) {
      const irregular = overdue.length + failed.length;
      regularityScore = (1 - irregular / eligible) * 40;
    }

    const overallScore = round1(timelinessScore + regularityScore + amountAccuracyScore);
    const isReliableTenant = hasEnoughData && overallScore >= SCORE_RELIABLE_THRESHOLD;
    const depositDiscountPercent = !hasEnoughData
      ? 0
      : overallScore >= SCORE_DISCOUNT_30_THRESHOLD
        ? 30
        : overallScore >= SCORE_DISCOUNT_20_THRESHOLD
          ? 20
          : overallScore >= SCORE_DISCOUNT_10_THRESHOLD
            ? 10
            : 0;

    const now = new Date();

    // Upsert: user_id başına tek kayıt
    await this.prisma.$executeRaw`
      INSERT INTO tenant_reliability_score (
        id, user_id, overall_score, timeliness_score, regularity_score,
        amount_accuracy_score, total_payments, completed_payments,
        on_time_payments, late_payments, partial_payments, overdue_payments,
        is_reliable_tenant, deposit_discount_percent,
        last_calculated_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${tenantId}::uuid,
        ${round1(overallScore)},
        ${round1(timelinessScore)},
        ${round1(regularityScore)},
        ${round1(amountAccuracyScore)},
        ${eligible},
        ${completed.length},
        ${onTimePayments},
        ${latePayments},
        ${partialPayments},
        ${overdue.length},
        ${isReliableTenant},
        ${depositDiscountPercent},
        ${now},
        ${now},
        ${now}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        overall_score           = EXCLUDED.overall_score,
        timeliness_score        = EXCLUDED.timeliness_score,
        regularity_score        = EXCLUDED.regularity_score,
        amount_accuracy_score   = EXCLUDED.amount_accuracy_score,
        total_payments          = EXCLUDED.total_payments,
        completed_payments      = EXCLUDED.completed_payments,
        on_time_payments        = EXCLUDED.on_time_payments,
        late_payments           = EXCLUDED.late_payments,
        partial_payments        = EXCLUDED.partial_payments,
        overdue_payments        = EXCLUDED.overdue_payments,
        is_reliable_tenant      = EXCLUDED.is_reliable_tenant,
        deposit_discount_percent = EXCLUDED.deposit_discount_percent,
        last_calculated_at      = EXCLUDED.last_calculated_at,
        updated_at              = EXCLUDED.updated_at
    `;

    return {
      userId: tenantId,
      overallScore: round1(overallScore),
      timelinessScore: round1(timelinessScore),
      regularityScore: round1(regularityScore),
      amountAccuracyScore: round1(amountAccuracyScore),
      totalEligiblePayments: eligible,
      completedPayments: completed.length,
      onTimePayments,
      latePayments,
      partialPayments,
      overduePayments: overdue.length,
      isReliableTenant,
      depositDiscountPercent,
      hasEnoughData,
      lastCalculatedAt: now.toISOString(),
    };
  }

  /** Kiracı kendi skorunu görüntüler. */
  async getMyScore(userId: string): Promise<TenantScoreResult> {
    return this.calculateAndSave(userId);
  }

  /**
   * Ev sahibi, aktif/geçmiş sözleşmesi olan kiracının skorunu görüntüler.
   * Sözleşme yoksa ForbiddenException fırlatır.
   */
  async getTenantScore(requestingUserId: string, tenantId: string): Promise<TenantScoreResult> {
    const contract = await this.prisma.contract.findFirst({
      where: { landlordId: requestingUserId, tenantId },
      select: { id: true },
    });
    if (!contract) {
      throw new ForbiddenException('Bu kiracinin skoruna erisim yetkiniz yok');
    }
    return this.calculateAndSave(tenantId);
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
