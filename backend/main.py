from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os
from typing import List, Optional

from database import init_db, get_db_connection, get_next_arrival_sequence, get_next_doctor_id
from schemas import (
    PatientCreate, PatientResponse, PriorityUpdate,
    DoctorResponse, DoctorCreate, DoctorUpdate, DashboardStats, AssignDoctorRequest
)
from dsa_wrapper import get_prioritized_queue, run_dsa_heap, verify_or_compile_engine, EXE_PATH

app = FastAPI(
    title="MediWatch DSA Engine & Emergency API",
    description="Emergency Queue Management System powered by C++ Binary Min-Heap & SQLite",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    verify_or_compile_engine()

# Also run init_db immediately upon module import
init_db()

# Helper mapping for priority levels
URGENCY_PRIORITY_MAP = {
    "Critical": 1,
    "Moderate": 2,
    "Low": 3
}

def patient_row_to_dict(row) -> dict:
    return {
        "patient_id": row["patient_id"],
        "name": row["name"],
        "age": row["age"],
        "symptoms": row["symptoms"],
        "urgency": row["urgency"],
        "priority": row["priority"],
        "arrival_seq": row["arrival_seq"],
        "status": row["status"],
        "created_at": row["created_at"],
        "called_at": row["called_at"],
        "completed_at": row["completed_at"],
        "assigned_doctor_id": row["assigned_doctor_id"],
        "assigned_doctor_name": row["assigned_doctor_name"]
    }

def doctor_row_to_dict(row) -> dict:
    keys = row.keys()
    contact = row["contact"] if "contact" in keys and row["contact"] is not None else ""
    is_active = bool(row["is_active"]) if "is_active" in keys and row["is_active"] is not None else True
    is_available = bool(row["is_available"])
    
    if not is_active:
        current_status = "Unavailable"
    elif row["current_patient_id"]:
        current_status = "In Consultation"
    elif "status" in keys and row["status"]:
        current_status = row["status"]
    else:
        current_status = "Available" if is_available else "Unavailable"

    return {
        "doctor_id": row["doctor_id"],
        "name": row["name"],
        "specialization": row["specialization"],
        "contact": contact,
        "status": current_status,
        "is_available": is_available and is_active and not bool(row["current_patient_id"]),
        "is_active": is_active,
        "current_patient_id": row["current_patient_id"],
        "current_patient_name": row["current_patient_name"]
    }

# ----------------- Endpoints -----------------

@app.get("/api/health")
def health_check():
    engine_exists = os.path.exists(EXE_PATH)
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cpp_dsa_engine": {
            "status": "ready" if engine_exists else "not_compiled",
            "binary_path": EXE_PATH
        }
    }

@app.get("/api/dashboard", response_model=DashboardStats)
def get_dashboard_stats():
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM patients WHERE status = 'Waiting'")
    waiting_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM patients WHERE status = 'In Consultation'")
    in_consultation_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM patients WHERE status = 'Completed'")
    completed_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM patients")
    total_patients = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM patients WHERE status = 'Waiting' AND urgency = 'Critical'")
    critical_waiting = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM patients WHERE status = 'Waiting' AND urgency = 'Moderate'")
    moderate_waiting = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM patients WHERE status = 'Waiting' AND urgency = 'Low'")
    low_waiting = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM doctors WHERE is_available = 1 AND is_active = 1")
    available_doctors = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM doctors WHERE is_active = 1")
    total_doctors = c.fetchone()[0]

    # Query all waiting patients and send to C++ min-heap to peek next patient
    c.execute("SELECT * FROM patients WHERE status = 'Waiting'")
    waiting_rows = c.fetchall()
    waiting_list = [patient_row_to_dict(r) for r in waiting_rows]
    conn.close()

    next_patient = None
    if waiting_list:
        ordered_queue = get_prioritized_queue(waiting_list)
        if ordered_queue:
            next_patient = ordered_queue[0]

    return DashboardStats(
        waiting_count=waiting_count,
        in_consultation_count=in_consultation_count,
        completed_count=completed_count,
        total_patients=total_patients,
        critical_waiting=critical_waiting,
        moderate_waiting=moderate_waiting,
        low_waiting=low_waiting,
        available_doctors=available_doctors,
        total_doctors=total_doctors,
        next_patient=next_patient
    )

