@echo off
setlocal
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
echo  [AUTO-RESUME ACTIVE]
echo  You can close and reopen this window anytime safely.
echo  The pipeline will automatically resume right where you stopped.
echo.
echo  Usage Tips:
echo    - run_narrative_pipeline.bat        (Resumes where you stopped)
echo    - run_narrative_pipeline.bat --new  (Starts a fresh new story)
echo ==================================================================
echo.
call npm run pipeline:narrative -- %*
if errorlevel 1 (
  echo.
  echo ==================================================================
  echo  [NOTICE] Pipeline stopped or interrupted.
  echo  All finished scenes are safely saved to checkpoint.
  echo  Run 'run_narrative_pipeline.bat' anytime to resume where you stopped.
  echo ==================================================================
) else (
  echo.
  echo ==================================================================
  echo  [SUCCESS] 9-Step Continuous Narrative Pipeline completed successfully.
  echo ==================================================================
)
echo.
echo Press any key to exit this window...
pause >nul

