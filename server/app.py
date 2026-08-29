import http.server
import json
import os
import sys
import urllib.parse
import re

# Add parent directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from server.database import get_db, init_db
from server.provider_client import SmmProviderClient, MultiProviderRouter
from server.wallet import WalletLedger, InsufficientFundsError
from server.refill_engine import RefillEngine

PORT = 5050

class SmmApiHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Static files fallback
        if not path.startswith('/api/'):
            return super().do_GET()

        conn = get_db()
        cursor = conn.cursor()

        try:
            # 1. Customer Profile
            if path == '/api/customer/profile':
                cursor.execute("SELECT id, username, email, role, balance, spent FROM users WHERE id = 1;")
                user = dict(cursor.fetchone())
                cursor.execute("SELECT COUNT(*) FROM orders WHERE user_id = 1;")
                user['ordersCount'] = cursor.fetchone()[0]
                return self._send_json(user)

            # 2. Customer Services (Public Storefront — Wholesale & Provider info strictly stripped!)
            elif path == '/api/customer/services':
                cursor.execute("""
                SELECT id, name as customerName, category, platform, price_per_1k as pricePer1k,
                       min_qty as min, max_qty as max, delivery_speed as deliverySpeed,
                       start_time as startTime, refill_supported as refillSupported,
                       refill_period as refillPeriod, description
                FROM customer_services
                WHERE is_active = 1
                ORDER BY id ASC;
                """)
                services = [dict(row) for row in cursor.fetchall()]
                for s in services:
                    s['refillSupported'] = bool(s['refillSupported'])
                return self._send_json(services)

            # 3. Customer Orders List
            elif path == '/api/customer/orders':
                cursor.execute("""
                SELECT o.id, o.service_id as serviceId, cs.name as serviceName, cs.platform,
                       o.target_url as target, o.quantity, o.charge as amount, o.status,
                       strftime('%d %b %Y, %H:%M', o.created_at) as date,
                       o.start_count as startCount, o.current_count as currentCount, o.remains,
                       o.refill_eligible as refillEligible, o.refill_status as refillStatus
                FROM orders o
                JOIN customer_services cs ON o.service_id = cs.id
                WHERE o.user_id = 1
                ORDER BY o.id DESC;
                """)
                orders = [dict(row) for row in cursor.fetchall()]
                for o in orders:
                    o['refillEligible'] = bool(o['refillEligible'])
                return self._send_json(orders)

            # 4. Customer Transactions
            elif path == '/api/customer/wallet/transactions':
                cursor.execute("""
                SELECT id, type, description, amount, balance_after as balanceAfter, status,
                       strftime('%d %b %Y, %H:%M', created_at) as date
                FROM wallet_transactions
                WHERE user_id = 1
                ORDER BY created_at DESC;
                """)
                txns = [dict(row) for row in cursor.fetchall()]
                return self._send_json(txns)

            # 5. Customer Tickets
            elif path == '/api/customer/tickets':
                cursor.execute("""
                SELECT t.id, t.subject, t.order_id as linkedOrderId, t.status,
                       strftime('%d %b, %H:%M', t.updated_at) as updatedAt
                FROM support_tickets t
                WHERE t.user_id = 1
                ORDER BY t.updated_at DESC;
                """)
                tickets = [dict(row) for row in cursor.fetchall()]
                for t in tickets:
                    cursor.execute("""
                    SELECT id, sender_role as sender, message as text,
                           strftime('%d %b, %H:%M', created_at) as time
                    FROM support_messages
                    WHERE ticket_id = ?
                    ORDER BY id ASC;
                    """, (t['id'],))
                    t['messages'] = [dict(m) for m in cursor.fetchall()]
                return self._send_json(tickets)

            # 6. Admin Dashboard Stats
            elif path == '/api/admin/stats':
                cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'customer';")
                total_customers = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM orders;")
                total_orders = cursor.fetchone()[0]
                cursor.execute("SELECT COALESCE(SUM(charge), 0), COALESCE(SUM(charge - provider_cost), 0) FROM orders;")
                revenue_row = cursor.fetchone()
                cursor.execute("SELECT COALESCE(SUM(balance), 0) FROM providers;")
                provider_balance = cursor.fetchone()[0]

                return self._send_json({
                    "totalCustomers": total_customers,
                    "customersTrend": -2.4,
                    "totalOrders": total_orders,
                    "ordersTrend": 12.5,
                    "revenue": round(revenue_row[0], 2),
                    "revenueTrend": 8.1,
                    "profit": round(revenue_row[1], 2),
                    "profitTrend": 4.2,
                    "providerBalance": round(provider_balance, 2),
                    "providerBalanceStatus": "Low" if provider_balance < 2000 else "Healthy"
                })

            # 7. Admin Providers List
            elif path == '/api/admin/providers':
                cursor.execute("""
                SELECT id, name, display_name as displayName, status, balance,
                       active_services as activeServices, last_sync_at as lastSync,
                       api_url as apiUrl, api_key_masked as apiKeyMasked
                FROM providers
                ORDER BY id ASC;
                """)
                return self._send_json([dict(row) for row in cursor.fetchall()])

            # 8. Admin Raw Provider Services
            elif path == '/api/admin/provider-services':
                cursor.execute("""
                SELECT ps.id, ps.provider_id as providerId, p.display_name as providerName,
                       ps.raw_service_id as rawServiceId, ps.name as rawName, ps.category,
                       ps.platform, ps.cost, ps.old_cost as oldCost, ps.min_qty as min,
                       ps.max_qty as max, ps.refill_supported as refillSupport,
                       ps.refill_period as refillPeriod, ps.cancel_supported as cancelSupport,
                       ps.status
                FROM provider_services ps
                JOIN providers p ON ps.provider_id = p.id
                ORDER BY ps.id ASC;
                """)
                raws = [dict(row) for row in cursor.fetchall()]
                for r in raws:
                    r['refillSupport'] = bool(r['refillSupport'])
                return self._send_json(raws)

            # 9. Admin Customer Services with Multi-Provider Mappings
            elif path == '/api/admin/services':
                cursor.execute("""
                SELECT id, name as customerName, category, platform, price_per_1k as pricePer1k,
                       min_qty as min, max_qty as max, delivery_speed as deliverySpeed,
                       start_time as startTime, refill_supported as refillSupported,
                       refill_period as refillPeriod, description, is_active as active
                FROM customer_services
                ORDER BY id ASC;
                """)
                services = [dict(row) for row in cursor.fetchall()]
                for s in services:
                    s['refillSupported'] = bool(s['refillSupported'])
                    s['active'] = bool(s['active'])
                    # Fetch mappings
                    cursor.execute("""
                    SELECT sm.id, sm.provider_id as providerId, p.display_name as providerName,
                           sm.raw_service_id as serviceId, sm.provider_cost as providerCost,
                           sm.markup_percent as markupPercent, sm.priority,
                           (sm.priority = 1) as isPrimary, sm.status
                    FROM service_mappings sm
                    JOIN providers p ON sm.provider_id = p.id
                    WHERE sm.customer_service_id = ?
                    ORDER BY sm.priority ASC;
                    """, (s['id'],))
                    s['providerMappings'] = [dict(m) for m in cursor.fetchall()]
                    for m in s['providerMappings']:
                        m['isPrimary'] = bool(m['isPrimary'])
                return self._send_json(services)

            # 10. Admin Refills Queue
            elif path == '/api/admin/refills':
                cursor.execute("""
                SELECT r.id, r.order_id as orderId, cs.name as serviceName,
                       u.username || ' (' || u.email || ')' as customerName,
                       r.start_count as startCount, r.target_count as targetCount,
                       r.current_count as currentCount, r.drop_count as dropCount,
                       strftime('%d %b, %H:%M', r.requested_at) as requestedAt,
                       r.status, p.display_name as provider
                FROM refill_requests r
                JOIN orders o ON r.order_id = o.id
                JOIN customer_services cs ON o.service_id = cs.id
                JOIN users u ON r.user_id = u.id
                JOIN providers p ON r.provider_id = p.id
                ORDER BY r.id DESC;
                """)
                return self._send_json([dict(row) for row in cursor.fetchall()])

            else:
                return self._send_json({"error": "Endpoint not found"}, 404)

        except Exception as e:
            return self._send_json({"error": str(e)}, 500)
        finally:
            conn.close()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = {}
        if content_length > 0:
            try:
                body = json.loads(self.wfile.read(content_length).decode('utf-8'))
            except Exception:
                body = {}

        conn = get_db()
        cursor = conn.cursor()

        try:
            # 1. Place New Order (Atomic Wallet Debit + Multi-Provider Routing)
            if path == '/api/customer/orders':
                service_id = int(body.get('serviceId', 0))
                target = body.get('target', '').strip()
                quantity = int(body.get('quantity', 0))

                if not service_id or not target or quantity <= 0:
                    return self._send_json({"error": "Invalid service, target URL, or quantity."}, 400)

                cursor.execute("SELECT * FROM customer_services WHERE id = ? AND is_active = 1;", (service_id,))
                service = cursor.fetchone()
                if not service:
                    return self._send_json({"error": "Service not found or unavailable."}, 404)

                if quantity < service['min_qty'] or quantity > service['max_qty']:
                    return self._send_json({"error": f"Quantity must be between {service['min_qty']} and {service['max_qty']}."}, 400)

                total_cost = round((service['price_per_1k'] / 1000.0) * quantity, 4)

                # Step 1: Dispatch to Upstream Provider via Failover Router
                dispatch_res = MultiProviderRouter.dispatch_order(conn, service_id, target, quantity)
                if not dispatch_res.get('success'):
                    return self._send_json({"error": dispatch_res.get('error', 'Provider routing failed')}, 502)

                assigned_provider_id = dispatch_res['provider_id']
                provider_order_id = dispatch_res['provider_order_id']
                provider_cost = dispatch_res['provider_cost']

                # Step 2: Insert Order Record
                cursor.execute("""
                INSERT INTO orders (user_id, service_id, assigned_provider_id, provider_order_id, target_url, quantity, charge, provider_cost, remains, status, refill_eligible)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing', 0);
                """, (service_id, assigned_provider_id, provider_order_id, target, quantity, total_cost, provider_cost, quantity))
                order_id = cursor.lastrowid

                # Step 3: Atomic Balance Deduction
                try:
                    new_balance = WalletLedger.deduct_balance(conn, user_id=1, amount=total_cost, order_id=order_id)
                except InsufficientFundsError as e:
                    return self._send_json({"error": str(e)}, 402)

                return self._send_json({
                    "success": True,
                    "orderId": str(order_id),
                    "charge": total_cost,
                    "balance": new_balance,
                    "provider": dispatch_res['provider_name'],
                    "usedFailover": dispatch_res['used_failover']
                })

            # 2. Refill Order Flow
            elif re.match(r'^/api/customer/orders/(\d+)/refill$', path):
                match = re.match(r'^/api/customer/orders/(\d+)/refill$', path)
                order_id = int(match.group(1))
                res = RefillEngine.request_refill(conn, order_id, user_id=1)
                if not res.get('success'):
                    return self._send_json({"error": res.get('error')}, 400)
                return self._send_json(res)

            # 3. Add Funds (Wallet Deposit)
            elif path == '/api/customer/wallet/deposit':
                amount = float(body.get('amount', 0))
                method = body.get('method', 'UPI / Instant Pay')
                if amount <= 0:
                    return self._send_json({"error": "Deposit amount must be positive."}, 400)

                new_balance = WalletLedger.add_funds(conn, user_id=1, amount=amount, method=method)
                return self._send_json({"success": True, "balance": new_balance})

            # 4. Create Support Ticket
            elif path == '/api/customer/tickets':
                subject = body.get('subject', 'General Inquiry')
                order_id = body.get('orderId')
                message = body.get('message', '')

                cursor.execute("""
                INSERT INTO support_tickets (user_id, order_id, subject, status)
                VALUES (1, ?, ?, 'Open');
                """, (int(order_id) if order_id else None, subject))
                ticket_id = cursor.lastrowid

                cursor.execute("""
                INSERT INTO support_messages (ticket_id, sender_role, sender_name, message)
                VALUES (?, 'customer', 'Alex Vance', ?);
                """, (ticket_id, message))
                conn.commit()

                return self._send_json({"success": True, "ticketId": ticket_id})

            # 5. Send Ticket Message
            elif re.match(r'^/api/customer/tickets/(\d+)/messages$', path):
                match = re.match(r'^/api/customer/tickets/(\d+)/messages$', path)
                ticket_id = int(match.group(1))
                text = body.get('text', '').strip()
                if not text:
                    return self._send_json({"error": "Message cannot be empty."}, 400)

                cursor.execute("""
                INSERT INTO support_messages (ticket_id, sender_role, sender_name, message)
                VALUES (?, 'customer', 'Alex Vance', ?);
                """, (ticket_id, text))
                cursor.execute("UPDATE support_tickets SET status = 'Waiting on Staff', updated_at = CURRENT_TIMESTAMP WHERE id = ?;", (ticket_id,))
                conn.commit()

                return self._send_json({"success": True})

            # 6. Admin: Test Provider Connection
            elif re.match(r'^/api/admin/providers/(\d+)/test-connection$', path):
                match = re.match(r'^/api/admin/providers/(\d+)/test-connection$', path)
                provider_id = int(match.group(1))
                cursor.execute("SELECT * FROM providers WHERE id = ?;", (provider_id,))
                prov = cursor.fetchone()
                if not prov:
                    return self._send_json({"error": "Provider not found"}, 404)

                client = SmmProviderClient(prov['api_url'], prov['api_key_secret'])
                res = client.get_balance()
                if "error" in res:
                    return self._send_json({"success": False, "error": res['error']}, 502)
                return self._send_json({"success": True, "balance": res.get('balance', prov['balance']), "provider": prov['display_name']})

            # 7. Admin: Import Raw Service to Customer Storefront
            elif path == '/api/admin/services/import':
                raw_id = body.get('rawServiceId')
                cursor.execute("SELECT * FROM provider_services WHERE id = ?;", (raw_id,))
                raw = cursor.fetchone()
                if not raw:
                    return self._send_json({"error": "Raw provider service not found."}, 404)

                customer_name = body.get('customerName', raw['name'])
                category = body.get('category', raw['category'])
                selling_price = float(body.get('sellingPrice', raw['cost'] * 2.0))
                refill_period = body.get('refillPeriod', raw['refill_period'])
                description = body.get('description', f"High quality {category} service.")
                refill_supported = 1 if refill_period != 'None' else 0

                # Create Customer Service
                cursor.execute("""
                INSERT INTO customer_services (name, category, platform, price_per_1k, min_qty, max_qty, delivery_speed, start_time, refill_supported, refill_period, description)
                VALUES (?, ?, ?, ?, ?, ?, '10K - 20K / Day', '0 - 15 Mins', ?, ?, ?);
                """, (customer_name, category, raw['platform'], selling_price, raw['min_qty'], raw['max_qty'], refill_supported, refill_period, description))
                new_service_id = cursor.lastrowid

                # Create Primary Provider Mapping
                markup = int(round(((selling_price - raw['cost']) / raw['cost']) * 100))
                cursor.execute("""
                INSERT INTO service_mappings (customer_service_id, provider_id, raw_service_id, provider_cost, markup_percent, priority, is_active, status)
                VALUES (?, ?, ?, ?, ?, 1, 1, 'Active');
                """, (new_service_id, raw['provider_id'], raw['raw_service_id'], raw['cost'], markup))

                cursor.execute("UPDATE provider_services SET status = 'Synced' WHERE id = ?;", (raw_id,))
                conn.commit()

                return self._send_json({"success": True, "serviceId": new_service_id})

            # 8. Admin: Switch Primary Provider (Failover Configuration)
            elif re.match(r'^/api/admin/services/(\d+)/mappings/primary$', path):
                match = re.match(r'^/api/admin/services/(\d+)/mappings/primary$', path)
                service_id = int(match.group(1))
                target_provider_id = int(body.get('providerId', 0))

                cursor.execute("""
                UPDATE service_mappings 
                SET priority = CASE WHEN provider_id = ? THEN 1 ELSE 2 END,
                    status = CASE WHEN provider_id = ? THEN 'Active' ELSE 'Standby Failover' END
                WHERE customer_service_id = ?;
                """, (target_provider_id, target_provider_id, service_id))
                conn.commit()

                return self._send_json({"success": True})

            else:
                return self._send_json({"error": "Endpoint not found"}, 404)

        except Exception as e:
            return self._send_json({"error": str(e)}, 500)
        finally:
            conn.close()

def run_server():
    init_db()
    server_address = ('', PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, SmmApiHandler)
    print(f"[*] SMM Panel Core Server running on http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run_server()
