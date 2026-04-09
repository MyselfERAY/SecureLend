// One-time script: delete failed migration records so prisma migrate deploy can retry
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(
    `DELETE FROM _prisma_migrations WHERE migration_name IN (
      '20260409100000_update_suggestion_statuses',
      '20260409110000_add_suggestion_image'
    ) RETURNING migration_name, started_at, finished_at`
  );

  if (res.rowCount > 0) {
    console.log('Deleted failed migration records:', res.rows.map(r => r.migration_name));
  } else {
    console.log('No failed migration records to clean up.');
  }

  await client.end();
}

main().catch(e => { console.error('fix-migration error:', e.message); });
