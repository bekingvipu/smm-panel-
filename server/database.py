import sqlite3
import os
import json
import hashlib
import time

DB_PATH = os.path.join(os.path.dirname(__file__), 'smm_panel.sqlite')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
        balance REAL NOT NULL DEFAULT 0.0,
        spent REAL NOT NULL DEFAULT 0.0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Providers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        api_url TEXT NOT NULL,
        api_key_masked TEXT NOT NULL,
        api_key_secret TEXT NOT NULL,
        balance REAL DEFAULT 0.0,
        active_services INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active', -- 'active', 'sync_failed', 'disabled'
        last_sync_at TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Provider Services Table (Raw Wholesale Catalog)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS provider_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER NOT NULL,
        raw_service_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        platform TEXT NOT NULL,
        cost REAL NOT NULL,
        old_cost REAL,
        min_qty INTEGER NOT NULL,
        max_qty INTEGER NOT NULL,
        refill_supported INTEGER NOT NULL DEFAULT 0,
        refill_period TEXT DEFAULT 'None',
        cancel_supported INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Ready to Import',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE
    );
    """)

    # 4. Customer-Facing Services Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customer_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        platform TEXT NOT NULL,
        price_per_1k REAL NOT NULL,
        min_qty INTEGER NOT NULL,
        max_qty INTEGER NOT NULL,
        delivery_speed TEXT NOT NULL,
        start_time TEXT NOT NULL,
        refill_supported INTEGER NOT NULL DEFAULT 0,
        refill_period TEXT DEFAULT 'None',
        description TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Multi-Provider Service Mappings Table (Crucial Requirement!)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS service_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_service_id INTEGER NOT NULL,
        provider_id INTEGER NOT NULL,
        raw_service_id TEXT NOT NULL,
        provider_cost REAL NOT NULL,
        markup_percent INTEGER NOT NULL,
        priority INTEGER NOT NULL DEFAULT 1, -- 1=Primary Active, 2=Standby Failover 1, 3=Standby Failover 2
        is_active INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'Active',
        FOREIGN KEY (customer_service_id) REFERENCES customer_services (id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE
    );
    """)

    # 6. Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        assigned_provider_id INTEGER,
        provider_order_id TEXT,
        target_url TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        charge REAL NOT NULL,
        provider_cost REAL NOT NULL DEFAULT 0.0,
        start_count INTEGER DEFAULT 0,
        current_count INTEGER DEFAULT 0,
        remains INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Processing', -- 'Pending', 'Processing', 'In Progress', 'Completed', 'Partial', 'Canceled'
        refill_eligible INTEGER NOT NULL DEFAULT 0,
        refill_status TEXT DEFAULT NULL, -- 'Available', 'Refill Requested', 'Refill Processing', 'Refill Completed'
        refill_deadline TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (service_id) REFERENCES customer_services (id),
        FOREIGN KEY (assigned_provider_id) REFERENCES providers (id)
    );
    """)

    # 7. Refill Requests Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS refill_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        provider_id INTEGER NOT NULL,
        provider_refill_id TEXT,
        start_count INTEGER NOT NULL,
        current_count INTEGER NOT NULL,
        target_count INTEGER NOT NULL,
        drop_count INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Processing', 'Completed', 'Rejected'
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (provider_id) REFERENCES providers (id)
    );
    """)

    # 8. Wallet Transactions Ledger Table (ACID Auditing)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wallet_transactions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'Deposit', 'Order Deduction', 'Refund', 'Admin Adjustment'
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    # 9. Support Tickets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_id INTEGER,
        subject TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open', -- 'Open', 'Answered', 'Closed'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (order_id) REFERENCES orders (id)
    );
    """)

    # 10. Support Messages Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS support_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        sender_role TEXT NOT NULL, -- 'customer', 'admin'
        sender_name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE
    );
    """)

    conn.commit()

    # Check if seeded
    cursor.execute("SELECT COUNT(*) FROM users;")
    if cursor.fetchone()[0] == 0:
        seed_db(conn)
    conn.close()

