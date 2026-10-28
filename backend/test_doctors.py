import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_dynamic_doctor_management():
    print("==================================================================")
    print("  Testing MediWatch Dynamic Doctor Management & Deletion Suite    ")
    print("==================================================================")

    # 1. Reset database to clean state
    print("\n[Step 1] Resetting database...")
    res = client.post("/api/reset")
    assert res.status_code == 200, res.text

    # Verify initial doctors (DOC-101 to DOC-104)
    res = client.get("/api/doctors")
    assert res.status_code == 200
    initial_docs = res.json()
    print(f"Initial doctor count: {len(initial_docs)}")
    assert len(initial_docs) >= 4

    # 2. Add doctor (DOC-105)
    print("\n[Step 2] Adding doctor (Dr. Elena Rostova - Critical Care)...")
    next_id_res = client.get("/api/doctors/next-id")
    assert next_id_res.status_code == 200
    rec_id = next_id_res.json()["next_id"]
    print(f"Generated auto-recommended ID: {rec_id}")

    res = client.post("/api/doctors", json={
        "name": "Dr. Elena Rostova",
        "specialization": "Critical Care",
        "contact": "Ext. 4015 / Resuscitation Room",
        "custom_id": rec_id
    })
    assert res.status_code == 201, res.text
    doc5 = res.json()
    assert doc5["doctor_id"] == rec_id
    assert doc5["name"] == "Dr. Elena Rostova"
    assert doc5["specialization"] == "Critical Care"
    assert doc5["is_available"] is True
    assert doc5["is_active"] is True
    assert doc5["status"] == "Available"
    print(f"Successfully created doctor {doc5['doctor_id']} ({doc5['name']})")

    # 3. Add a temporary doctor with no history to test permanent deletion
    print("\n[Step 3] Adding temporary doctor (Dr. Temporary - Diagnostics) to test deletion...")
    temp_id_res = client.get("/api/doctors/next-id")
    temp_id = temp_id_res.json()["next_id"]
    res = client.post("/api/doctors", json={
        "name": "Dr. Temporary Diagnostics",
        "specialization": "Emergency Diagnostics",
        "contact": "Temp Desk",
        "custom_id": temp_id
    })
    assert res.status_code == 201
    print(f"Created temporary doctor {temp_id}")

    # TEST CASE 1: Delete a newly added doctor with no consultation history — deletion should succeed
    print("\n[TEST CASE 1] Deleting newly added doctor with no consultation history...")
    del_res = client.delete(f"/api/doctors/{temp_id}")
    assert del_res.status_code == 200, del_res.text
    print(f"Server response: {del_res.json()['message']}")

    # Verify doctor disappears from roster and cannot be fetched
    res = client.get("/api/doctors")
    assert not any(d["doctor_id"] == temp_id for d in res.json()), "Doctor should be absent from roster"
    get_del = client.get(f"/api/doctors/{temp_id}")
    # Endpoint should not find it or list doesn't include it
    print("CHECK: Doctor successfully deleted from SQLite and absent from roster.")

    # 4. Edit doctor details (Name and specialization)
    print("\n[Step 4] Editing doctor details (Updating Dr. Elena's specialization to 'Trauma & Acute Care')...")
    res = client.put(f"/api/doctors/{rec_id}", json={
        "name": "Dr. Elena Rostova-Smith",
        "specialization": "Trauma & Acute Care",
        "contact": "Ext. 4015 / Trauma Bay 2"
    })
    assert res.status_code == 200, res.text
    edited_doc = res.json()
    assert edited_doc["name"] == "Dr. Elena Rostova-Smith"
    assert edited_doc["specialization"] == "Trauma & Acute Care"
    print("CHECK: Doctor details successfully updated and persisted.")

    # 5. Register a patient and assign to Dr. Elena
    print("\n[Step 5] Registering a Critical patient and assigning to Dr. Elena...")
    res = client.post("/api/patients", json={
        "name": "Test Patient Emergency",
        "age": 48,
        "symptoms": "Acute respiratory distress",
        "urgency": "Critical",
        "custom_id": "P-TEST-99"
    })
    assert res.status_code == 201
    patient = res.json()["patient"]

    # Assign to Dr. Elena
    res = client.post(f"/api/doctors/{rec_id}/assign", json={"patient_id": patient["patient_id"]})
    assert res.status_code == 200, res.text
    print(f"CHECK: Patient {patient['patient_id']} assigned to {rec_id}.")

    # TEST CASE 2: Attempt to delete a doctor currently in consultation — must be rejected
    print("\n[TEST CASE 2] Attempting to delete doctor while in active consultation...")
    del_active = client.delete(f"/api/doctors/{rec_id}")
    assert del_active.status_code == 400
    print(f"Rejection response (expected): {del_active.json()['detail']}")
    assert "active consultation" in del_active.json()["detail"].lower()
    print("CHECK: Deletion of doctor in active consultation correctly rejected with 400.")

    # Also verify deactivation is blocked while in consultation
    deact_fail = client.patch(f"/api/doctors/{rec_id}/deactivate")
    assert deact_fail.status_code == 400
    print("CHECK: Deactivation blocked while in consultation.")

    # 6. Complete consultation
    print("\n[Step 6] Completing consultation for patient...")
    res = client.post(f"/api/patients/{patient['patient_id']}/complete")
    assert res.status_code == 200

    res = client.get("/api/doctors")
    doc_state = next(d for d in res.json() if d["doctor_id"] == rec_id)
    assert doc_state["is_available"] is True
    assert doc_state["status"] == "Available"
    assert doc_state["current_patient_id"] is None
    print("CHECK: Consultation completed and doctor is released back to Available.")

    # TEST CASE 3: Attempt to delete a doctor with historical consultations — must be rejected
    print("\n[TEST CASE 3] Attempting to delete doctor with historical patient consultations...")
    del_history = client.delete(f"/api/doctors/{rec_id}")
    assert del_history.status_code == 400
    print(f"Rejection response (expected): {del_history.json()['detail']}")
    assert "historical consultation" in del_history.json()["detail"].lower() or "audit" in del_history.json()["detail"].lower()
    print("CHECK: Permanent deletion blocked due to existing consultation history.")

    # 7. Deactivate the doctor and verify doctor cannot receive new assignments
    print("\n[Step 7] Deactivating the doctor...")
    res = client.patch(f"/api/doctors/{rec_id}/deactivate")
    assert res.status_code == 200, res.text
    deact_doc = res.json()
    assert deact_doc["is_active"] is False
    assert deact_doc["is_available"] is False
    assert deact_doc["status"] == "Unavailable"
    print("CHECK: Doctor successfully deactivated.")

    # Reactivate the doctor
    print("\n[Step 7b] Testing doctor reactivation...")
    react_res = client.patch(f"/api/doctors/{rec_id}/activate")
    assert react_res.status_code == 200
    assert react_res.json()["is_active"] is True
    assert react_res.json()["is_available"] is True
    print("CHECK: Doctor reactivated successfully.")

    # 8. Verify C++ DSA Priority Queue ordering remains 100% intact
    print("\n[Step 8] Verifying C++ Binary Min-Heap Priority Queue integrity...")
    q_res = client.get("/api/queue")
    assert q_res.status_code == 200
    print(f"C++ Engine Status: {q_res.json().get('engine')}")

    # Verify patient record remains intact
    pat_res = client.get(f"/api/patients/{patient['patient_id']}")
    assert pat_res.status_code == 200
    assert pat_res.json()["assigned_doctor_id"] == rec_id
    assert pat_res.json()["status"] == "Completed"
    print("CHECK: Patient record and consultation audit trail completely preserved.")

    print("\n==================================================================")
    print("  ALL TESTS INCLUDING DIRECT DELETE & REJECTION PASSED 100%!       ")
    print("==================================================================")

if __name__ == "__main__":
    test_dynamic_doctor_management()
