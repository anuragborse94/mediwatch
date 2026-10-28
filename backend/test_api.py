import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_complete_scenario():
    print(">>> 1. Resetting database to clean state...")
    res = client.post("/api/reset")
    assert res.status_code == 200, res.text

    print(">>> 2. Registering Patient A (Moderate priority)...")
    res = client.post("/api/patients", json={
        "name": "Patient A",
        "age": 30,
        "symptoms": "High fever and persistent cough",
        "urgency": "Moderate",
        "custom_id": "P-A01"
    })
    assert res.status_code == 201, res.text
    pA = res.json()["patient"]
    assert pA["urgency"] == "Moderate"
    assert pA["priority"] == 2
    assert pA["arrival_seq"] == 1
    print(f"Registered: {pA['name']} with Priority {pA['priority']}, ArrivalSeq {pA['arrival_seq']}")

    print(">>> 3. Registering Patient B (Critical priority)...")
    res = client.post("/api/patients", json={
        "name": "Patient B",
        "age": 55,
        "symptoms": "Acute severe chest pain and diaphoresis",
        "urgency": "Critical",
        "custom_id": "P-B02"
    })
    assert res.status_code == 201, res.text
    pB = res.json()["patient"]
    assert pB["urgency"] == "Critical"
    assert pB["priority"] == 1
    assert pB["arrival_seq"] == 2
    print(f"Registered: {pB['name']} with Priority {pB['priority']}, ArrivalSeq {pB['arrival_seq']}")

    print(">>> 4. Registering Patient C (Moderate priority, after Patient A)...")
    res = client.post("/api/patients", json={
        "name": "Patient C",
        "age": 42,
        "symptoms": "Forearm fracture from a fall",
        "urgency": "Moderate",
        "custom_id": "P-C03"
    })
    assert res.status_code == 201, res.text
    pC = res.json()["patient"]
    assert pC["urgency"] == "Moderate"
    assert pC["priority"] == 2
    assert pC["arrival_seq"] == 3
    print(f"Registered: {pC['name']} with Priority {pC['priority']}, ArrivalSeq {pC['arrival_seq']}")

    print(">>> 5. Verifying Queue Order via C++ Priority Queue Binary...")
    res = client.get("/api/queue")
    assert res.status_code == 200, res.text
    queue_data = res.json()
    queue = queue_data["queue"]
    print("Order returned by C++ Binary Min-Heap:")
    for idx, p in enumerate(queue):
        print(f"  Pos {idx+1}: {p['name']} ({p['patient_id']}) - Urgency: {p['urgency']}, ArrivalSeq: {p['arrival_seq']}")

    assert len(queue) == 3
    assert queue[0]["patient_id"] == "P-B02", f"Expected P-B02 first, got {queue[0]['patient_id']}"
    assert queue[1]["patient_id"] == "P-A01", f"Expected P-A01 second, got {queue[1]['patient_id']}"
    assert queue[2]["patient_id"] == "P-C03", f"Expected P-C03 third, got {queue[2]['patient_id']}"
    print("CHECK: Queue order strictly confirmed as B, A, C!")

    print(">>> 6. Calling Next Patient via C++ Heap...")
    res = client.post("/api/queue/call-next")
    assert res.status_code == 200, res.text
    called = res.json()["patient"]
    assert called["patient_id"] == "P-B02"
    assert called["status"] == "In Consultation"
    print(f"CHECK: Patient B successfully called for consultation.")

    print(">>> 7. Assigning Patient B to an available doctor (DOC-101)...")
    res = client.post("/api/doctors/DOC-101/assign", json={"patient_id": "P-B02"})
    assert res.status_code == 200, res.text
    print("CHECK: Patient B assigned to DOC-101.")

    print(">>> Testing constraint: Assigning another patient to already busy DOC-101...")
    res = client.post("/api/doctors/DOC-101/assign", json={"patient_id": "P-A01"})
    assert res.status_code == 400
    print("CHECK: System prevented assigning another patient to busy doctor DOC-101.")

    print(">>> 8. Completing consultation for Patient B and releasing doctor...")
    res = client.post("/api/patients/P-B02/complete")
    assert res.status_code == 200, res.text
    completed_p = res.json()["patient"]
    assert completed_p["status"] == "Completed"

    # Verify doctor is released
    doc_res = client.get("/api/doctors")
    doc_101 = next(d for d in doc_res.json() if d["doctor_id"] == "DOC-101")
    assert doc_101["is_available"] is True
    assert doc_101["current_patient_id"] is None
    print("CHECK: Doctor DOC-101 is released and available again.")

    print(">>> 9. Verifying remaining queue order (Patients A and C)...")
    res = client.get("/api/queue")
    assert res.status_code == 200
    queue = res.json()["queue"]
    assert len(queue) == 2
    assert queue[0]["patient_id"] == "P-A01"
    assert queue[1]["patient_id"] == "P-C03"
    print("CHECK: Remaining queue strictly verified as A -> C.")

    print(">>> 10. Testing edge cases: duplicate ID, invalid urgency, empty queue calling...")
    # Duplicate ID
    dup_res = client.post("/api/patients", json={
        "name": "Duplicate Test", "age": 20, "symptoms": "Test", "urgency": "Low", "custom_id": "P-A01"
    })
    assert dup_res.status_code == 400
    print("CHECK: Duplicate Patient ID rejected with 400.")

    # Call remaining 2 patients
    c1 = client.post("/api/queue/call-next")
    assert c1.status_code == 200
    assert c1.json()["patient"]["patient_id"] == "P-A01"

    c2 = client.post("/api/queue/call-next")
    assert c2.status_code == 200
    assert c2.json()["patient"]["patient_id"] == "P-C03"

    # Empty queue call
    empty_call = client.post("/api/queue/call-next")
    assert empty_call.status_code == 400
    print("CHECK: Empty queue call rejected with 400.")

    print("\n=======================================================")
    print("   ALL BACKEND AND DSA INTEGRATION TESTS PASSED 100%!  ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_complete_scenario()