@app.get("/api/queue")
def get_emergency_queue():
    """
    Retrieves all waiting patients and passes them directly to the compiled C++
    binary min-heap to compute the strictly prioritized emergency queue.
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM patients WHERE status = 'Waiting'")
    rows = c.fetchall()
    conn.close()

    raw_waiting = [patient_row_to_dict(r) for r in rows]
    if not raw_waiting:
        return {
            "total_waiting": 0,
            "queue": [],
            "next_patient": None,
            "engine": "C++ Binary Min-Heap"
        }

    # Execute C++ Priority Queue
    dsa_result = run_dsa_heap("order", raw_waiting)
    ordered_queue = dsa_result.get("queue", [])
    next_patient = dsa_result.get("next_patient")

    return {
        "total_waiting": len(ordered_queue),
        "queue": ordered_queue,
        "next_patient": next_patient,
        "engine": "C++ Binary Min-Heap (O(N log N) Heap Sort extraction)"
    }

@app.post("/api/queue/call-next")
def call_next_patient():
    """
    Calls the highest-priority patient waiting in queue using C++ Min-Heap getNextPatient().
    Updates their status to 'In Consultation'.
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM patients WHERE status = 'Waiting'")
    rows = c.fetchall()

    if not rows:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The emergency queue is currently empty. No waiting patients to call."
        )

    raw_waiting = [patient_row_to_dict(r) for r in rows]

    # Execute C++ getNextPatient() operation
    dsa_result = run_dsa_heap("pop", raw_waiting)
    popped = dsa_result.get("popped_patient")

    if not popped:
        conn.close()
        raise HTTPException(status_code=500, detail="Failed to retrieve next patient from C++ engine.")

    patient_id = popped["patient_id"]
    called_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    c.execute(
        "UPDATE patients SET status = 'In Consultation', called_at = ? WHERE patient_id = ?",
        (called_at, patient_id)
    )
    conn.commit()

    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    updated_row = c.fetchone()
    conn.close()

    return {
        "message": f"Patient {popped['name']} ({patient_id}) called for consultation.",
        "patient": patient_row_to_dict(updated_row)
    }

@app.post("/api/patients", status_code=status.HTTP_201_CREATED)
def register_patient(patient: PatientCreate):
    urgency = patient.urgency if patient.urgency in URGENCY_PRIORITY_MAP else "Moderate"
    priority = URGENCY_PRIORITY_MAP[urgency]
    arrival_seq = get_next_arrival_sequence()

    patient_id = patient.custom_id.strip() if patient.custom_id and patient.custom_id.strip() else f"P-{1000 + arrival_seq}"

    conn = get_db_connection()
    c = conn.cursor()

    # Check for duplicate patient ID
    c.execute("SELECT COUNT(*) FROM patients WHERE patient_id = ?", (patient_id,))
    if c.fetchone()[0] > 0:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient ID '{patient_id}' already exists. Please provide a unique ID or leave blank to auto-generate."
        )

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    c.execute("""
        INSERT INTO patients (
            patient_id, name, age, symptoms, urgency, priority,
            arrival_seq, status, created_at, called_at, completed_at,
            assigned_doctor_id, assigned_doctor_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Waiting', ?, NULL, NULL, NULL, NULL)
    """, (patient_id, patient.name, patient.age, patient.symptoms, urgency, priority, arrival_seq, created_at))

    conn.commit()
    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    saved_patient = patient_row_to_dict(c.fetchone())
    conn.close()

    return {
        "message": "Patient registered successfully and added to Emergency Priority Queue.",
        "patient": saved_patient
    }

