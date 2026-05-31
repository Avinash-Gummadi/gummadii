import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Starting globalid Migration ---');

        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS globalid VARCHAR(9) UNIQUE;`);
        console.log('✅ globalid column added to users table');

        const result = await client.query(`
            UPDATE users 
            SET globalid = floor(random() * 900000000 + 100000000)::varchar 
            WHERE globalid IS NULL;
        `);
        console.log(`✅ populated missing globalids: updated ${result.rowCount} rows`);

        console.log('--- Migration Successful! ---');
    } catch (err) {
        console.error('❌ Migration FAILED:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
