import { Pool, PoolConfig } from 'pg';

/**
 * Database connection utility for PostgreSQL.
 * Designed to be provider-agnostic (Supabase, AWS RDS, etc.) 
 * and handles Next.js hot-reloading by using a global singleton.
 */

const poolConfig: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Next.js hot-reloading safe singleton pattern
const globalForPool = global as unknown as { pool: Pool };

export const pool = globalForPool.pool || new Pool(poolConfig);

// Error handling for the pool itself to handle background connection resets
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

/**
 * Helper to execute database queries with automatic pool management and retries.
 */
export const query = async (text: string, params?: any[], retries = 3) => {
    for (let i = 0; i < retries; i++) {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error: any) {
            const isRetryable = ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(error.code) ||
                error.message?.includes('read ECONNRESET') ||
                error.message?.includes('getaddrinfo ENOTFOUND');

            if (isRetryable && i < retries - 1) {
                const delay = Math.pow(2, i) * 1000;
                console.warn(`🔄 Database query failed (${error.code || 'UNKNOWN'}). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            console.error('Database query error:', error);
            throw error;
        }
    }
};

export default pool;
