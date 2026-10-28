import subprocess
import json
import os
import sys
from typing import List, Dict, Any, Optional

DSA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dsa_engine")
EXE_NAME = "medi_heap.exe" if sys.platform == "win32" else "medi_heap"
EXE_PATH = os.path.join(DSA_DIR, EXE_NAME)

def verify_or_compile_engine():
    """Ensure C++ binary exists; if not, compile it with g++."""
    if not os.path.exists(EXE_PATH):
        cpp_files = [os.path.join(DSA_DIR, "heap.cpp"), os.path.join(DSA_DIR, "main.cpp")]
        cmd = ["g++", "-O2", "-std=c++14"] + cpp_files + ["-o", EXE_PATH]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"C++ Compilation failed: {res.stderr}")
    return os.path.exists(EXE_PATH)

def run_dsa_heap(command: str, patients: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Executes the compiled C++ Priority Queue Min-Heap binary.
    Passes patient objects as JSON via stdin.
    Returns parsed JSON result containing ordered queue and next patient.
    """
    if not os.path.exists(EXE_PATH):
        verify_or_compile_engine()

    input_json = json.dumps(patients)
    try:
        proc = subprocess.run(
            [EXE_PATH, command],
            input=input_json,
            capture_output=True,
            text=True,
            timeout=5
        )
        if proc.returncode != 0:
            raise RuntimeError(f"C++ DSA Engine error (exit code {proc.returncode}): {proc.stderr}")

        output_str = proc.stdout.strip()
        if not output_str:
            return {"status": "success", "queue": [], "next_patient": None, "total_patients": 0}

        return json.loads(output_str)
    except subprocess.TimeoutExpired:
        raise RuntimeError("C++ Priority Queue binary execution timed out.")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse C++ engine JSON output: {proc.stdout} - Error: {str(e)}")

def get_prioritized_queue(patients: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Orders waiting patients using the C++ binary min-heap."""
    if not patients:
        return []
    result = run_dsa_heap("order", patients)
    return result.get("queue", [])

def peek_next_patient_dsa(patients: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Peeks highest priority patient using C++ binary min-heap in O(1)."""
    if not patients:
        return None
    result = run_dsa_heap("order", patients)
    return result.get("next_patient")

