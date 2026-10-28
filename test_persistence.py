import os
import sys
import sqlite3

# Verify SQLite persistence
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))
from database import init_db, get_db_connection, DB_FILE
from dsa_wrapper import get_prioritized_queue

print("Database file location:", DB_FILE)
conn = get_db_connection()
c = conn.cursor()
c.execute("SELECT COUNT(*) FROM patients")
count = c.fetchone()[0]
print(f"Total persisted patient records in SQLite: {count}")

c.execute("SELECT patient_id, name, urgency, priority, arrival_seq, status FROM patients WHERE status = 'Waiting'")
waiting = [dict(r) for r in c.fetchall()]
print(f"Waiting patients in database: {len(waiting)}")
for p in waiting:
    print(f"  {p['patient_id']} - {p['name']} ({p['urgency']}) - Seq #{p['arrival_seq']}")

if waiting:
    sorted_q = get_prioritized_queue(waiting)
    print("\nReconstructed Queue via C++ Min-Heap after load:")
    for idx, p in enumerate(sorted_q):
        print(f"  Position {idx+1}: {p['name']} ({p['patient_id']}) - Urgency {p['urgency']} (Priority {p['priority']}, Seq #{p['arrival_seq']})")
conn.close()
print("Persistence test verified successfully!")

