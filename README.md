# MediWatch — Hospital Emergency Queue Management System
> **Third-Year Computer Engineering DSA Mini Project**  
> Priority Queue Implementation using C++ Binary Min-Heap, FastAPI, and React.

---

## 1. Project Overview

**MediWatch** is an emergency department triage and queue management system designed to demonstrate how a genuine **Priority Queue (Binary Min-Heap)** solves critical real-world scheduling problems in healthcare.

Patients arriving at an emergency department cannot be treated on a naive First-Come, First-Served (FIFO) basis. A patient arriving with acute chest pain (Critical) must immediately precede patients with moderate fractures or mild conditions, while patients with identical urgency must preserve their arrival order (FIFO tie-breaking).

### Core Highlights:
- **C++ DSA Engine**: Pure native C++ Binary Min-Heap (`heap.cpp`, `heap.h`) implementing `insertPatient()`, `getNextPatient()`, `peekNextPatient()`, `heapifyUp()`, and `heapifyDown()`.
- **FastAPI Backend**: Python 3 REST API managing database transactions, dynamic doctor management, doctor assignment logic, and IPC piping to the compiled C++ engine.
- **SQLite Database**: Persistent relational storage for patient records, audit timestamps, dynamic physician profiles, and availability across system restarts.
- **Dynamic Doctor Management**: Add, edit, and deactivate physicians dynamically with strict 1-to-1 consultation enforcement and audit trail protection.
- **React Frontend**: Hospital triage dashboard with live queue visualization, inline re-triage, physician modals, and a built-in viva cheat sheet.

---

## 2. System Architecture & Data Flow

```
[ React + Tailwind Dashboard ]
        │  (HTTP / JSON)
        ▼
[ Python FastAPI Backend ] ─── (CRUD / Persistence) ───► [ SQLite Database ]
        │
        │  (Standard I/O JSON Piping)
        ▼
[ C++ Priority Queue Engine (medi_heap.exe) ]
    ├── Binary Min-Heap Invariant
    ├── O(1) Peek Root
    ├── O(log N) Insert & Bubble-Up
    └── O(log N) Extract-Min & Bubble-Down
```

---

## 3. DSA Engine: Binary Min-Heap & Complexity Analysis

### Priority Rule & Comparison Logic
Each patient $P$ has:
1. `priority`: Integer urgency level (1 = Critical, 2 = Moderate, 3 = Low).
2. `arrival_seq`: Strictly increasing sequential integer generated upon hospital intake.

```cpp
bool hasHigherPriority(const Patient& a, const Patient& b) {
    // Primary Key: Urgency Level (1 is highest priority in min-heap)
    if (a.priority != b.priority) {
        return a.priority < b.priority;
    }
    // Secondary Key (Tie-breaker): Earlier arrival sequence number
    return a.arrival_seq < b.arrival_seq;
}
```

### Heap Operations & Theoretical Complexities

| Operation | C++ Method | Time Complexity | Auxiliary Space | Explanation |
| :--- | :--- | :---: | :---: | :--- |
| **Peek Next Patient** | `peekNextPatient()` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Inspects root element at vector index `[0]`. |
| **Insert Patient** | `insertPatient()` | $\mathcal{O}(\log N)$ | $\mathcal{O}(1)$ | Appends patient to leaf and bubbles up via `heapifyUp()`. |
| **Call Next Patient** | `getNextPatient()` | $\mathcal{O}(\log N)$ | $\mathcal{O}(1)$ | Removes root, moves last element to root, restores invariant via `heapifyDown()`. |
| **Priority Re-triage** | Re-insert & rebuild | $\mathcal{O}(N)$ or $\mathcal{O}(\log N)$ | $\mathcal{O}(N)$ | Updates urgency in SQLite and restores valid heap order. |
| **Display Whole Queue** | `getSortedQueue()` | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N)$ | Drains a clone of the heap sequentially to display ranked order. |

---

## 4. Quick Start Guide (Windows)

### Prerequisites
- **C++ Compiler**: MinGW `g++` (GCC)
- **Python**: 3.10+
- **Node.js**: v18+ (Node v24 and npm 11 verified)

