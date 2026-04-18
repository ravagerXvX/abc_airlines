import { Pool } from 'pg';

// Singleton pool — reused across hot reloads in dev
const globalForPg = globalThis;

const pool = globalForPg.pgPool ?? new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'postgres',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'Roman85859090!',
  max: 10,
  ssl: process.env.PG_HOST?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

export default pool;
