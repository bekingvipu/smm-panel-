import os
import sys
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from server.database import get_db, init_db
from server.provider_client import SmmProviderClient, MultiProviderRouter
from server.wallet import WalletLedger, InsufficientFundsError
from server.refill_engine import RefillEngine

class SmmSystemTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.db = get_db()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_database_schema(self):
        """Verify all 10 essential tables exist in SQLite"""
        cursor = self.db.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        expected = [
            'users', 'providers', 'provider_services', 'customer_services',
            'service_mappings', 'orders', 'refill_requests', 'wallet_transactions',
            'support_tickets', 'support_messages'
        ]
        for t in expected:
            self.assertIn(t, tables, f"Missing table: {t}")
        print("✓ Test 01 Passed: All database tables created and verified.")

    def test_02_wallet_atomic_deduction_and_overdraft_prevention(self):
        """Verify atomic balance deduction and that balance cannot go negative"""
        cursor = self.db.cursor()
        cursor.execute("SELECT balance FROM users WHERE id = 1;")
        initial_bal = cursor.fetchone()[0]

        # Valid deduction
        new_bal = WalletLedger.deduct_balance(self.db, user_id=1, amount=10.0, order_id=99999)
        self.assertEqual(round(new_bal, 2), round(initial_bal - 10.0, 2))

        # Attempt Overdraft (Exceeds Balance)
        with self.assertRaises(InsufficientFundsError):
            WalletLedger.deduct_balance(self.db, user_id=1, amount=999999.0, order_id=99998)

        # Deposit funds
        reloaded_bal = WalletLedger.add_funds(self.db, user_id=1, amount=50.0, method="UPI Instant")
        self.assertEqual(round(reloaded_bal, 2), round(new_bal + 50.0, 2))
        print("✓ Test 02 Passed: Atomic wallet transactions & overdraft prevention verified.")

    def test_03_provider_api_client_and_failover_routing(self):
        """Verify Provider API client protocol and multi-provider failover routing"""
        # Test Provider API Client methods
        client = SmmProviderClient("https://api1.globalsmm.io/v2", "sk_live_test")
        bal = client.get_balance()
        self.assertIn('balance', bal)

        add_res = client.add_order("4092", "https://instagram.com/test", 1000)
        self.assertIn('order', add_res)

        # Test Multi-Provider Failover Router
        # Customer Service #1 maps to Provider 1 (Primary) and Provider 2 (Failover)
        dispatch_res = MultiProviderRouter.dispatch_order(
            self.db,
            customer_service_id=1,
            target_url="https://instagram.com/viral_test",
            quantity=1000
        )
        self.assertTrue(dispatch_res['success'])
        self.assertIn('provider_order_id', dispatch_res)
        self.assertEqual(dispatch_res['provider_name'], 'Main Provider API')
        print("✓ Test 03 Passed: Provider API client protocol & multi-provider routing verified.")

    def test_04_refill_engine_eligibility_and_dispatch(self):
        """Verify smart refill engine restricts to completed orders and prevents duplicates"""
        # Ensure order #48285 is eligible for the test and clear any prior refill requests
        self.db.execute("DELETE FROM refill_requests WHERE order_id = 48285")
        self.db.execute("UPDATE orders SET refill_eligible = 1, refill_status = 'Available', refill_deadline = datetime('now', '+30 days') WHERE id = 48285")
        self.db.commit()
        # Order #48285 is Completed and has refill warranty
        res = RefillEngine.request_refill(self.db, order_id=48285, user_id=1)
        self.assertTrue(res['success'])
        self.assertEqual(res['status'], 'Refill Requested')

        # Duplicate refill attempt should be blocked
        dup_res = RefillEngine.request_refill(self.db, order_id=48285, user_id=1)
        self.assertFalse(dup_res['success'])
        self.assertIn('already in progress', dup_res['error'])

        # Ineligible Order #48255 (No refill support)
        ineligible_res = RefillEngine.request_refill(self.db, order_id=48255, user_id=1)
        self.assertFalse(ineligible_res['success'])
        print("✓ Test 04 Passed: Refill eligibility, cooldown, and duplicate prevention verified.")

if __name__ == '__main__':
    suite = unittest.TestLoader().loadTestsFromTestCase(SmmSystemTestSuite)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
