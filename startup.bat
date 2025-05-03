@echo off
:check_config
IF NOT EXIST config.json (
    echo [INFO] config.json not found. Running setup...
    node setup.js
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] setup.js exited with error. Exiting...
        pause
        exit /b
    )
)

:run_bot
echo [INFO] Starting your bot...
node index.js
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] Bot crashed with exit code %ERRORLEVEL%. Restarting...
    timeout /t 3 > nul
    goto run_bot
)
