#include "heap.h"
#include <iomanip>

EmergencyPriorityQueue::EmergencyPriorityQueue() {}

bool EmergencyPriorityQueue::hasHigherPriority(const Patient& a, const Patient& b) const {
    // Primary criterion: Priority level (1=Critical is highest priority)
    if (a.priority != b.priority) {
        return a.priority < b.priority;
    }
    // Secondary criterion: Arrival sequence tie-breaking (FIFO for same urgency)
    return a.arrival_seq < b.arrival_seq;
}

/**
 * heapifyUp:
 * When a new element is appended at the bottom of the heap,
 * it bubbles up until the heap property (parent >= child priority) is satisfied.
 * Time Complexity: O(log N)
 */
void EmergencyPriorityQueue::heapifyUp(int index) {
    while (index > 0 && hasHigherPriority(heap[index], heap[parent(index)])) {
        std::swap(heap[index], heap[parent(index)]);
        index = parent(index);
    }
}

/**
 * heapifyDown:
 * When the root element is removed, the last element replaces the root,
 * and bubbles down until the heap property is satisfied.
 * Time Complexity: O(log N)
 */
void EmergencyPriorityQueue::heapifyDown(int index) {
    int highest = index;
    int left = leftChild(index);
    int right = rightChild(index);
    int n = static_cast<int>(heap.size());

    if (left < n && hasHigherPriority(heap[left], heap[highest])) {
        highest = left;
    }

    if (right < n && hasHigherPriority(heap[right], heap[highest])) {
        highest = right;
    }

    if (highest != index) {
        std::swap(heap[index], heap[highest]);
        heapifyDown(highest);
    }
}

/**
 * insertPatient:
 * Appends patient to the end of the heap and restores heap order using heapifyUp.
 * Time Complexity: O(log N)
 */
void EmergencyPriorityQueue::insertPatient(const Patient& p) {
    heap.push_back(p);
    heapifyUp(static_cast<int>(heap.size()) - 1);
}

/**
 * getNextPatient:
 * Removes and returns the highest priority patient from the root.
 * Replaces root with the last patient and restores order using heapifyDown.
 * Time Complexity: O(log N)
 */
Patient EmergencyPriorityQueue::getNextPatient() {
    if (heap.empty()) {
        throw std::runtime_error("Priority queue is empty: no waiting patients");
    }

    Patient topPatient = heap[0];
    heap[0] = heap.back();
    heap.pop_back();

    if (!heap.empty()) {
        heapifyDown(0);
    }

    return topPatient;
}

/**
 * peekNextPatient:
 * Inspects the highest priority patient without removing them.
 * Time Complexity: O(1)
 */
Patient EmergencyPriorityQueue::peekNextPatient() const {
    if (heap.empty()) {
        throw std::runtime_error("Priority queue is empty: no waiting patients");
    }
    return heap[0];
}

bool EmergencyPriorityQueue::isEmpty() const {
    return heap.empty();
}

size_t EmergencyPriorityQueue::size() const {
    return heap.size();
}

void EmergencyPriorityQueue::clear() {
    heap.clear();
}

/**
 * getSortedQueue:
 * Returns the entire waiting queue in strictly scheduled priority order
 * by creating a temporary copy of the heap and extracting elements one-by-one.
 * Original heap remains completely untouched.
 * Time Complexity: O(N log N)
 */
std::vector<Patient> EmergencyPriorityQueue::getSortedQueue() const {
    std::vector<Patient> sorted;
    EmergencyPriorityQueue copyQueue = *this;
    while (!copyQueue.isEmpty()) {
        sorted.push_back(copyQueue.getNextPatient());
    }
    return sorted;
}

void EmergencyPriorityQueue::displayQueue(std::ostream& os) const {
    std::vector<Patient> sorted = getSortedQueue();
    os << "--- MediWatch Emergency Queue (Sorted by Priority & Arrival) ---\n";
    os << std::left << std::setw(12) << "ID"
       << std::setw(18) << "Name"
       << std::setw(12) << "Urgency"
       << std::setw(10) << "Priority"
       << std::setw(12) << "ArrivalSeq" << "\n";
    os << "----------------------------------------------------------------\n";
    for (const auto& p : sorted) {
        os << std::left << std::setw(12) << p.patient_id
           << std::setw(18) << p.name
           << std::setw(12) << p.urgency
           << std::setw(10) << p.priority
           << std::setw(12) << p.arrival_seq << "\n";
    }
}

