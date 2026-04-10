import { PrismaClient, UserRole, BankAccountType, BankAccountStatus } from '@prisma/client';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const pepper = process.env.TCKN_HASH_PEPPER;
  if (!pepper) {
    throw new Error('TCKN_HASH_PEPPER env variable is required');
  }

  const resetMode = process.argv.includes('--reset');

  if (resetMode) {
    console.log('=== FULL DATABASE RESET ===');

    // Delete in correct order (children first)
    const counts = await prisma.$transaction([
      prisma.chatMessage.deleteMany(),
      prisma.chatRoomParticipant.deleteMany(),
      prisma.chatRoom.deleteMany(),
      prisma.marketingTask.deleteMany(),
      prisma.researchRequest.deleteMany(),
      prisma.marketingReport.deleteMany(),
      prisma.poItem.deleteMany(),
      prisma.poReport.deleteMany(),
      prisma.devSuggestion.deleteMany(),
      prisma.agentRun.deleteMany(),
      prisma.article.deleteMany(),
      prisma.commission.deleteMany(),
      prisma.paymentOrder.deleteMany(),
      prisma.paymentSchedule.deleteMany(),
      prisma.contractSignature.deleteMany(),
      prisma.contract.deleteMany(),
      prisma.bankTransaction.deleteMany(),
      prisma.bankAccount.deleteMany(),
      prisma.kmhApplication.deleteMany(),
      prisma.property.deleteMany(),
      prisma.application.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.consent.deleteMany(),
      prisma.otpCode.deleteMany(),
      prisma.refreshToken.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const tableNames = [
      'ChatMessage', 'ChatRoomParticipant', 'ChatRoom',
      'MarketingTask', 'ResearchRequest', 'MarketingReport',
      'PoItem', 'PoReport', 'DevSuggestion', 'AgentRun', 'Article',
      'Commission', 'PaymentOrder', 'PaymentSchedule',
      'ContractSignature', 'Contract',
      'BankTransaction', 'BankAccount', 'KmhApplication',
      'Property', 'Application',
      'Notification', 'Consent', 'OtpCode', 'RefreshToken',
      'AuditLog', 'User',
    ];

    counts.forEach((result, i) => {
      if (result.count > 0) {
        console.log(`  Deleted ${result.count} rows from ${tableNames[i]}`);
      }
    });

    console.log('=== Reset complete ===\n');
  }

  // --- Admin user: TCKN 20687068490, Phone 5324761538 ---
  const adminTckn = '20687068490';
  const tcknHash = createHmac('sha256', pepper).update(adminTckn).digest('hex');
  const tcknMasked = adminTckn.slice(0, 2) + '*******' + adminTckn.slice(-2);

  const admin = await prisma.user.upsert({
    where: { tcknHash },
    update: {
      roles: { set: [UserRole.ADMIN] },
      isActive: true,
    },
    create: {
      tcknHash,
      tcknMasked,
      fullName: 'Eray Karacaoglan',
      phone: '5324761538',
      phoneVerified: true,
      roles: [UserRole.ADMIN],
      kycStatus: 'COMPLETED',
      kpsVerified: true,
      isActive: true,
    },
  });

  console.log(`Admin user seeded: ${admin.id} (${admin.fullName})`);

  // Platform komisyon toplama hesabi
  const platformAccountNumber = 'TR00000610000000000000001';
  const existing = await prisma.bankAccount.findUnique({
    where: { accountNumber: platformAccountNumber },
  });

  if (!existing) {
    const account = await prisma.bankAccount.create({
      data: {
        userId: admin.id,
        accountNumber: platformAccountNumber,
        accountType: BankAccountType.STANDARD,
        status: BankAccountStatus.ACTIVE,
        balance: 0,
        openedAt: new Date(),
      },
    });
    console.log(`Platform bank account seeded: ${account.accountNumber}`);
  } else {
    console.log(`Platform bank account already exists: ${platformAccountNumber}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
