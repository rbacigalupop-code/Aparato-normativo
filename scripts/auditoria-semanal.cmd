@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  Auditoría semanal de Talora — envoltorio para el Programador de tareas
REM ═══════════════════════════════════════════════════════════════════════════
REM  Corre `npm run auditoria` y deja un informe fechado en logs\.
REM  Registrar con:  scripts\registrar-auditoria.ps1   (una sola vez)
REM ═══════════════════════════════════════════════════════════════════════════

cd /d "%~dp0.."
if not exist "logs" mkdir "logs"

for /f "tokens=1-3 delims=/-. " %%a in ("%date%") do set FECHA=%%c-%%b-%%a
set INFORME=logs\auditoria-%FECHA%.log

echo ============================================== >> "%INFORME%"
echo  AUDITORIA %date% %time% >> "%INFORME%"
echo ============================================== >> "%INFORME%"
call npm run auditoria >> "%INFORME%" 2>&1
set CODIGO=%ERRORLEVEL%

echo. >> "%INFORME%"
if %CODIGO% NEQ 0 (
  echo RESULTADO: HAY FALLAS CRITICAS - revisar arriba >> "%INFORME%"
) else (
  echo RESULTADO: sin fallas criticas >> "%INFORME%"
)

REM Deja siempre una copia como "ultimo informe" para abrirlo rapido
copy /y "%INFORME%" "logs\auditoria-ultima.log" >nul
exit /b %CODIGO%
