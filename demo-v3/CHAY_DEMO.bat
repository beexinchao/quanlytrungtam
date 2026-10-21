@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Chua co Node.js. Mo truc tiep tep index.html bang Chrome hoac Edge cung chay duoc.
  start "" "%~dp0index.html"
  pause
  exit /b
)
start "" http://localhost:8688
node server.js 8688
