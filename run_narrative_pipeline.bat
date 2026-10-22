@echo off
echo ==================================================================
echo   AutoTube AI - 9-Step Continuous Narrative Video Pipeline
echo   1. Narrative Generation (from 16 Character Pool)
echo   2. Scene Breakdown ^& Timing (8-10s scenes, 30-45 total)
echo   3. Central Scene Registry (DB + CSV/JSON Sheets)
echo   4. AI Video Generation ^& Asset Retrieval (Image + Prompt)
echo   5. Sequential Batch Processing
echo   6. Seamless 5-6m Master Video Stitching ^& Thumbnail
echo   7. Monday Long-Form Publishing Schedule
echo   8. Automated Shorts Repurposing (Twice Daily: 10 AM ^& 5 PM)
echo   9. Complete Zero-Touch Autonomous Execution
echo ==================================================================
npm run pipeline:narrative %*
pause
