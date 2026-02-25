@echo off
setlocal

set "ROOT=%~dp0"
set "BE_DIR=%ROOT%project-be"
set "FE_DIR=%ROOT%project-fe"

if not exist "%BE_DIR%\artisan" (
  echo [ERROR] Cannot find Laravel backend at: %BE_DIR%
  pause
  exit /b 1
)

if not exist "%FE_DIR%\package.json" (
  echo [ERROR] Cannot find frontend at: %FE_DIR%
  pause
  exit /b 1
)

echo [1/3] Starting backend on http://localhost:8000 ...
start "projectE-backend" /min cmd /k "cd /d ""%BE_DIR%"" && php -S localhost:8000 -t public"

echo [2/3] Checking frontend production build ...
if not exist "%FE_DIR%\dist\index.html" (
  echo Frontend build not found. Building once...
  pushd "%FE_DIR%"
  call npm run build
  if errorlevel 1 (
    popd
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
  )
  popd
)

echo [3/3] Starting frontend preview on http://127.0.0.1:4173 ...
start "projectE-frontend" /min cmd /k "cd /d ""%FE_DIR%"" && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort"

echo.
echo Done. Open:
echo - Frontend: http://127.0.0.1:4173
echo - Backend API: http://localhost:8000/api/sentences
echo.
echo Tip: To stop, close the two opened command windows:
echo - projectE-backend
echo - projectE-frontend
pause
