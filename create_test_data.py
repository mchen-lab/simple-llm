
import sqlite3
import json
import time
from datetime import datetime, timedelta

DB_FILE = "data/logs.db"

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def create_sample_logs():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. A log with a tag
    c.execute('''
        INSERT INTO logs (timestamp, model, prompt, response, duration_ms, error, metadata, locked, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    ''', (
        datetime.utcnow().isoformat(),
        "gpt-4o",
        "Explain quantum computing in 5 sentences.",
        json.dumps("Quantum computing uses qubits to perform calculations..."),
        1250.5,
        None,
        json.dumps({"format": "text", "usage": {"total_tokens": 150}}),
        "physics-101"
    ))

    # 2. A gen_dict log with a schema
    schema = """{
  "name": "string",
  "age": "number",
  "hobbies": ["string"]
}"""
    response = {
        "name": "Alice",
        "age": 30,
        "hobbies": ["reading", "hiking", "coding"]
    }
    
    c.execute('''
        INSERT INTO logs (timestamp, model, prompt, response, duration_ms, error, metadata, locked, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    ''', (
        (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
        "claude-3-5-sonnet",
        "Generate a user profile for Alice.",
        json.dumps(response),
        2100.2,
        None,
        json.dumps({
            "format": "dict", 
            "schema": schema, 
            "usage": {"total_tokens": 280}
        }),
        "user-gen"
    ))

    # 3. Another tagged log for testing search
    c.execute('''
        INSERT INTO logs (timestamp, model, prompt, response, duration_ms, error, metadata, locked, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    ''', (
        (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        "gpt-3.5-turbo",
        "What is the capital of France?",
        json.dumps("The capital of France is Paris."),
        450.0,
        None,
        json.dumps({"format": "text", "usage": {"total_tokens": 40}}),
        "geography"
    ))

    # 4. A log with an error and a tag
    c.execute('''
        INSERT INTO logs (timestamp, model, prompt, response, duration_ms, error, metadata, locked, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    ''', (
        (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "gpt-4o",
        "Summarize this 100MB file.",
        None,
        5000.0,
        "Context length exceeded: request too large.",
        json.dumps({"format": "text", "usage": {"total_tokens": 0}}),
        "error-test"
    ))

    conn.commit()
    conn.close()
    print("Sample logs created successfully!")

if __name__ == "__main__":
    create_sample_logs()
