@echo off
setlocal
cd /d "%~dp0"
title NetPath - keep this window open
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 24 or newer and try again.
  pause
  exit /b 1
)
echo Starting NetPath at http://127.0.0.1:4173/
echo Keep this window open while studying. Press Ctrl+C to stop the server.
echo Use the address above in your browser. VS Code Live Server is not required.
echo.
set PORT=4173
set NETPATH_DATA=
node server.mjs
echo.
echo NetPath stopped. If port 4173 is already in use, open the browser address above.
echo Otherwise, the error above explains why startup failed.
pause
