@echo off
chcp 65001 >nul
rem Swarm Rebuild: открывает страницу расширений Chrome и папку расширения.
rem Дальше: включить "Режим разработчика" -> "Загрузить распакованное" -> выбрать открытую папку swarm-rebuild.
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" chrome://extensions
start "" explorer "%~dp0swarm-rebuild"
echo После установки: на любой странице нажмите Alt+Shift+S или иконку расширения.
pause
