import os
import sys
import subprocess
import webbrowser

def main():
    print("=" * 65)
    print("  MediWatch — Hospital Emergency Queue Management System")
    print("  C++ Binary Min-Heap Priority Queue & FastAPI + React")
    print("=" * 65)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    sys.path.insert(0, backend_dir)

    # 1. Compile C++ DSA Engine if needed
    from dsa_wrapper import verify_or_compile_engine, EXE_PATH
    print(f"\n[Step 1] Checking C++ DSA Min-Heap Binary at: {EXE_PATH}")
    if verify_or_compile_engine():
        print("  -> C++ Min-Heap Binary is compiled and READY.")
    else:
        print("  -> ERROR: C++ Compilation failed.")
        sys.exit(1)

    # 2. Initialize Database
    from database import init_db
    print("\n[Step 2] Initializing SQLite database...")
    init_db()
    print("  -> SQLite database initialized with ER doctors roster.")

    # 3. Check frontend dist build
    dist_dir = os.path.join(base_dir, "frontend", "dist")
    if os.path.exists(dist_dir):
        print("\n[Step 3] Production frontend bundle detected.")
        print("  -> Full UI will be served directly at: http://127.0.0.1:8000")
    else:
        print("\n[Step 3] Notice: frontend/dist not found. Running dev mode.")

    # 4. Start Uvicorn
    import uvicorn
    print("\n[Step 4] Starting MediWatch System on http://127.0.0.1:8000 ...")
    print("  Press Ctrl+C to terminate the server.\n")

    uvicorn.run("main:app", app_dir=backend_dir, host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()

