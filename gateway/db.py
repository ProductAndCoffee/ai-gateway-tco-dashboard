import sqlite3
import os
import json
import hashlib
from typing import Dict, Any

DB_PATH = "gateway.db"

def get_connection():
    """Returns a connection to the SQLite database, with row factory set."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite schema."""
    conn = get_connection()
    cursor = conn.cursor()

    # Apps table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS apps (
        app_id TEXT PRIMARY KEY,
        display_name TEXT,
        api_key TEXT,
        rpm_limit INTEGER,
        budget_limit REAL
    )
    ''')

    # Requests table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS requests (
        request_id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        app_id TEXT,
        prompt TEXT,
        routing_policy TEXT,
        routing_reason TEXT,
        task_type TEXT,
        estimated_prompt_tokens INTEGER,
        baseline_model TEXT,
        routed_model TEXT,
        cache_hit BOOLEAN,
        similarity_score REAL,
        tokens_prompt INTEGER,
        tokens_completion INTEGER,
        cost REAL,
        latency INTEGER,
        status_code INTEGER,
        routing_savings REAL,
        is_manual BOOLEAN DEFAULT FALSE,
        FOREIGN KEY(app_id) REFERENCES apps(app_id)
    )
    ''')

    # Cache entries table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS cache_entries (
        cache_entry_id TEXT PRIMARY KEY,
        app_id TEXT,
        prompt_hash TEXT,
        response TEXT,
        routed_model TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        estimated_input_tokens INTEGER,
        estimated_output_tokens INTEGER,
        estimated_cost REAL,
        FOREIGN KEY(app_id) REFERENCES apps(app_id)
    )
    ''')

    # Model prices table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS model_prices (
        model_name TEXT PRIMARY KEY,
        input_price_per_1k REAL,
        output_price_per_1k REAL
    )
    ''')

    conn.commit()
    conn.close()

def seed_data():
    """Seeds the database with the contracted default apps and prices."""
    conn = get_connection()
    cursor = conn.cursor()

    # Clear existing data for a clean seed
    cursor.execute('DELETE FROM apps')
    cursor.execute('DELETE FROM model_prices')

    # Seed Apps
    apps = [
        ('support-bot', 'Support Bot', hashlib.sha256('key_1'.encode()).hexdigest(), 100, 50.00),
        ('content-tool', 'Content Generator', hashlib.sha256('key_2'.encode()).hexdigest(), 50, 200.00),
        ('rogue-app', 'Rogue Integration', hashlib.sha256('key_3'.encode()).hexdigest(), 10, 5.00),
        ('live-data-query', 'Live Data Agent', hashlib.sha256('key_4'.encode()).hexdigest(), 200, 100.00)
    ]
    cursor.executemany('''
    INSERT INTO apps (app_id, display_name, api_key, rpm_limit, budget_limit)
    VALUES (?, ?, ?, ?, ?)
    ''', apps)

    # Seed Model Prices
    prices = [
        ('gpt-4-class', 0.010, 0.030),
        ('gemini-flash-class', 0.00035, 0.00105)
    ]
    cursor.executemany('''
    INSERT INTO model_prices (model_name, input_price_per_1k, output_price_per_1k)
    VALUES (?, ?, ?)
    ''', prices)

    conn.commit()
    conn.close()

def clear_requests_and_cache():
    """Clears request logs and cache entries, used for Demo Reset."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM requests')
    cursor.execute('DELETE FROM cache_entries')
    conn.commit()
    conn.close()

def reset_demo():
    """Performs a full demo reset: clears logs, cache, and restores seeds."""
    clear_requests_and_cache()
    seed_data()

# Automatically initialize and seed if running directly or imported for the first time
if not os.path.exists(DB_PATH):
    init_db()
    seed_data()
