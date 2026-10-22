@echo off
echo ========================================================
echo   Launching Google Chrome for Gemini Automation
echo   Remote debugging port: 9222
echo   Profile directory: %USERPROFILE%\.gemini-browser-profile
echo ========================================================
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%USERPROFILE%\.gemini-browser-profile" --start-maximized "https://gemini.google.com/app"
echo Chrome launched. Please ensure you are logged into Google Gemini.
pause
