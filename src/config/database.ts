import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuration identique à Spring Boot avec gestion SSL permissive
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Équivalent Spring Boot - accepte les certificats auto-signés
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
