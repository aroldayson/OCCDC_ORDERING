const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:j1WACQclgGFoYa7Z@db.huudaizyxzeekgorccbn.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log("Connected to database.");
  const res = await client.query(`
    ALTER TABLE public.delivery_receipt_records 
    ADD COLUMN IF NOT EXISTS date_received TIMESTAMPTZ;
  `);
  console.log("Migration successful:", res);
  await client.end();
}

main().catch(console.error);
