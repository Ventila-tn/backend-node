import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuration identique à Spring Boot avec gestion SSL permissive pour Vercel
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? {
    rejectUnauthorized: false // Accepte les certificats auto-signés (comme Supabase)
  } : {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
