@echo off
echo 🚀 NBA球員卡訂購系統 - Vercel部署準備
echo =====================================

echo.
echo 1. 檢查專案結構...
if exist "api\" (
    echo ✅ API 資料夾存在
) else (
    echo ❌ API 資料夾不存在
    exit /b 1
)

if exist "public\" (
    echo ✅ Public 資料夾存在
) else (
    echo ❌ Public 資料夾不存在
    exit /b 1
)

if exist "vercel.json" (
    echo ✅ vercel.json 設定檔存在
) else (
    echo ❌ vercel.json 設定檔不存在
    exit /b 1
)

echo.
echo 2. 安裝 Vercel CLI（如果尚未安裝）...
npm list -g vercel > nul 2>&1
if %errorlevel% neq 0 (
    echo 正在安裝 Vercel CLI...
    npm install -g vercel
) else (
    echo ✅ Vercel CLI 已安裝
)

echo.
echo 3. 部署選項：
echo [1] 本地預覽（vercel dev）
echo [2] 部署到 Vercel（測試環境）
echo [3] 部署到 Vercel（正式環境）
echo [4] 僅顯示部署指令

set /p choice="請選擇選項 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🖥️ 啟動本地 Vercel 開發伺服器...
    echo 網址: http://localhost:3000
    vercel dev
) else if "%choice%"=="2" (
    echo.
    echo 🚀 部署到 Vercel 測試環境...
    vercel
) else if "%choice%"=="3" (
    echo.
    echo 🌟 部署到 Vercel 正式環境...
    vercel --prod
) else if "%choice%"=="4" (
    echo.
    echo 📋 手動部署指令：
    echo.
    echo 本地開發: vercel dev
    echo 測試部署: vercel
    echo 正式部署: vercel --prod
    echo.
    echo 💡 提示：首次部署時會要求登入 Vercel 帳號
) else (
    echo ❌ 無效選項
    exit /b 1
)

echo.
echo ✅ 完成！
pause
