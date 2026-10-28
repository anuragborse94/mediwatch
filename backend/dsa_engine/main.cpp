#include "heap.h"
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <cctype>
#include <cstdlib>

// Helper to escape string for JSON
std::string escapeJsonString(const std::string& input) {
    std::string output;
    for (char c : input) {
        if (c == '"') output += "\\\"";
        else if (c == '\\') output += "\\\\";
        else if (c == '\b') output += "\\b";
        else if (c == '\f') output += "\\f";
        else if (c == '\n') output += "\\n";
        else if (c == '\r') output += "\\r";
        else if (c == '\t') output += "\\t";
        else output += c;
    }
    return output;
}

// Convert Patient struct to JSON string
std::string patientToJson(const Patient& p) {
    std::ostringstream ss;
    ss << "{"
       << "\"patient_id\":\"" << escapeJsonString(p.patient_id) << "\","
       << "\"name\":\"" << escapeJsonString(p.name) << "\","
       << "\"priority\":" << p.priority << ","
       << "\"arrival_seq\":" << p.arrival_seq << ","
       << "\"urgency\":\"" << escapeJsonString(p.urgency) << "\","
       << "\"age\":" << p.age << ","
       << "\"symptoms\":\"" << escapeJsonString(p.symptoms) << "\","
       << "\"arrival_time\":\"" << escapeJsonString(p.arrival_time) << "\""
       << "}";
    return ss.str();
}

// Very simple, robust JSON extractor for our known Patient fields
std::string extractJsonField(const std::string& obj, const std::string& key) {
    std::string pattern = "\"" + key + "\"";
    size_t pos = obj.find(pattern);
    if (pos == std::string::npos) return "";
    pos += pattern.length();
    while (pos < obj.length() && (obj[pos] == ' ' || obj[pos] == ':' || obj[pos] == '\t' || obj[pos] == '\n' || obj[pos] == '\r')) {
        pos++;
    }
    if (pos >= obj.length()) return "";

    if (obj[pos] == '"') {
        pos++;
        std::string val = "";
        while (pos < obj.length()) {
            if (obj[pos] == '\\' && pos + 1 < obj.length()) {
                val += obj[pos + 1];
                pos += 2;
            } else if (obj[pos] == '"') {
                break;
            } else {
                val += obj[pos];
                pos++;
            }
        }
        return val;
    } else {
        std::string val = "";
        while (pos < obj.length() && (isdigit(obj[pos]) || obj[pos] == '-' || obj[pos] == '.')) {
            val += obj[pos];
            pos++;
        }
        return val;
    }
}

// Parse a list of patients from JSON text
std::vector<Patient> parsePatientsFromJson(const std::string& jsonStr) {
    std::vector<Patient> patients;
    size_t pos = 0;
    while ((pos = jsonStr.find('{', pos)) != std::string::npos) {
        // find matching closing brace
        size_t depth = 1;
        size_t endPos = pos + 1;
        while (endPos < jsonStr.length() && depth > 0) {
            if (jsonStr[endPos] == '{') depth++;
            else if (jsonStr[endPos] == '}') depth--;
            endPos++;
        }
        if (depth == 0) {
            std::string obj = jsonStr.substr(pos, endPos - pos);
            std::string pid = extractJsonField(obj, "patient_id");
            if (!pid.empty()) {
                Patient p;
                p.patient_id = pid;
                p.name = extractJsonField(obj, "name");
                std::string priStr = extractJsonField(obj, "priority");
                p.priority = priStr.empty() ? 2 : std::stoi(priStr);
                std::string seqStr = extractJsonField(obj, "arrival_seq");
                p.arrival_seq = seqStr.empty() ? 0 : std::stoi(seqStr);
                p.urgency = extractJsonField(obj, "urgency");
                if (p.urgency.empty()) {
                    if (p.priority == 1) p.urgency = "Critical";
                    else if (p.priority == 2) p.urgency = "Moderate";
                    else p.urgency = "Low";
                }
                std::string ageStr = extractJsonField(obj, "age");
                p.age = ageStr.empty() ? 0 : std::stoi(ageStr);
                p.symptoms = extractJsonField(obj, "symptoms");
                p.arrival_time = extractJsonField(obj, "arrival_time");
                patients.push_back(p);
            }
            pos = endPos;
        } else {
            break;
        }
    }
    return patients;
}

