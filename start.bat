@echo off
echo Starting QIK Delivery Admin Portal...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed. Starting servers...
echo.

REM Start backend server
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm install && node index.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm install && npm start"

echo.
echo Both servers are starting...
echo Backend will run on http://localhost:3001
echo Frontend will run on http://localhost:3000
echo.
echo Press any key to exit this window (servers will continue running)
pause >nul 