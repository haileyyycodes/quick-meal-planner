import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.');
}

// Embedded replica: reads are served from the local file, so they don't count against
// Turso's remote read usage. Writes still go straight to the primary, and readYourWrites
// (the default) forces this replica to catch up before a write's own read resolves, so a
// save-then-reload always sees fresh data. syncInterval keeps the two-person local setup
// (two machines against the same Turso DB) from drifting more than a few seconds apart.
export const turso = createClient({
  url: 'file:local.db',
  syncUrl: databaseUrl,
  authToken,
  syncInterval: 10,
  readYourWrites: true,
});