def seed_db(conn):
    cursor = conn.cursor()
    # Hash helper
    def pwhash(pw):
        return hashlib.sha256(pw.encode()).hexdigest()

    # Seed Customer & Admin
    cursor.execute("""
    INSERT INTO users (id, username, email, password_hash, role, balance, spent)
    VALUES 
    (1, 'alex_vance', 'alex@growthagency.io', ?, 'customer', 240.50, 3840.00),
    (2, 'admin_james', 'james@smmpro.com', ?, 'admin', 0.0, 0.0);
    """, (pwhash('customer123'), pwhash('admin123')))

    # Seed Providers (Matching screenshot 2)
    cursor.execute("""
    INSERT INTO providers (id, name, display_name, api_url, api_key_masked, api_key_secret, balance, active_services, status, last_sync_at)
    VALUES 
    (1, 'API1_GlobalSMM', 'Main Provider API', 'https://api1.globalsmm.io/v2', 'sk_live_948f••••••••8492', 'sk_live_948f0183748291048492', 450.00, 1200, 'active', '2 mins ago'),
    (2, 'SpeedSMM_Backup', 'Backup Provider', 'https://api.speedsmm.net/api/v2', 'sk_live_210a••••••••9310', 'sk_live_210a9948201948209310', 125.50, 450, 'active', '15 mins ago'),
    (3, 'Legacy_V1_Node', 'Legacy Provider V1', 'https://v1.legacysmm.com/api', 'sk_live_884b••••••••1103', 'sk_live_884b2910482019481103', 0.0, 12, 'sync_failed', '2 days ago'),
    (4, 'Demo_Wholesale_SMM', 'Demo Wholesale Provider', 'https://demo.smm-provider.com/v2', 'sk_demo_771c••••••••0042', 'sk_demo_771c9918274019280042', 890.00, 680, 'active', '1 hour ago');
    """)

    # Seed Raw Provider Services (Matching screenshot 3)
    cursor.execute("""
    INSERT INTO provider_services (id, provider_id, raw_service_id, name, category, platform, cost, old_cost, min_qty, max_qty, refill_supported, refill_period, cancel_supported, status)
    VALUES
    (1, 1, '4092', 'Instagram Followers [HQ] - Fast [50K]', 'Instagram Followers', 'instagram', 0.42, NULL, 100, 50000, 1, '30 Days', 1, 'Synced'),
    (2, 1, '4093', 'TikTok Views [Fast]', 'TikTok Views', 'tiktok', 0.02, NULL, 1000, 1000000, 0, 'None', 0, 'Unavailable Upstream'),
    (3, 1, '5102', 'YouTube Subscribers [Non-Drop Real HQ]', 'YouTube Subscribers', 'youtube', 3.10, 2.50, 50, 5000, 1, '60 Days', 1, 'Review Pricing'),
    (4, 1, '102', 'Twitter Likes [Real Users]', 'Twitter Engagement', 'twitter', 0.85, NULL, 10, 10000, 1, '30 Days', 1, 'Synced'),
    (5, 4, '6011', 'Instagram Likes [Instant HQ High Speed]', 'Instagram Likes', 'instagram', 0.25, NULL, 50, 100000, 1, '30 Days', 1, 'Ready to Import'),
    (6, 1, '7701', 'YouTube Views [High Retention 4K Lifetime]', 'YouTube Views', 'youtube', 1.80, NULL, 500, 500000, 1, '30 Days', 1, 'Synced');
    """)

    # Seed Customer-Facing Services
    cursor.execute("""
    INSERT INTO customer_services (id, name, category, platform, price_per_1k, min_qty, max_qty, delivery_speed, start_time, refill_supported, refill_period, description)
    VALUES
    (1, 'Instagram Followers [Real & Active HQ]', 'Instagram', 'instagram', 0.95, 100, 50000, '10K - 20K / Day', '0 - 15 Minutes', 1, '30 Days', 'Guaranteed high-quality real profiles with active posts and profile pictures. Drop rate below 2%. Protected with 30-Day Refill Guarantee.'),
    (2, 'YouTube Views [High Retention 4K Speed]', 'YouTube', 'youtube', 2.50, 500, 500000, '5K - 10K / Day', '10 - 45 Minutes', 1, '30 Days', 'Monetization-safe worldwide retention views. Real audience recommendation traffic with average 3-5 min watch time.'),
    (3, 'TikTok Likes [Fast Delivery & Non-Drop]', 'TikTok', 'tiktok', 2.20, 100, 100000, '50K / Day', 'Instant (0 - 5 mins)', 1, '15 Days', 'High quality instant likes for TikTok videos. Fast algorithm boost for ForYou page ranking.'),
    (4, 'Instagram Likes [Instant & High Quality]', 'Instagram', 'instagram', 0.55, 50, 100000, '30K / Day', 'Instant', 0, 'None', 'Super fast delivery likes. Real looking profiles. High stability.'),
    (5, 'Twitter/X Likes [Real Global Accounts]', 'Twitter', 'twitter', 1.80, 50, 10000, '5K / Day', '15 - 30 Minutes', 1, '30 Days', 'Real accounts with profile photos and bio. Good for engagement verification.');
    """)

    # Seed Multi-Provider Mappings (Requirement 6)
    cursor.execute("""
    INSERT INTO service_mappings (customer_service_id, provider_id, raw_service_id, provider_cost, markup_percent, priority, is_active, status)
    VALUES
    (1, 1, '4092', 0.42, 126, 1, 1, 'Active'),
    (1, 2, '1902', 0.46, 106, 2, 1, 'Standby Failover 1'),
    (1, 4, '8110', 0.50, 90, 3, 1, 'Standby Failover 2'),
    (2, 1, '7701', 1.80, 39, 1, 1, 'Active'),
    (2, 2, '3104', 1.95, 28, 2, 1, 'Standby Failover 1'),
    (3, 1, '9102', 1.10, 100, 1, 1, 'Active'),
    (4, 4, '6011', 0.25, 120, 1, 1, 'Active'),
    (5, 1, '102', 0.85, 112, 1, 1, 'Active');
    """)

    # Seed Orders (Matching screenshot 4)
    cursor.execute("""
    INSERT INTO orders (id, user_id, service_id, assigned_provider_id, provider_order_id, target_url, quantity, charge, provider_cost, start_count, current_count, remains, status, refill_eligible, refill_status, created_at)
    VALUES
    (48291, 1, 1, 1, 'prov_9021', 'https://instagram.com/fashion_trendz', 1000, 5.00, 0.42, 12400, 12400, 1000, 'Processing', 0, NULL, datetime('now', '-20 minutes')),
    (48290, 1, 2, 1, 'prov_8942', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 5000, 12.50, 9.00, 850, 3200, 2650, 'In Progress', 0, NULL, datetime('now', '-2 hours')),
    (48285, 1, 1, 1, 'prov_7810', 'https://instagram.com/fitness_dan', 1000, 5.00, 0.42, 1020, 1850, 0, 'Completed', 1, 'Available', datetime('now', '-2 days')),
    (48270, 1, 3, 1, 'prov_6541', 'https://tiktok.com/@creative_art/video/719', 1000, 2.20, 1.10, 340, 1340, 0, 'Completed', 1, 'Available', datetime('now', '-7 days')),
    (48255, 1, 4, 4, 'prov_5120', 'https://instagram.com/p/C-xyz910', 2000, 1.10, 0.50, 20, 2020, 0, 'Completed', 0, NULL, datetime('now', '-9 days'));
    """)

    # Seed Wallet Transactions
    cursor.execute("""
    INSERT INTO wallet_transactions (id, user_id, type, description, amount, balance_after, status, created_at)
    VALUES
    ('TXN-901', 1, 'Deposit', 'Funds Added via UPI / Instant Pay', 100.00, 240.50, 'Success', datetime('now', '-1 day')),
    ('TXN-902', 1, 'Order Deduction', 'Payment for Order #48291', -5.00, 140.50, 'Success', datetime('now', '-20 minutes')),
    ('TXN-903', 1, 'Order Deduction', 'Payment for Order #48290', -12.50, 145.50, 'Success', datetime('now', '-2 hours')),
    ('TXN-904', 1, 'Refund', 'Refund for Order #44975 (Canceled Upstream)', 45.00, 158.00, 'Success', datetime('now', '-3 hours'));
    """)

    # Seed Support Ticket
    cursor.execute("""
    INSERT INTO support_tickets (id, user_id, order_id, subject, status, created_at, updated_at)
    VALUES
    (104, 1, 48285, 'Refill inquiry for order #48285', 'Answered', datetime('now', '-1 day'), datetime('now', '-15 minutes'));
    """)

    cursor.execute("""
    INSERT INTO support_messages (ticket_id, sender_role, sender_name, message, created_at)
    VALUES
    (104, 'customer', 'Alex Vance', 'Hi, I saw a slight drop on #48285 from 2,020 to 1,850. I clicked request refill, can you confirm?', datetime('now', '-1 day')),
    (104, 'admin', 'Support Staff', 'Hello Alex! We see your refill request in our queue. The upstream provider is currently dispatching the top-up. You will be back to 2,020+ within a few hours.', datetime('now', '-15 minutes'));
    """)

    conn.commit()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DB_PATH)