### 1-Click Launch (Recommended)
Double-click or run:
```cmd
start_system.bat
```
This automatically compiles the C++ engine (if not already compiled), initializes SQLite, and launches the application at:
👉 **`http://127.0.0.1:8000`**

### Running Components Separately (Development Mode)
**1. Compile C++ DSA Engine:**
```cmd
cd backend\dsa_engine
g++ -O2 -std=c++14 heap.cpp main.cpp -o medi_heap.exe
.\medi_heap.exe --test
cd ..\..
```

**2. Start Backend API:**
```cmd
python run.py
```

**3. (Optional) Run Vite Frontend Dev Server:**
```cmd
cd frontend
npm install
npm run dev
```
Access Vite dev server at `http://127.0.0.1:5173`.

---

## 5. Automated Verification & End-to-End Test Suite

Run the automated verification suite:
```cmd
test_system.bat
```

### Required Verification Scenario Tested:
1. **Reset Database**: Cleared previous demo records.
2. **Register Patient A**: Urgency `Moderate` (Priority 2, Seq 1).
3. **Register Patient B**: Urgency `Critical` (Priority 1, Seq 2).
4. **Register Patient C**: Urgency `Moderate` (Priority 2, Seq 3).
5. **Priority Order Verification**: The C++ Min-Heap strictly ordered the queue as:
   - **Position 1**: Patient B (Critical, Seq 2)
   - **Position 2**: Patient A (Moderate, Seq 1)
   - **Position 3**: Patient C (Moderate, Seq 3)
6. **Call Next**: Invoked `getNextPatient()`. Correctly extracted **Patient B**.
7. **Consultation & Doctor Assignment**: Patient B assigned to Dr. Sarah Chen (`DOC-101`).
8. **Constraint Check**: Verified doctor cannot be assigned a second patient concurrently.
9. **Discharge**: Completed consultation, releasing the doctor back to available status.
10. **Remaining Queue**: Verified Patients A and C remained in correct FIFO order.
11. **Persistence Check**: Confirmed records persist across backend restarts in `mediwatch.db`.
12. **Add 5th Doctor (`DOC-105`)**: Successfully registered new physician into SQLite and verified immediate appearance in doctor roster.
13. **Edit Doctor Details**: Updated doctor name and specialty; verified changes persist across queries.
14. **Assign Consultation to New Doctor**: Verified status transitioned to `In Consultation` and `is_available = 0`.
15. **Prevent Concurrent Assignments**: Verified backend rejects second active consultation with 400 Bad Request.
16. **Discharge & Status Restoration**: Completed consultation and verified doctor returned to `Available`.
17. **Doctor Deactivation & Rule Enforcement**: Confirmed deactivated doctor is removed from assignment options and cannot receive patients.
18. **Audit Trail Protection**: Verified permanent deletion is blocked when historical patient consultations exist.

---

## 6. Viva Cheat Sheet for College Presentation

### Q1: Why use a Binary Heap instead of a standard Array or Linked List?
- **Unsorted Array/List**: Insertion is $\mathcal{O}(1)$, but finding the highest priority patient requires scanning the entire list ($\mathcal{O}(N)$).
- **Sorted Array/List**: Finding the highest priority patient is $\mathcal{O}(1)$, but insertion requires shifting elements ($\mathcal{O}(N)$).
- **Binary Min-Heap**: Balances both operations to $\mathcal{O}(\log N)$ insertion and $\mathcal{O}(\log N)$ extraction, with $\mathcal{O}(1)$ peek.

### Q2: How does tie-breaking work for patients of equal urgency?
In addition to priority, every patient is assigned a strictly increasing `arrival_seq` number. When two patients have equal urgency (`priority_a == priority_b`), the comparator evaluates `arrival_seq_a < arrival_seq_b`, ensuring strict FIFO ordering within the same urgency category.

### Q3: Why is C++ used for the queue instead of Python's `heapq`?
The project demonstrates core Computer Engineering principles by compiling native, strongly typed C++ data structures with direct memory layout, providing deterministic execution time and separation between application logic and low-level algorithmic operations.

