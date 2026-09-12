import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.');
}

export const turso = createClient({
  url: databaseUrl,
  authToken,
});
