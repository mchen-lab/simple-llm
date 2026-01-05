import json
import sqlite3
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

DB_FILE = Path("data/logs.db")
LEGACY_LOG_FILE = Path("logs/llm.jsonl")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the SQLite database and migrate legacy logs if they exist."""
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create table
    c.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            model TEXT,
            prompt TEXT,
            response TEXT,
            duration_ms REAL,
            error TEXT,
            metadata TEXT,
            locked BOOLEAN DEFAULT 0
        )
    ''')
    
    # Attempt to add locked column if it doesn't exist (migrations for existing DB)
    try:
        c.execute('ALTER TABLE logs ADD COLUMN locked BOOLEAN DEFAULT 0')
    except sqlite3.OperationalError:
        pass # Column likely already exists

    # Check for legacy file and migrate
    if LEGACY_LOG_FILE.exists():
        print(f"Migrating legacy logs from {LEGACY_LOG_FILE}...")
        try:
            with open(LEGACY_LOG_FILE, "r", encoding="utf-8") as f:
                count = 0
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        entry = json.loads(line)
                        c.execute('''
                            INSERT INTO logs (timestamp, model, prompt, response, duration_ms, error, metadata, locked)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
                        ''', (
                            entry.get("timestamp"),
                            entry.get("model"),
                            entry.get("prompt"),
                            json.dumps(entry.get("response"), ensure_ascii=False),
                            entry.get("duration_ms"),
                            entry.get("error"),
                            json.dumps(entry.get("metadata", {}), ensure_ascii=False)
                        ))
                        count += 1
                    except Exception as e:
                        print(f"Skipping bad line during migration: {e}")
                
            print(f"Migrated {count} logs.")
            # Rename legacy file so we don't migrate again
            LEGACY_LOG_FILE.rename(LEGACY_LOG_FILE.with_suffix(".jsonl.bak"))
        except Exception as e:
            print(f"Migration failed: {e}")
            
    conn.commit()
    conn.close()

def log_llm_call(
    model: str,
    prompt: str,
    response: Any,
    start_time: float,
    error: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """Logs an LLM call to the SQLite database."""
    duration_ms = (time.time() - start_time) * 1000
    
    timestamp = datetime.utcnow().isoformat()
    metadata_json = json.dumps(metadata or {}, ensure_ascii=False)
    response_json = json.dumps(response, ensure_ascii=False)
    
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('''
            INSERT INTO logs (timestamp, model, prompt, response, duration_ms, error, metadata, locked)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        ''', (timestamp, model, prompt, response_json, duration_ms, error, metadata_json))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Failed to write log to DB: {e}")

def get_logs(
    limit: int = 50,
    offset: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Retrieve logs from the database with pagination and filtering."""
    logs = []
    if not DB_FILE.exists():
        return logs
        
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        query = 'SELECT * FROM logs'
        params = []
        conditions = []
        
        if start_date:
            conditions.append("timestamp >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("timestamp <= ?")
            params.append(end_date)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        c.execute(query, params)
        rows = c.fetchall()
        
        for row in rows:
            # Parse JSON fields back to objects
            try:
                response_obj = json.loads(row["response"])
            except:
                response_obj = row["response"]
                
            try:
                metadata_obj = json.loads(row["metadata"])
            except:
                metadata_obj = {}

            # Handle possible missing 'locked' column if using old read code (shouldn't happen with init_db running)
            is_locked = bool(row["locked"]) if "locked" in row.keys() else False

            logs.append({
                "id": row["id"],
                "timestamp": row["timestamp"],
                "model": row["model"],
                "prompt": row["prompt"],
                "response": response_obj,
                "duration_ms": row["duration_ms"],
                "error": row["error"],
                "metadata": metadata_obj,
                "locked": is_locked
            })
            
        conn.close()
    except Exception as e:
        print(f"Error reading logs from DB: {e}")
        
    return logs

def count_logs(start_date: Optional[str] = None, end_date: Optional[str] = None) -> int:
    """Count total logs matching filters."""
    if not DB_FILE.exists():
        return 0
        
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        query = 'SELECT COUNT(*) FROM logs'
        params = []
        conditions = []
        
        if start_date:
            conditions.append("timestamp >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("timestamp <= ?")
            params.append(end_date)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        c.execute(query, params)
        count = c.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        print(f"Error counting logs: {e}")
        return 0

def purge_logs(days_to_keep: int) -> int:
    """Delete logs older than N days, respecting locks. Returns count of deleted rows."""
    if not DB_FILE.exists():
        return 0
        
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Calculate cutoff date
        cutoff_date = datetime.utcnow().timestamp() - (days_to_keep * 86400)
        cutoff_iso = datetime.fromtimestamp(cutoff_date).isoformat()
        
        c.execute('DELETE FROM logs WHERE timestamp < ? AND (locked IS NULL OR locked = 0)', (cutoff_iso,))
        deleted_count = c.rowcount
        
        conn.commit()
        conn.close()
        return deleted_count
    except Exception as e:
        print(f"Error purging logs: {e}")
        return 0

def toggle_log_lock(log_id: int, locked: bool) -> bool:
    """Update the lock status of a log entry."""
    if not DB_FILE.exists():
        return False
        
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('UPDATE logs SET locked = ? WHERE id = ?', (1 if locked else 0, log_id))
        conn.commit()
        updated = c.rowcount > 0
        conn.close()
        return updated
    except Exception as e:
        print(f"Error toggling log locks: {e}")
        return False
