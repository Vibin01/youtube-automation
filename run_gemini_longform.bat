@echo off
echo ========================================================
echo   AutoTube AI - 5 to 6 Minute Comedy Video Pipeline
echo   1. Generate 5-6 min Comedy Screenplay
echo   2. Pick Characters Relevant to the Script
echo   3. Generate Video Clips via Gemini & Download
echo   4. Merge with Audio & Sound Effects
echo   5. Publish to YouTube (PUBLIC)
echo ========================================================
npm run agent:longform %*
pause
