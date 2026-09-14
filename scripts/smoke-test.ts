import dotenv from 'dotenv';
import { turso } from '../lib/turso';

dotenv.config({ path: '.env.local' });

type SmokeRow = { ok: number };

async function main() {
  const result = await turso.execute('SELECT 1 AS ok');
  const rows = result.rows as unknown as SmokeRow[];
  console.log('Smoke test passed:', rows);
}

main().catch((error) => {
  console.error('Smoke test failed:', error);
  process.exit(1);
});
