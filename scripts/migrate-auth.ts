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
        console.log('--- Starting Auth Migration ---');

        // 1. Create users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        company_name VARCHAR(255),
        created_at BIGINT DEFAULT (extract(epoch from now()) * 1000),
        updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
        console.log('✅ Users table ready');

        // 2. Add user_id to clients
        await client.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
    `);
        console.log('✅ Clients table updated');

        // 3. Add user_id to products
        await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
    `);
        console.log('✅ Products table updated');

        // 4. Update Business Profile (Drop and Recreate for clean Per-User Singleton)
        await client.query(`
      DROP TABLE IF EXISTS business_profile;
      CREATE TABLE business_profile (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        gst_in VARCHAR(50),
        logo TEXT,
        header_style VARCHAR(50),
        default_tax_rate DECIMAL(5, 2),
        signature TEXT,
        bank_details JSONB,
        fssai VARCHAR(50),
        show_bank_details_by_default BOOLEAN,
        show_signature_by_default BOOLEAN,
        toc TEXT,
        updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
      );
    `);
        console.log('✅ Business Profile table updated (Per-User)');

        // 5. Add user_id to invoices
        await client.query(`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
      ALTER TABLE invoices ADD CONSTRAINT invoices_user_invoice_unique UNIQUE(user_id, invoice_number);
      CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
    `);
        console.log('✅ Invoices table updated');

        console.log('--- Migration Successful! ---');
    } catch (err) {
        console.error('❌ Migration FAILED:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
