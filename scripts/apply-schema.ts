// scripts/apply-schema.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function applySchema() {
    console.log('--- Applying Database Schema ---');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const schemaPath = path.resolve(__dirname, '../data/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Reading schema from:', schemaPath);

        // Execute the entire schema SQL
        await pool.query(schemaSql);

        console.log('\n✅ SUCCESS: Schema applied successfully to the database.');
    } catch (err) {
        console.error('\n❌ FAILED: Could not apply schema');
        console.error(err);
    } finally {
        await pool.end();
    }
}

applySchema();
