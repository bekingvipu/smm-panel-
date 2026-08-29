import sqlite3
from server.provider_client import SmmProviderClient

class RefillEngine:
    @staticmethod
    def request_refill(db_conn, order_id, user_id):
        cursor = db_conn.cursor()

        # Query Order and verify eligibility
        cursor.execute("""
        SELECT o.*, cs.name as service_name, cs.refill_supported, cs.refill_period,
               p.api_url, p.api_key_secret, p.display_name as provider_name
        FROM orders o
        JOIN customer_services cs ON o.service_id = cs.id
        LEFT JOIN providers p ON o.assigned_provider_id = p.id
        WHERE o.id = ? AND o.user_id = ?;
        """, (order_id, user_id))
        order = cursor.fetchone()

        if not order:
            return {"success": False, "error": "Order not found."}

        if order['status'] != 'Completed':
            return {"success": False, "error": "Only completed orders are eligible for refill."}

        if not order['refill_supported']:
            return {"success": False, "error": "This service does not support refill warranty."}

        # Check existing active refill
        cursor.execute("""
        SELECT id, status FROM refill_requests 
        WHERE order_id = ? AND status IN ('Pending', 'Processing');
        """, (order_id,))
        active_refill = cursor.fetchone()
        if active_refill:
            return {"success": False, "error": f"A refill request (#ref-{active_refill['id']}) is already in progress."}

        # Send refill request to assigned upstream provider
        provider_refill_id = None
        if order['api_url'] and order['provider_order_id']:
            client = SmmProviderClient(order['api_url'], order['api_key_secret'])
            res = client.request_refill(order['provider_order_id'])
            provider_refill_id = res.get('refill', f"ref_{order_id}")

        start_count = order['start_count']
        current_count = order['current_count']
        target_count = start_count + order['quantity']
        drop_count = max(0, target_count - current_count)

        # Create Refill Record
        cursor.execute("""
        INSERT INTO refill_requests (order_id, user_id, provider_id, provider_refill_id, start_count, current_count, target_count, drop_count, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending');
        """, (order_id, user_id, order['assigned_provider_id'], provider_refill_id, start_count, current_count, target_count, drop_count))

        refill_id = cursor.lastrowid

        # Update Order Refill Status
        cursor.execute("""
        UPDATE orders 
        SET refill_eligible = 0, refill_status = 'Refill Requested'
        WHERE id = ?;
        """, (order_id,))

        db_conn.commit()

        return {
            "success": True,
            "refill_id": refill_id,
            "order_id": order_id,
            "service_name": order['service_name'],
            "drop_count": drop_count,
            "status": "Refill Requested"
        }
