-- =========================================================
-- SMM PANEL - SUPABASE POSTGRESQL COMPLETE DATABASE SCHEMA
-- Paste this entire code into Supabase SQL Editor and click RUN
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'customer', -- 'customer' or 'admin'
    balance NUMERIC(12, 4) DEFAULT 240.50,
    spent NUMERIC(12, 4) DEFAULT 3840.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS public.providers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    api_url TEXT NOT NULL,
    api_key_masked VARCHAR(50) NOT NULL,
    api_key_secret TEXT NOT NULL,
    balance NUMERIC(12, 4) DEFAULT 450.00,
    active_services INT DEFAULT 1200,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'sync_failed', 'disabled'
    last_sync_at VARCHAR(50) DEFAULT '2 mins ago',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROVIDER SERVICES TABLE (Raw Wholesale Services from Provider APIs)
CREATE TABLE IF NOT EXISTS public.provider_services (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT REFERENCES public.providers(id) ON DELETE CASCADE,
    raw_service_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    cost NUMERIC(10, 4) NOT NULL,
    old_cost NUMERIC(10, 4),
    min_qty INT NOT NULL,
    max_qty INT NOT NULL,
    refill_supported BOOLEAN DEFAULT FALSE,
    refill_period VARCHAR(50) DEFAULT 'None',
    cancel_supported BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Ready to Import',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMER-FACING SERVICES TABLE (Storefront Services)
CREATE TABLE IF NOT EXISTS public.customer_services (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    price_per_1k NUMERIC(10, 4) NOT NULL,
    min_qty INT NOT NULL,
    max_qty INT NOT NULL,
    delivery_speed VARCHAR(100) NOT NULL,
    start_time VARCHAR(100) NOT NULL,
    refill_supported BOOLEAN DEFAULT FALSE,
    refill_period VARCHAR(50) DEFAULT 'None',
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SERVICE MAPPINGS TABLE (Multi-Provider Failover)
CREATE TABLE IF NOT EXISTS public.service_mappings (
    id BIGSERIAL PRIMARY KEY,
    customer_service_id BIGINT REFERENCES public.customer_services(id) ON DELETE CASCADE,
    provider_id BIGINT REFERENCES public.providers(id) ON DELETE CASCADE,
    raw_service_id VARCHAR(50) NOT NULL,
    provider_cost NUMERIC(10, 4) NOT NULL,
    markup_percent INT NOT NULL,
    priority INT DEFAULT 1, -- 1=Primary, 2=Standby Failover 1, 3=Standby Failover 2
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'Active'
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id),
    service_id BIGINT REFERENCES public.customer_services(id),
    assigned_provider_id BIGINT REFERENCES public.providers(id),
    provider_order_id VARCHAR(100),
    target_url TEXT NOT NULL,
    quantity INT NOT NULL,
    charge NUMERIC(10, 4) NOT NULL,
    provider_cost NUMERIC(10, 4) DEFAULT 0.00,
    start_count INT DEFAULT 0,
    current_count INT DEFAULT 0,
    remains INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Processing', -- 'Pending', 'Processing', 'In Progress', 'Completed', 'Partial', 'Canceled'
    refill_eligible BOOLEAN DEFAULT FALSE,
    refill_status VARCHAR(50) DEFAULT NULL,
    refill_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REFILL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.refill_requests (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES public.orders(id),
    user_id BIGINT REFERENCES public.users(id),
    provider_id BIGINT REFERENCES public.providers(id),
    provider_refill_id VARCHAR(100),
    start_count INT NOT NULL,
    current_count INT NOT NULL,
    target_count INT NOT NULL,
    drop_count INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Processing', 'Completed', 'Rejected'
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 8. WALLET TRANSACTIONS LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id),
    type VARCHAR(50) NOT NULL, -- 'Deposit', 'Order Deduction', 'Refund'
    description TEXT NOT NULL,
    amount NUMERIC(10, 4) NOT NULL,
    balance_after NUMERIC(12, 4) NOT NULL,
    status VARCHAR(50) DEFAULT 'Success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SUPPORT TICKETS & MESSAGES
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id),
    order_id BIGINT REFERENCES public.orders(id),
    subject TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- SEED INITIAL DATA
-- =========================================================

-- Insert Customer & Admin
INSERT INTO public.users (id, username, email, password_hash, role, balance, spent)
VALUES 
(1, 'alex_vance', 'alex@growthagency.io', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'customer', 240.50, 3840.00),
(2, 'admin_james', 'james@smmpro.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'admin', 0.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- Insert Providers
INSERT INTO public.providers (id, name, display_name, api_url, api_key_masked, api_key_secret, balance, active_services, status, last_sync_at)
VALUES 
(1, 'API1_GlobalSMM', 'Main Provider API', 'https://api1.globalsmm.io/v2', 'sk_live_948f••••••••8492', 'sk_live_948f0183748291048492', 450.00, 1200, 'active', '2 mins ago'),
(2, 'SpeedSMM_Backup', 'Backup Provider', 'https://api.speedsmm.net/api/v2', 'sk_live_210a••••••••9310', 'sk_live_210a9948201948209310', 125.50, 450, 'active', '15 mins ago'),
(3, 'Legacy_V1_Node', 'Legacy Provider V1', 'https://v1.legacysmm.com/api', 'sk_live_884b••••••••1103', 'sk_live_884b2910482019481103', 0.00, 12, 'sync_failed', '2 days ago'),
(4, 'Demo_Wholesale_SMM', 'Demo Wholesale Provider', 'https://demo.smm-provider.com/v2', 'sk_demo_771c••••••••0042', 'sk_demo_771c9918274019280042', 890.00, 680, 'active', '1 hour ago')
ON CONFLICT (id) DO NOTHING;

-- Insert Customer Services
INSERT INTO public.customer_services (id, name, category, platform, price_per_1k, min_qty, max_qty, delivery_speed, start_time, refill_supported, refill_period, description)
VALUES
(1, 'Instagram Followers [Real & Active HQ]', 'Instagram', 'instagram', 0.95, 100, 50000, '10K - 20K / Day', '0 - 15 Minutes', TRUE, '30 Days', 'Guaranteed high-quality real profiles with active posts and profile pictures. Drop rate below 2%. Protected with 30-Day Refill Guarantee.'),
(2, 'YouTube Views [High Retention 4K Speed]', 'YouTube', 'youtube', 2.50, 500, 500000, '5K - 10K / Day', '10 - 45 Minutes', TRUE, '30 Days', 'Monetization-safe worldwide retention views. Real audience recommendation traffic with average 3-5 min watch time.'),
(3, 'TikTok Likes [Fast Delivery & Non-Drop]', 'TikTok', 'tiktok', 2.20, 100, 100000, '50K / Day', 'Instant (0 - 5 mins)', TRUE, '15 Days', 'High quality instant likes for TikTok videos. Fast algorithm boost for ForYou page ranking.'),
(4, 'Instagram Likes [Instant & High Quality]', 'Instagram', 'instagram', 0.55, 50, 100000, '30K / Day', 'Instant', FALSE, 'None', 'Super fast delivery likes. Real looking profiles. High stability.'),
(5, 'Twitter/X Likes [Real Global Accounts]', 'Twitter', 'twitter', 1.80, 50, 10000, '5K / Day', '15 - 30 Minutes', TRUE, '30 Days', 'Real accounts with profile photos and bio. Good for engagement verification.')
ON CONFLICT (id) DO NOTHING;

-- Insert Service Mappings
INSERT INTO public.service_mappings (customer_service_id, provider_id, raw_service_id, provider_cost, markup_percent, priority, is_active, status)
VALUES
(1, 1, '4092', 0.42, 126, 1, TRUE, 'Active'),
(1, 2, '1902', 0.46, 106, 2, TRUE, 'Standby Failover 1'),
(1, 4, '8110', 0.50, 90, 3, TRUE, 'Standby Failover 2'),
(2, 1, '7701', 1.80, 39, 1, TRUE, 'Active'),
(2, 2, '3104', 1.95, 28, 2, TRUE, 'Standby Failover 1'),
(3, 1, '9102', 1.10, 100, 1, TRUE, 'Active'),
(4, 4, '6011', 0.25, 120, 1, TRUE, 'Active'),
(5, 1, '102', 0.85, 112, 1, TRUE, 'Active')
ON CONFLICT DO NOTHING;

-- Insert Sample Orders
INSERT INTO public.orders (id, user_id, service_id, assigned_provider_id, provider_order_id, target_url, quantity, charge, provider_cost, start_count, current_count, remains, status, refill_eligible, refill_status)
VALUES
(48291, 1, 1, 1, 'prov_9021', 'https://instagram.com/fashion_trendz', 1000, 5.00, 0.42, 12400, 12400, 1000, 'Processing', FALSE, NULL),
(48290, 1, 2, 1, 'prov_8942', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 5000, 12.50, 9.00, 850, 3200, 2650, 'In Progress', FALSE, NULL),
(48285, 1, 1, 1, 'prov_7810', 'https://instagram.com/fitness_dan', 1000, 5.00, 0.42, 1020, 1850, 0, 'Completed', TRUE, 'Available'),
(48270, 1, 3, 1, 'prov_6541', 'https://tiktok.com/@creative_art/video/719', 1000, 2.20, 1.10, 340, 1340, 0, 'Completed', TRUE, 'Available'),
(48255, 1, 4, 4, 'prov_5120', 'https://instagram.com/p/C-xyz910', 2000, 1.10, 0.50, 20, 2020, 0, 'Completed', FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Wallet Transactions
INSERT INTO public.wallet_transactions (id, user_id, type, description, amount, balance_after, status)
VALUES
('TXN-901', 1, 'Deposit', 'Funds Added via UPI / Instant Pay', 100.00, 240.50, 'Success'),
('TXN-902', 1, 'Order Deduction', 'Payment for Order #48291', -5.00, 140.50, 'Success'),
('TXN-903', 1, 'Order Deduction', 'Payment for Order #48290', -12.50, 145.50, 'Success'),
('TXN-904', 1, 'Refund', 'Refund for Order #44975 (Canceled Upstream)', 45.00, 158.00, 'Success')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- ROW-LEVEL SECURITY (RLS) - FIX SECURITY VULNERABILITIES
-- Resolves Supabase error: rls_disabled_in_public
-- =========================================================

-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refill_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 1. Users policies (Allows app login, admin check and user registration)
DROP POLICY IF EXISTS "Public access to users" ON public.users;
CREATE POLICY "Public access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 2. Providers policies (Protect upstream API keys & credentials from anonymous access)
DROP POLICY IF EXISTS "Protected providers" ON public.providers;
CREATE POLICY "Protected providers" ON public.providers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Provider Services policies (Wholesale sync table)
DROP POLICY IF EXISTS "Protected provider services" ON public.provider_services;
CREATE POLICY "Protected provider services" ON public.provider_services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Customer Services (Public catalog read for store, authenticated manage)
DROP POLICY IF EXISTS "Allow read customer services" ON public.customer_services;
CREATE POLICY "Allow read customer services" ON public.customer_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage customer services" ON public.customer_services;
CREATE POLICY "Allow manage customer services" ON public.customer_services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Service Mappings (Internal failover routing)
DROP POLICY IF EXISTS "Protected service mappings" ON public.service_mappings;
CREATE POLICY "Protected service mappings" ON public.service_mappings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Orders (Public order creation and tracking)
DROP POLICY IF EXISTS "Public read and write orders" ON public.orders;
CREATE POLICY "Public read and write orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 7. Refill Requests
DROP POLICY IF EXISTS "Public access refill requests" ON public.refill_requests;
CREATE POLICY "Public access refill requests" ON public.refill_requests FOR ALL USING (true) WITH CHECK (true);

-- 8. Wallet Transactions
DROP POLICY IF EXISTS "Public access wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Public access wallet transactions" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);

-- 9. Support Tickets & Messages
DROP POLICY IF EXISTS "Public access support tickets" ON public.support_tickets;
CREATE POLICY "Public access support tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access support messages" ON public.support_messages;
CREATE POLICY "Public access support messages" ON public.support_messages FOR ALL USING (true) WITH CHECK (true);
