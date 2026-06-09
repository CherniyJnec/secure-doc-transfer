@echo off
chcp 65001 >nul
title Secure Doc Transfer - Launcher

echo ========================================
echo   SECURE DOC TRANSFER - STARTUP SCRIPT
echo ========================================
echo.

setlocal enabledelayedexpansion
:: --- ШАГ 1: Поиск и запуск IPFS Desktop ---
set "IPFS_PATH="

:: --- Файл для хранения пути к IPFS ---
set "CONFIG_FILE=%~dp0.ipfs_path.txt"

:: --- Проверяем, сохранён ли путь ---
if exist "!CONFIG_FILE!" (
    set /p IPFS_PATH=<"!CONFIG_FILE!"
    echo [OK] Using saved IPFS path from .ipfs_path.txt
)

:: Проверяем стандартные пути установки
if exist "%LOCALAPPDATA%\Programs\ipfs-desktop\IPFS Desktop.exe" (
    set "IPFS_PATH=%LOCALAPPDATA%\Programs\ipfs-desktop\IPFS Desktop.exe"
) else if exist "%PROGRAMFILES%\IPFS Desktop\IPFS Desktop.exe" (
    set "IPFS_PATH=%PROGRAMFILES%\IPFS Desktop\IPFS Desktop.exe"
)

:: Если не нашли автоматически, спрашиваем пользователя
if "!IPFS_PATH!"=="" (
    echo [?] Не удалось найти IPFS Desktop автоматически.
    echo [*] Пожалуйста, введите полный путь к IPFS Desktop.exe:
    set /p "IPFS_PATH="
    :: Убираем кавычки, если пользователь их ввел
    set "IPFS_PATH=!IPFS_PATH:"=!"

    :: Сохраняем путь в файл
    if not "!IPFS_PATH!"=="" (
        echo !IPFS_PATH!>"!CONFIG_FILE!"
        echo [OK] Path saved to .ipfs_path.txt
    )
)

:: Проверка и запуск IPFS Desktop
tasklist /FI "IMAGENAME eq IPFS Desktop.exe" 2>nul | find /I "IPFS Desktop.exe" >nul
if errorlevel 1 (
    echo [!] Запуск IPFS Desktop...
    if exist "!IPFS_PATH!" (
        start "" /min "!IPFS_PATH!"
        timeout /t 8 /nobreak >nul
    ) else (
        echo [!] ОШИБКА: Файл по пути !IPFS_PATH! не найден.
        echo [!] Проверьте правильность ввода.
        pause
        exit /b
    )
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