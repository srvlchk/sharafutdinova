@echo off
rem Starts Node-RED. Works from any drive letter. Layout: X:\tools\... and X:\<project>\start-nodered.bat
for %%I in ("%~dp0..\tools") do set TOOLS=%%~fI
set "PROJECT=%~dp0"
set "PROJECT=%PROJECT:\=/%"
set PATH=%TOOLS%\node;%TOOLS%\sqlite;%PATH%
cd /d "%~dp0"
echo Project folder: %PROJECT%
echo Node-RED starting. Open http://127.0.0.1:1880 in the browser.
node "%TOOLS%\nodered\node_modules\node-red\red.js" --userDir "%TOOLS%\nodered-data"
pause
