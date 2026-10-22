@echo off
echo ========================================================
echo   AutoTube AI - Gemini Automated Video Pipeline
echo   Image -> Gemini Web -> Store -> Merge -> Publish
echo ========================================================
npm run agent:gemini %*
pause
