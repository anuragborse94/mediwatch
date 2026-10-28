@echo off
title MediWatch - Automated Verification Test Suite
echo ==============================================================
echo   MediWatch — Automated Verification Test Suite
echo ==============================================================
echo.
echo [1/3] Running C++ Binary Min-Heap Native Verification...
.\backend\dsa_engine\medi_heap.exe --test
if %ERRORLEVEL% NEQ 0 (
    echo FAIL: C++ Native tests failed!
    exit /b 1
)

echo.
echo [2/3] Running Full End-to-End FastAPI, SQLite and DSA Queue Test...
python backend\test_api.py
if %ERRORLEVEL% NEQ 0 (
    echo FAIL: Backend and Integration tests failed!
    exit /b 1
)

echo.
echo [3/3] Running Dynamic Doctor Management and Acceptance Test Suite...
python backend\test_doctors.py
if %ERRORLEVEL% NEQ 0 (
    echo FAIL: Doctor management tests failed!
    exit /b 1
)

echo.
echo ==============================================================
echo   ALL SUITES EXECUTED SUCCESSFULLY AND PASSED VERIFICATION!
echo ==============================================================
if "%1"=="" pause
