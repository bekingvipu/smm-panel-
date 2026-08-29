import sqlite3
import random
import time

class InsufficientFundsError(Exception):
    pass

class WalletLedger:
    @staticmethod
    def deduct_balance(db_conn, user_id, amount, order_id):
        """
        Atomically debits wallet balance under SQLite transaction.
        Throws InsufficientFundsError if balance < amount.
        """
        cursor = db_conn.cursor()
        cursor.execute("BEGIN IMMEDIATE;")

        cursor.execute("SELECT balance, spent FROM users WHERE id = ?;", (user_id,))
        user = cursor.fetchone()
        if not user:
            db_conn.rollback()
            raise ValueError(f"User #{user_id} not found.")

        current_balance = user['balance']
        if current_balance < amount:
            db_conn.rollback()
            raise InsufficientFundsError(f"Insufficient funds: Required ${amount:.2f}, available ${current_balance:.2f}.")

        new_balance = round(current_balance - amount, 4)
        new_spent = round(user['spent'] + amount, 4)

        # Update User Balance & Spent
        cursor.execute("UPDATE users SET balance = ?, spent = ? WHERE id = ?;", (new_balance, new_spent, user_id))

        # Insert Immutable Ledger Transaction
        txn_id = f"TXN-{random.randint(1000, 9999)}"
        cursor.execute("""
        INSERT INTO wallet_transactions (id, user_id, type, description, amount, balance_after, status)
        VALUES (?, ?, 'Order Deduction', ?, ?, ?, 'Success');
        """, (txn_id, user_id, f"Payment for Order #{order_id}", -amount, new_balance))

        db_conn.commit()
        return new_balance

    @staticmethod
    def add_funds(db_conn, user_id, amount, method="UPI / Instant Pay"):
        cursor = db_conn.cursor()
        cursor.execute("BEGIN IMMEDIATE;")

        cursor.execute("SELECT balance FROM users WHERE id = ?;", (user_id,))
        user = cursor.fetchone()
        if not user:
            db_conn.rollback()
            raise ValueError("User not found.")

        new_balance = round(user['balance'] + amount, 4)
        cursor.execute("UPDATE users SET balance = ? WHERE id = ?;", (new_balance, user_id))

        txn_id = f"TXN-{random.randint(1000, 9999)}"
        cursor.execute("""
        INSERT INTO wallet_transactions (id, user_id, type, description, amount, balance_after, status)
        VALUES (?, ?, 'Deposit', ?, ?, ?, 'Success');
        """, (txn_id, user_id, f"Funds Added via {method}", amount, new_balance))

        db_conn.commit()
        return new_balance