@app.get("/api/patients")
def list_patients(
    search: Optional[str] = Query(None, description="Search by Patient ID or Name"),
    status: Optional[str] = Query(None, description="Filter by status: Waiting, In Consultation, Completed")
):
    conn = get_db_connection()
    c = conn.cursor()

    query = "SELECT * FROM patients WHERE 1=1"
    params = []

    if status and status != "All":
        query += " AND status = ?"
        params.append(status)

    if search and search.strip():
        query += " AND (patient_id LIKE ? OR name LIKE ? OR symptoms LIKE ?)"
        wildcard = f"%{search.strip()}%"
        params.extend([wildcard, wildcard, wildcard])

    query += " ORDER BY arrival_seq DESC"
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    return [patient_row_to_dict(r) for r in rows]

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Patient with ID '{patient_id}' not found.")
    return patient_row_to_dict(row)

@app.patch("/api/patients/{patient_id}/priority")
def update_patient_priority(patient_id: str, update: PriorityUpdate):
    if update.urgency not in URGENCY_PRIORITY_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid urgency '{update.urgency}'. Must be Critical, Moderate, or Low."
        )

    new_priority = URGENCY_PRIORITY_MAP[update.urgency]

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT status FROM patients WHERE patient_id = ?", (patient_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient not found.")

    c.execute(
        "UPDATE patients SET urgency = ?, priority = ? WHERE patient_id = ?",
        (update.urgency, new_priority, patient_id)
    )
    conn.commit()

    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    updated = patient_row_to_dict(c.fetchone())
    conn.close()

    return {
        "message": f"Patient priority updated to {update.urgency}. Emergency queue recomputed.",
        "patient": updated
    }

