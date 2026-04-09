const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$executeRawUnsafe(
  "DELETE FROM _prisma_migrations WHERE migration_name IN ('20260409100000_update_suggestion_statuses','20260409110000_add_suggestion_image')"
)
.then(r => console.log('=== CLEANUP: deleted', r, 'failed migration record(s) ==='))
.catch(e => console.error('=== CLEANUP ERROR:', e.message, '==='))
.finally(() => prisma.$disconnect());
