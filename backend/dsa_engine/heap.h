#ifndef HEAP_H
#define HEAP_H

#include <string>
#include <vector>
#include <stdexcept>
#include <iostream>

/**
 * Patient Node representing a patient in the hospital emergency queue.
 * Priority rules:
 *   1 = Critical (Highest urgency)
 *   2 = Moderate (Medium urgency)
 *   3 = Low      (Standard urgency)
 * Tie-breaker:
 *   Arrival sequence number (earlier arrival -> smaller arrival_seq -> higher priority)
 */
struct Patient {
    std::string patient_id;
    std::string name;
    int priority;           // 1: Critical, 2: Moderate, 3: Low
    int arrival_seq;        // Strictly increasing arrival sequence number
    std::string urgency;    // "Critical", "Moderate", "Low"
    int age;
    std::string symptoms;
    std::string arrival_time;
};

/**
 * EmergencyPriorityQueue:
 * A custom Binary Min-Heap implementation tailored for emergency triage.
 *
 * Complexities:
 * - insertPatient():   O(log N)
 * - getNextPatient():  O(log N)
 * - peekNextPatient(): O(1)
 * - heapifyUp():       O(log N)
 * - heapifyDown():     O(log N)
 * - displayQueue():    O(N log N) when extracting in full sorted priority order
 */
class EmergencyPriorityQueue {
private:
    std::vector<Patient> heap;

    // Helper functions for 0-indexed binary heap
    int parent(int i) const { return (i - 1) / 2; }
    int leftChild(int i) const { return 2 * i + 1; }
    int rightChild(int i) const { return 2 * i + 2; }

    /**
     * Determines if patient 'a' has higher priority than patient 'b'.
     * Rule 1: Lower numeric priority value (1 < 2 < 3).
     * Rule 2: If priorities match, lower arrival_seq came first (FIFO).
     */
    bool hasHigherPriority(const Patient& a, const Patient& b) const;

public:
    EmergencyPriorityQueue();

    // Restores heap invariant moving upward from index
    void heapifyUp(int index);

    // Restores heap invariant moving downward from index
    void heapifyDown(int index);

    // Inserts a new patient into the priority queue (O(log N))
    void insertPatient(const Patient& p);

    // Extracts and returns the highest-priority patient (O(log N))
    Patient getNextPatient();

    // Returns the highest-priority patient without removing (O(1))
    Patient peekNextPatient() const;

    // Returns whether the queue is empty
    bool isEmpty() const;

    // Returns total patients currently in queue
    size_t size() const;

    // Clears the queue
    void clear();

    // Drains the queue in priority order without mutating original by using a copy
    std::vector<Patient> getSortedQueue() const;

    // Displays the queue to a stream (e.g. stdout)
    void displayQueue(std::ostream& os) const;
};

#endif // HEAP_H