@app.post("/api/patients/{patient_id}/in-consultation")
def mark_in_consultation(patient_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient not found.")

    if row["status"] == "Completed":
        conn.close()
        raise HTTPException(status_code=400, detail="Completed patient cannot re-enter consultation.")

    called_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("UPDATE patients SET status = 'In Consultation', called_at = ? WHERE patient_id = ?", (called_at, patient_id))
    conn.commit()

    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    updated = patient_row_to_dict(c.fetchone())
    conn.close()
    return updated

@app.get("/api/doctors", response_model=List[DoctorResponse])
@app.get("/doctors", response_model=List[DoctorResponse])
def get_doctors(active_only: bool = False):
    conn = get_db_connection()
    c = conn.cursor()
    if active_only:
        c.execute("SELECT * FROM doctors WHERE is_active = 1 ORDER BY doctor_id")
    else:
        c.execute("SELECT * FROM doctors ORDER BY doctor_id")
    rows = c.fetchall()
    conn.close()
    return [doctor_row_to_dict(r) for r in rows]

@app.get("/api/doctors/next-id")
@app.get("/doctors/next-id")
def get_recommended_doctor_id():
    return {"next_id": get_next_doctor_id()}

@app.post("/api/doctors", status_code=status.HTTP_201_CREATED, response_model=DoctorResponse)
@app.post("/doctors", status_code=status.HTTP_201_CREATED, response_model=DoctorResponse)
def create_doctor(doc_in: DoctorCreate):
    name = doc_in.name.strip()
    specialization = doc_in.specialization.strip()
    contact = (doc_in.contact or "").strip()

    if not name:
        raise HTTPException(status_code=400, detail="Doctor name is required.")
    if not specialization:
        raise HTTPException(status_code=400, detail="Doctor specialization is required.")

    doctor_id = doc_in.custom_id.strip() if doc_in.custom_id and doc_in.custom_id.strip() else get_next_doctor_id()

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM doctors WHERE doctor_id = ?", (doctor_id,))
    if c.fetchone()[0] > 0:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Doctor ID '{doctor_id}' already exists. Please choose a unique ID.")

    c.execute("""
        INSERT INTO doctors (
            doctor_id, name, specialization, contact, status, is_available, is_active, current_patient_id, current_patient_name
        ) VALUES (?, ?, ?, ?, 'Available', 1, 1, NULL, NULL)
    """, (doctor_id, name, specialization, contact))
    conn.commit()

    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    created = doctor_row_to_dict(c.fetchone())
    conn.close()
    return created

@app.put("/api/doctors/{doctor_id}", response_model=DoctorResponse)
@app.put("/doctors/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: str, doc_in: DoctorUpdate):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    doc = c.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Doctor with ID '{doctor_id}' not found.")

    doc_dict = doctor_row_to_dict(doc)
    new_name = doc_in.name.strip() if doc_in.name is not None else doc_dict["name"]
    new_spec = doc_in.specialization.strip() if doc_in.specialization is not None else doc_dict["specialization"]
    new_contact = doc_in.contact.strip() if doc_in.contact is not None else doc_dict["contact"]

    new_status = doc_dict["status"]
    new_is_available = doc_dict["is_available"]

    if doc_in.status is not None:
        if doc_dict["status"] == "In Consultation" and doc_in.status != "In Consultation":
            conn.close()
            raise HTTPException(
                status_code=400,
                detail="Cannot alter status while doctor is attending an active consultation. Please complete consultation first."
            )
        if doc_in.status in ["Available", "Unavailable"]:
            new_status = doc_in.status
            new_is_available = 1 if (new_status == "Available" and doc_dict["is_active"]) else 0

    c.execute("""
        UPDATE doctors
        SET name = ?, specialization = ?, contact = ?, status = ?, is_available = ?
        WHERE doctor_id = ?
    """, (new_name, new_spec, new_contact, new_status, new_is_available, doctor_id))
    conn.commit()

    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    updated = doctor_row_to_dict(c.fetchone())
    conn.close()
    return updated

@app.patch("/api/doctors/{doctor_id}/deactivate", response_model=DoctorResponse)
@app.patch("/doctors/{doctor_id}/deactivate", response_model=DoctorResponse)
def deactivate_doctor(doctor_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    doc = c.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Doctor with ID '{doctor_id}' not found.")

    if doc["current_patient_id"]:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot deactivate {doc['name']} because they are currently in consultation with patient {doc['current_patient_id']}. Please complete the consultation first."
        )

    c.execute("""
        UPDATE doctors
        SET is_active = 0, is_available = 0, status = 'Unavailable'
        WHERE doctor_id = ?
    """, (doctor_id,))
    conn.commit()

    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    updated = doctor_row_to_dict(c.fetchone())
    conn.close()
    return updated

@app.patch("/api/doctors/{doctor_id}/activate", response_model=DoctorResponse)
@app.patch("/doctors/{doctor_id}/activate", response_model=DoctorResponse)
def activate_doctor(doctor_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    doc = c.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Doctor with ID '{doctor_id}' not found.")

    c.execute("""
        UPDATE doctors
        SET is_active = 1, is_available = 1, status = 'Available'
        WHERE doctor_id = ?
    """, (doctor_id,))
    conn.commit()

    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    updated = doctor_row_to_dict(c.fetchone())
    conn.close()
    return updated

@app.delete("/api/doctors/{doctor_id}")
@app.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    doc = c.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found.")

    if doc["current_patient_id"]:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a doctor currently attending an active consultation. Please complete the consultation first."
        )

    c.execute("SELECT COUNT(*) FROM patients WHERE assigned_doctor_id = ?", (doctor_id,))
    consult_count = c.fetchone()[0]
    if consult_count > 0:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Doctor {doc['name']} ({doctor_id}) has {consult_count} historical consultation record(s). Permanent deletion is prohibited to preserve clinical audit history. Please deactivate the doctor instead."
        )

    c.execute("DELETE FROM doctors WHERE doctor_id = ?", (doctor_id,))
    conn.commit()
    conn.close()
    return {"message": f"Doctor {doc['name']} ({doctor_id}) was permanently deleted successfully."}

