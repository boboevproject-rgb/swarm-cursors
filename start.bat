@echo off
chcp 65001 >nul
rem Swarm Rebuild: отдельный профиль Chrome с уже загруженным расширением + демо-страница.
cd /d "%~dp0"
start "swarm-demo-server" /min python -m http.server 8860 --bind 127.0.0.1
node scripts\launch-chrome.mjs http://127.0.0.1:8860/demo/index.html
