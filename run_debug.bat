@echo off
title TriggerKey - Debug Mode
echo ============================================================
echo            TriggerKey - Launching in Debug Mode
echo ============================================================
set TRIGGERKEY_DEBUG=1
echo [INFO] Starting Flask and pywebview with Developer Tools enabled...
python main.py
echo ============================================================
pause
