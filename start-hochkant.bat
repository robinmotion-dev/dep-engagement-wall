@echo off
rem Engagement-Wall HOCHKANT (9:16) im Kiosk-Modus starten (Chrome, sonst Edge).
rem Beenden: Alt+F4.
rem Optional URL-Parameter als Argument, z. B.:  start.bat "?n=10&dauer=15"
setlocal
set "SEITE=%~dp0hochkant.html"
set "URL=file:///%SEITE:\=/%%~1"
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER (
  echo Weder Chrome noch Edge gefunden.
  pause
  exit /b 1
)
start "" "%BROWSER%" --kiosk --no-first-run --disable-session-crashed-bubble --disable-infobars --autoplay-policy=no-user-gesture-required --user-data-dir="%TEMP%\engagement-wall-hochkant-profil" "%URL%"
endlocal
