import sqlite3
import os
import re
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mediwatch.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Patients table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        patient_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        symptoms TEXT NOT NULL,
        urgency TEXT NOT NULL,
        priority INTEGER NOT NULL,
        arrival_seq INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Waiting',
        created_at TEXT NOT NULL,
        called_at TEXT,
        completed_at TEXT,
        assigned_doctor_id TEXT,
        assigned_doctor_name TEXT
    )
    """)

    # Doctors table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        doctor_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        specialization TEXT NOT NULL,
        contact TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Available',
        is_available INTEGER NOT NULL DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        current_patient_id TEXT,
        current_patient_name TEXT
    )
    """)

    # Ensure backward-compatible columns if table already existed
    cursor.execute("PRAGMA table_info(doctors)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    if "contact" not in existing_cols:
        cursor.execute("ALTER TABLE doctors ADD COLUMN contact TEXT DEFAULT ''")
    if "status" not in existing_cols:
        cursor.execute("ALTER TABLE doctors ADD COLUMN status TEXT NOT NULL DEFAULT 'Available'")
    if "is_active" not in existing_cols:
        cursor.execute("ALTER TABLE doctors ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")

    # Arrival sequence counter table to guarantee strict FIFO sequence across restarts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sequence_counter (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_seq INTEGER NOT NULL DEFAULT 0
    )
    """)

    cursor.execute("INSERT OR IGNORE INTO sequence_counter (id, current_seq) VALUES (1, 0)")

    # Seed initial ER Doctors if table is empty
    cursor.execute("SELECT COUNT(*) FROM doctors")
    if cursor.fetchone()[0] == 0:
        default_doctors = [
            ("DOC-101", "Dr. Sarah Chen", "Trauma & Acute Care", "Ext. 4011 / Trauma Bay", "Available", 1, 1, None, None),
            ("DOC-102", "Dr. Marcus Vance", "Emergency Medicine", "Ext. 4012 / ER Zone A", "Available", 1, 1, None, None),
            ("DOC-103", "Dr. Priya Patel", "Critical Care Specialist", "Ext. 4013 / ICU Triage", "Available", 1, 1, None, None),
            ("DOC-104", "Dr. James Wilson", "Emergency Diagnostics", "Ext. 4014 / Fast Track", "Available", 1, 1, None, None)
        ]
        cursor.executemany(
            """INSERT INTO doctors (
                doctor_id, name, specialization, contact, status, is_available, is_active, current_patient_id, current_patient_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            default_doctors
        )

    conn.commit()
    conn.close()

def get_next_arrival_sequence():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE sequence_counter SET current_seq = current_seq + 1 WHERE id = 1")
    cursor.execute("SELECT current_seq FROM sequence_counter WHERE id = 1")
    seq = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return seq

def get_next_doctor_id():
    """Generates the next unique Doctor ID like DOC-105 based on existing doctors."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT doctor_id FROM doctors")
    rows = cursor.fetchall()
    conn.close()

    max_num = 100
    for r in rows:
        match = re.search(r'DOC-(\d+)', r['doctor_id'], re.IGNORECASE)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num

    return f"DOC-{max_num + 1}"
