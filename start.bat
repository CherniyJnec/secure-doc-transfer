@echo off
chcp 65001 >nul
title Secure Doc Transfer - Launcher

echo ========================================
echo   SECURE DOC TRANSFER - STARTUP SCRIPT
echo ========================================
echo.

:: Проверка и запуск IPFS Desktop (свернутым)
tasklist /FI "IMAGENAME eq IPFS Desktop.exe" 2>nul | find /I "IPFS Desktop.exe" >nul
if errorlevel 1 (
    echo [!] Запуск IPFS Desktop...
    ::start "" /min "%LOCALAPPDATA%\Programs\ipfs-desktop\IPFS Desktop.exe"
    start "" /min "C:\Disk_E\IPFS Desktop\IPFS Desktop.exe"
    timeout /t 8 /nobreak >nul
) else (
    echo [OK] IPFS Desktop уже запущен
)

:: Настройка CORS для IPFS (идемпотентная операция)
echo [*] Проверка настроек CORS...
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"http://localhost:3000\",\"http://127.0.0.1:3000\",\"http://localhost:5173\"]" 2>nul
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\"PUT\",\"POST\",\"GET\"]" 2>nul

:: Окно 1: Hardhat Node (свернуто)
echo [*] Запуск локальной ноды Hardhat...
start "Hardhat Node" /min cmd /k "cd /d %~dp0 && npx hardhat node"

:: Ждём пока нода поднимется
echo [*] Ожидание готовности ноды (5 сек)...
timeout /t 5 /nobreak >nul

:: Окно 2: Деплой контракта (свернуто)
echo [*] Деплой смарт-контракта...
start "Deploy Contract" /min cmd /k "cd /d %~dp0 && npx hardhat run scripts/deploy.js --network localhost && echo. && echo === ДЕПЛОЙ ЗАВЕРШЁН === && pause"

:: Окно 3: Frontend (свернуто)
echo [*] Запуск фронтенда...
start "Frontend (React)" /min cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   ВСЕ КОМПОНЕНТЫ ЗАПУЩЕНЫ И СВЕРНУТЫ!
echo   Фронтенд: http://localhost:3000
echo ========================================
pause