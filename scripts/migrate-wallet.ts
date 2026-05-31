import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        console.log('Connecting to database...');

        const sql = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE,
            ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS wallet_balance INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS referral_reward_paid BOOLEAN DEFAULT false;
        `;

        console.log('Executing migration...');
        await pool.query(sql);
        console.log('Wallet & Referral columns added successfully!');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

runMigration();