// Built-in automated self-test for grading and viva demonstration
int runSelfTest() {
    std::cout << "=========================================================\n";
    std::cout << "    MediWatch DSA Engine - Self Test & Verification     \n";
    std::cout << "=========================================================\n";

    EmergencyPriorityQueue pq;

    std::cout << "[Test 1] Initial empty queue verification...\n";
    if (!pq.isEmpty()) {
        std::cerr << "FAIL: Queue should be empty!\n";
        return 1;
    }
    std::cout << "PASSED: Initial queue is empty.\n\n";

    std::cout << "[Test 2] Inserting Required Verification Sequence:\n";
    std::cout << "  1. Patient A - Moderate (Priority 2, Seq 1)\n";
    Patient pa = {"P001", "Patient A", 2, 1, "Moderate", 30, "Fever", "10:00"};
    pq.insertPatient(pa);

    std::cout << "  2. Patient B - Critical (Priority 1, Seq 2)\n";
    Patient pb = {"P002", "Patient B", 1, 2, "Critical", 55, "Chest Pain", "10:05"};
    pq.insertPatient(pb);

    std::cout << "  3. Patient C - Moderate (Priority 2, Seq 3)\n";
    Patient pc = {"P003", "Patient C", 2, 3, "Moderate", 42, "Fracture", "10:10"};
    pq.insertPatient(pc);

    std::cout << "\nCurrent Queue Size: " << pq.size() << "\n";
    pq.displayQueue(std::cout);

    std::vector<Patient> ordered = pq.getSortedQueue();
    if (ordered.size() != 3 ||
        ordered[0].patient_id != "P002" ||
        ordered[1].patient_id != "P001" ||
        ordered[2].patient_id != "P003") {
        std::cerr << "FAIL: Ordering does not match B, A, C!\n";
        return 1;
    }
    std::cout << "PASSED: Priority ordering strictly verified as B -> A -> C.\n\n";

    std::cout << "[Test 3] Calling next patient (peek and pop)...\n";
    Patient peeked = pq.peekNextPatient();
    if (peeked.patient_id != "P002") {
        std::cerr << "FAIL: Peeked patient should be P002 (Patient B)!\n";
        return 1;
    }
    std::cout << "PASSED: peekNextPatient() returned Patient B (Critical) in O(1).\n";

    Patient called = pq.getNextPatient();
    if (called.patient_id != "P002") {
        std::cerr << "FAIL: getNextPatient() should have returned Patient B!\n";
        return 1;
    }
    std::cout << "PASSED: getNextPatient() extracted Patient B in O(log N).\n\n";

    std::cout << "[Test 4] Verifying remaining queue order (A, then C)...\n";
    ordered = pq.getSortedQueue();
    if (ordered.size() != 2 || ordered[0].patient_id != "P001" || ordered[1].patient_id != "P003") {
        std::cerr << "FAIL: Remaining queue should be A, C!\n";
        return 1;
    }
    std::cout << "PASSED: Remaining queue order preserved as A -> C.\n\n";

    std::cout << "=========================================================\n";
    std::cout << "     ALL DSA HEAP VERIFICATION TESTS PASSED SUCCESSFULLY! \n";
    std::cout << "=========================================================\n";
    return 0;
}

int main(int argc, char* argv[]) {
    // Check for --test mode
    if (argc > 1 && std::string(argv[1]) == "--test") {
        return runSelfTest();
    }

    std::string command = "order";
    if (argc > 1) {
        command = argv[1];
    }

    // Read full JSON from standard input
    std::string fullInput;
    std::string line;
    while (std::getline(std::cin, line)) {
        fullInput += line + "\n";
    }

    std::vector<Patient> patients = parsePatientsFromJson(fullInput);

    EmergencyPriorityQueue pq;
    for (const auto& p : patients) {
        pq.insertPatient(p);
    }

    // Construct response JSON
    std::ostringstream response;
    response << "{";
    response << "\"status\":\"success\",";
    response << "\"command\":\"" << escapeJsonString(command) << "\",";
    response << "\"total_patients\":" << pq.size() << ",";

    if (pq.isEmpty()) {
        response << "\"has_next\":false,";
        response << "\"next_patient\":null,";
        response << "\"queue\":[]";
    } else {
        response << "\"has_next\":true,";
        Patient nextP = pq.peekNextPatient();
        response << "\"next_patient\":" << patientToJson(nextP) << ",";

        if (command == "pop") {
            Patient popped = pq.getNextPatient();
            response << "\"popped_patient\":" << patientToJson(popped) << ",";
        }

        std::vector<Patient> sortedList = pq.getSortedQueue();
        response << "\"queue\":[";
        for (size_t i = 0; i < sortedList.size(); ++i) {
            response << patientToJson(sortedList[i]);
            if (i + 1 < sortedList.size()) response << ",";
        }
        response << "]";
    }

    response << "}";
    std::cout << response.str() << std::endl;
    return 0;
}

