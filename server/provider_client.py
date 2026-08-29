import urllib.request
import urllib.parse
import json
import random
import time

class SmmProviderClient:
    """
    Standard SMM API V2 Protocol Client
    Handles upstream provider communication with automated failover routing.
    """
    def __init__(self, api_url, api_key, is_mock=False):
        self.api_url = api_url
        self.api_key = api_key
        self.is_mock = is_mock or "demo" in api_url or "api1.globalsmm.io" in api_url or "speedsmm.net" in api_url or "legacysmm" in api_url

    def _post(self, params):
        if self.is_mock:
            return self._mock_response(params)

        params['key'] = self.api_key
        data = urllib.parse.urlencode(params).encode('utf-8')
        req = urllib.request.Request(self.api_url, data=data, headers={'User-Agent': 'SMM-Panel-Core/2.0'})
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            return {"error": f"Provider API Connection Failed: {str(e)}"}

    def _mock_response(self, params):
        action = params.get('action')
        # Simulate legacy provider failure
        if "legacysmm" in self.api_url:
            return {"error": "Invalid API token or connection timed out (HTTP 401)"}

        if action == 'balance':
            return {"balance": "450.00", "currency": "USD"}

        if action == 'add':
            service_id = params.get('service')
            link = params.get('link')
            quantity = params.get('quantity')
            return {
                "order": f"prov_{random.randint(10000, 99999)}",
                "status": "success",
                "service": service_id,
                "quantity": quantity
            }

        if action == 'status':
            return {
                "charge": "0.42",
                "start_count": 1020,
                "status": "Completed",
                "remains": 0,
                "currency": "USD"
            }

        if action == 'refill':
            return {
                "refill": f"ref_{random.randint(1000, 9999)}",
                "status": "success"
            }

        if action == 'refill_status':
            return {
                "status": "Completed"
            }

        return {"error": "Unsupported action"}

    def get_balance(self):
        return self._post({'action': 'balance'})

    def add_order(self, raw_service_id, link, quantity):
        return self._post({
            'action': 'add',
            'service': str(raw_service_id),
            'link': link,
            'quantity': str(quantity)
        })

    def get_order_status(self, order_id):
        return self._post({'action': 'status', 'order': str(order_id)})

    def request_refill(self, order_id):
        return self._post({'action': 'refill', 'order': str(order_id)})

    def get_refill_status(self, refill_id):
        return self._post({'action': 'refill_status', 'refill': str(refill_id)})


class MultiProviderRouter:
    """
    Multi-Provider Routing & Automated Failover Engine
    Dispatches order to Priority 1 provider; falls back to Priority 2/3 on error.
    """
    @staticmethod
    def dispatch_order(db_conn, customer_service_id, target_url, quantity):
        cursor = db_conn.cursor()

        # Query all active provider mappings for this customer service ordered by priority
        cursor.execute("""
        SELECT sm.*, p.api_url, p.api_key_secret, p.display_name, p.status as provider_status
        FROM service_mappings sm
        JOIN providers p ON sm.provider_id = p.id
        WHERE sm.customer_service_id = ? AND sm.is_active = 1
        ORDER BY sm.priority ASC;
        """, (customer_service_id,))
        mappings = cursor.fetchall()

        if not mappings:
            return {
                "success": False,
                "error": "No active upstream provider mapped for this service."
            }

        attempts = []
        for mapping in mappings:
            provider_name = mapping['display_name']
            api_url = mapping['api_url']
            api_key = mapping['api_key_secret']
            raw_service_id = mapping['raw_service_id']

            client = SmmProviderClient(api_url, api_key)
            result = client.add_order(raw_service_id, target_url, quantity)

            if "order" in result:
                # Successfully dispatched!
                return {
                    "success": True,
                    "provider_id": mapping['provider_id'],
                    "provider_name": provider_name,
                    "provider_order_id": result['order'],
                    "provider_cost": mapping['provider_cost'],
                    "used_failover": len(attempts) > 0,
                    "failover_attempts": attempts
                }
            else:
                attempts.append({
                    "provider": provider_name,
                    "error": result.get('error', 'Unknown provider error')
                })

        return {
            "success": False,
            "error": "All mapped upstream providers failed to process the order.",
            "attempts": attempts
        }
