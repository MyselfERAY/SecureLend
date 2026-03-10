import { PrismaClient, UserRole, BankAccountType, BankAccountStatus } from '@prisma/client';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const pepper = process.env.TCKN_HASH_PEPPER || 'a3f8b2c1d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef';

  // Admin kullanıcı TCKN: 10000000146 (valid checksum)
  const adminTckn = '10000000146';
  const tcknHash = createHmac('sha256', pepper).update(adminTckn).digest('hex');
  const tcknMasked = adminTckn.slice(0, 2) + '*******' + adminTckn.slice(9);

  // Upsert admin user
  const admin = await prisma.user.upsert({
    where: { tcknHash },
    update: {
      roles: { set: [UserRole.ADMIN] },
    },
    create: {
      tcknHash,
      tcknMasked,
      fullName: 'Platform Admin',
      phone: '5000000000',
      phoneVerified: true,
      roles: [UserRole.ADMIN],
      kycStatus: 'COMPLETED',
      kpsVerified: true,
      isActive: true,
    },
  });

  console.log(`Admin user seeded: ${admin.id} (${admin.fullName})`);

  // Platform komisyon toplama hesabı
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
