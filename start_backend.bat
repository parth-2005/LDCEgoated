@echo off
REM EduGuard — Start Backend API server
REM Run from project root: d:\College\LDCE\

echo Starting EduGuard FastAPI backend on http://localhost:8000 ...
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
