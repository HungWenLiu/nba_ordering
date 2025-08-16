# 🚀 Vercel 部署快速指南

## 📦 您的專案已準備好部署到 Vercel！

### 🎯 快速部署步驟：

#### 1️⃣ 使用命令列部署（推薦）

```bash
# 全域安裝 Vercel CLI（一次性操作）
npm install -g vercel

# 登入 Vercel 帳號
vercel login

# 部署專案（在專案根目錄執行）
vercel

# 部署到正式環境
vercel --prod
```

#### 2️⃣ 本地開發測試

```bash
# 啟動本地 Vercel 開發伺服器
vercel dev

# 或指定端口
vercel dev --listen 8080
```

#### 3️⃣ 使用 GitHub 部署

1. 將專案推送到 GitHub
2. 前往 [vercel.com](https://vercel.com)
3. 連接 GitHub 並選擇此儲存庫
4. 自動部署完成！

### 📁 專案結構

```
✅ api/                    # Vercel API 函數
✅ public/                 # 靜態檔案
✅ vercel.json             # Vercel 設定
✅ package.json            # 依賴管理
```

### 🔧 vercel.json 設定說明

目前的設定檔使用簡潔的配置：

```json
{
    "functions": {
        "api/create-order.js": { "maxDuration": 30 },
        "api/ecpay-return.js": { "maxDuration": 30 },
        "api/ecpay-order-result.js": { "maxDuration": 30 }
    }
}
```

### 🌐 部署後的功能

-   **🏠 首頁**: `your-app.vercel.app`
-   **🏀 訂購頁面**: `your-app.vercel.app/nba.html`
-   **💳 綠界金流**: 完整串接
-   **📱 響應式設計**: 支援手機/桌面

### ⚡ 立即開始

1. **現在就部署**: 在專案根目錄執行 `vercel`
2. **本地測試**: 執行 `vercel dev`
3. **查看詳細指南**: 閱讀 `VERCEL_DEPLOY.md`

### 🔧 注意事項

-   首次部署需要 Vercel 帳號
-   測試環境不會實際扣款
-   正式上線前記得更新綠界設定

---

**🎉 恭喜！您的 NBA 球員卡訂購系統已準備好上線！**
