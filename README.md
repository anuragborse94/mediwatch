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

