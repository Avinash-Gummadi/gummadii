// scripts/test-db.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testConnection() {
    console.log('--- Database Connection Test ---');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);

    if (process.env.DATABASE_URL?.includes('YOUR_PASSWORD_HERE')) {
        console.error('\n❌ ERROR: Please replace "YOUR_PASSWORD_HERE" in .env with your actual database password.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
        console.log('\n✅ SUCCESS: Connected to database');
        console.log('Timestamp from DB:', res.rows[0].current_time);
        console.log('Connected to:', res.rows[0].db_name);
    } catch (err) {
        console.error('\n❌ FAILED: Could not connect to database');
        console.error(err);
    } finally {
        await pool.end();
    }
}

testConnection();
