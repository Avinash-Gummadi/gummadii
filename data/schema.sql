-- Database Schema for gummadii
-- Use this file to migrate your database to a new provider.

-- Database Schema for gummadii (Cost Optimized)

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    globalid VARCHAR(9) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(15),
    password_hash TEXT NOT NULL,
    company_name VARCHAR(255),
    referral_code VARCHAR(50) UNIQUE,
    referred_by UUID REFERENCES users(id),
    wallet_balance INTEGER DEFAULT 0,
    referral_reward_paid BOOLEAN DEFAULT false,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000),
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gst_in VARCHAR(50),
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Table: products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(20),
    hsn_code VARCHAR(50),
    description TEXT,
    tax_rate DECIMAL(5, 2),
    allowed_types JSONB, -- Array of strings
    price_type VARCHAR(50),
    stock DECIMAL(15, 2),
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000),
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Table: business_profile (Per-User Singleton)
CREATE TABLE IF NOT EXISTS business_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    gst_in VARCHAR(50),
    logo TEXT, -- Base64 or URL
    header_style VARCHAR(50),
    default_tax_rate DECIMAL(5, 2),
    signature TEXT, -- Base64 or URL
    bank_details JSONB, -- { accountName, accountNumber, ifsc, bankName, upiId }
    fssai VARCHAR(50),
    show_bank_details_by_default BOOLEAN,
    show_signature_by_default BOOLEAN,
    toc TEXT,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
);

-- Table: invoices (Consolidated for MINIMAL transactions)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL, -- Not unique globally anymore
    type VARCHAR(50) NOT NULL, -- 'invoice', 'receipt', etc.
    date VARCHAR(20) NOT NULL,
    due_date VARCHAR(20),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_details JSONB, -- Snapshot of client info
    items JSONB NOT NULL, -- Array of InvoiceItem objects (PREVENTS JOINS)
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_total DECIMAL(15, 2) NOT NULL,
    discount DECIMAL(15, 2),
    discount_type VARCHAR(20),
    discount_value DECIMAL(15, 2),
    total DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'unpaid',
    currency VARCHAR(10) DEFAULT 'INR',
    notes TEXT,
    terms TEXT,
    meta JSONB, -- Extra fields like doctorName, propertyAddress, etc.
    client_address TEXT,
    client_gst_in VARCHAR(50),
    tax_rate DECIMAL(5, 2),
    show_signature BOOLEAN,
    show_bank_details BOOLEAN,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE(user_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
-- Table: payment_orders (Razorpay)
CREATE TABLE IF NOT EXISTS payment_orders (
    id SERIAL PRIMARY KEY,
    razorpay_order_id VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);

-- Table: subscriptions (Razorpay)
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(20) NOT NULL,
    razorpay_payment_id VARCHAR(50),
    razorpay_order_id VARCHAR(50),
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, active, expires_at);

-- Documentation for Data Mobility
/*
To migrate data from one database to another, use the following standard PostgreSQL commands:

1. Export from current DB:
   pg_dump -h [OLD_HOST] -U [OLD_USER] [OLD_DB_NAME] > backup.sql

2. Import to new DB:
   psql -h [NEW_HOST] -U [NEW_USER] [NEW_DB_NAME] < backup.sql
*/
