import { query } from './lib/db.js';

async function migrate() {
    try {
        await query(`
            ALTER TABLE invoices 
            ADD COLUMN IF NOT EXISTS client_address TEXT,
            ADD COLUMN IF NOT EXISTS client_gst_in VARCHAR(50),
            ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2),
            ADD COLUMN IF NOT EXISTS show_signature BOOLEAN,
            ADD COLUMN IF NOT EXISTS show_bank_details BOOLEAN
        `);
        console.log('✅ Columns added successfully');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    }
    process.exit(0);
}
migrate();
