@echo off
echo Starting Prompt Manager Local Server...
echo This is required for Local AI features (CORS Security).
echo.
echo Opening browser...
start http://localhost:8000
echo.
echo Server running at http://localhost:8000
echo Close this window to stop the server.
python -m http.server 8000 --bind 127.0.0.1