@app.post("/api/doctors/{doctor_id}/assign")
@app.post("/doctors/{doctor_id}/assign")
def assign_doctor(doctor_id: str, request: AssignDoctorRequest):
    patient_id = request.patient_id
    conn = get_db_connection()
    c = conn.cursor()

    # Verify doctor
    c.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    doc = c.fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found.")

    if not doc["is_active"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{doc['name']} is deactivated and cannot receive new patient assignments."
        )

    if not doc["is_available"] or doc["current_patient_id"] is not None:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{doc['name']} is already attending patient {doc['current_patient_id'] or 'another consultation'}. Please choose an available doctor."
        )

    # Verify patient
    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    pat = c.fetchone()
    if not pat:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient not found.")

    if pat["status"] == "Completed":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot assign a completed patient.")

    # Assign doctor & update patient
    c.execute(
        "UPDATE doctors SET is_available = 0, status = 'In Consultation', current_patient_id = ?, current_patient_name = ? WHERE doctor_id = ?",
        (pat["patient_id"], pat["name"], doctor_id)
    )
    c.execute(
        "UPDATE patients SET status = 'In Consultation', assigned_doctor_id = ?, assigned_doctor_name = ? WHERE patient_id = ?",
        (doctor_id, doc["name"], patient_id)
    )

    conn.commit()
    conn.close()

    return {
        "message": f"Successfully assigned {pat['name']} to {doc['name']}.",
        "doctor_id": doctor_id,
        "patient_id": patient_id
    }

@app.post("/api/patients/{patient_id}/complete")
def complete_consultation(patient_id: str):
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    pat = c.fetchone()
    if not pat:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient not found.")

    if pat["status"] == "Completed":
        conn.close()
        return {"message": "Patient consultation already completed."}

    completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Release any doctor currently attending this patient, respecting active state
    c.execute("""
        UPDATE doctors
        SET is_available = CASE WHEN is_active = 1 THEN 1 ELSE 0 END,
            status = CASE WHEN is_active = 1 THEN 'Available' ELSE 'Unavailable' END,
            current_patient_id = NULL,
            current_patient_name = NULL
        WHERE current_patient_id = ?
    """, (patient_id,))

    # Mark patient completed
    c.execute(
        "UPDATE patients SET status = 'Completed', completed_at = ? WHERE patient_id = ?",
        (completed_at, patient_id)
    )

    conn.commit()
    c.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    updated = patient_row_to_dict(c.fetchone())
    conn.close()

    return {
        "message": f"Consultation for patient {pat['name']} ({patient_id}) completed.",
        "patient": updated
    }

@app.post("/api/reset")
def reset_database():
    """Testing/Demonstration utility to re-initialize SQLite database."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM patients")
    c.execute("UPDATE sequence_counter SET current_seq = 0 WHERE id = 1")
    c.execute("UPDATE doctors SET is_active = 1, is_available = 1, status = 'Available', current_patient_id = NULL, current_patient_name = NULL")

    # Ensure baseline doctors exist for automated tests
    default_doctors = [
        ("DOC-101", "Dr. Sarah Chen", "Trauma & Acute Care", "Ext. 4011 / Trauma Bay", "Available", 1, 1, None, None),
        ("DOC-102", "Dr. Marcus Vance", "Emergency Medicine", "Ext. 4012 / ER Zone A", "Available", 1, 1, None, None),
        ("DOC-103", "Dr. Priya Patel", "Critical Care Specialist", "Ext. 4013 / ICU Triage", "Available", 1, 1, None, None),
        ("DOC-104", "Dr. James Wilson", "Emergency Diagnostics", "Ext. 4014 / Fast Track", "Available", 1, 1, None, None)
    ]
    for doc in default_doctors:
        c.execute("""
            INSERT OR IGNORE INTO doctors (
                doctor_id, name, specialization, contact, status, is_available, is_active, current_patient_id, current_patient_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, doc)

    conn.commit()
    conn.close()
    return {"message": "Database reset to initial clean state."}

# ----------------- Static Frontend Mounting -----------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

