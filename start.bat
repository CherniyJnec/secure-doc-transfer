@echo off
chcp 65001 >nul
title Secure Doc Transfer - Launcher

echo ========================================
echo   SECURE DOC TRANSFER - STARTUP SCRIPT
echo ========================================
echo.

:: --- ШАГ 1: Поиск и запуск IPFS Desktop ---
set "IPFS_PATH="

:: Проверяем стандартные пути установки
if exist "%LOCALAPPDATA%\Programs\ipfs-desktop\IPFS Desktop.exe" (
    set "IPFS_PATH=%LOCALAPPDATA%\Programs\ipfs-desktop\IPFS Desktop.exe"
) else if exist "%PROGRAMFILES%\IPFS Desktop\IPFS Desktop.exe" (
    set "IPFS_PATH=%PROGRAMFILES%\IPFS Desktop\IPFS Desktop.exe"
)

:: Если не нашли автоматически, спрашиваем пользователя
if "%IPFS_PATH%"=="" (
    echo [?] Не удалось найти IPFS Desktop автоматически.
    set /p "IPFS_PATH=Укажите полный путь к IPFS Desktop.exe (например C:\Program Files\IPFS Desktop\IPFS Desktop.exe): "
)

:: Проверяем, запущен ли IPFS уже
tasklist /FI "IMAGENAME eq IPFS Desktop.exe" 2>nul | find /I "IPFS Desktop.exe" >nul
if errorlevel 1 (
    if not "%IPFS_PATH%"=="" (
        echo [*] Запуск IPFS Desktop...
        start "" /min "%IPFS_PATH%"
        echo [*] Ожидание инициализации IPFS (10 сек)...
        timeout /t 10 /nobreak >nul
    ) else (
        echo [!] Путь к IPFS не указан. Пропускаем запуск IPFS.
        echo [!] Убедитесь, что IPFS Desktop запущен вручную перед отправкой файлов!
        timeout /t 5 /nobreak >nul
    )
) else (
    echo [OK] IPFS Desktop уже запущен
)

:: Настройка CORS для IPFS (идемпотентная операция)
echo [*] Проверка настроек CORS...
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"http://localhost:3000\",\"http://127.0.0.1:3000\",\"http://localhost:5173\"]" 2>nul
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\"PUT\",\"POST\",\"GET\"]" 2>nul

:: --- ШАГ 2: Hardhat Node ---
echo [*] Запуск локальной ноды Hardhat...
start "Hardhat Node" /min cmd /k "cd /d %~dp0 && npx hardhat node"

:: Ждём пока нода поднимется
echo [*] Ожидание готовности ноды (5 сек)...
timeout /t 5 /nobreak >nul

:: --- ШАГ 3: Деплой контракта ---
echo [*] Деплой смарт-контракта...
start "Deploy Contract" /min cmd /k "cd /d %~dp0 && npx hardhat run scripts/deploy.js --network localhost && echo. && echo === ДЕПЛОЙ ЗАВЕРШЁН === && pause"

:: --- ШАГ 4: Frontend ---
echo [*] Запуск фронтенда...
start "Frontend (React)" /min cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   ВСЕ КОМПОНЕНТЫ ЗАПУЩЕНЫ И СВЕРНУТЫ!
echo   Фронтенд: http://localhost:3000
echo ========================================
pause