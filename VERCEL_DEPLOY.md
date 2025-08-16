# Vercel 部署指南

## 快速部署到 Vercel

### 方法一：使用 Vercel CLI (推薦)

1. **安裝 Vercel CLI**

```bash
npm install -g vercel
```

2. **登入 Vercel**

```bash
vercel login
```

3. **部署專案**

```bash
# 在專案根目錄執行
vercel

# 或者直接部署到生產環境
vercel --prod
```

### 方法二：使用 GitHub 整合

1. **將專案推送到 GitHub**

```bash
git add .
git commit -m "準備部署到 Vercel"
git push origin main
```

2. **連接 Vercel**
    - 前往 [vercel.com](https://vercel.com)
    - 使用 GitHub 帳號登入
    - 點擊 "Import Project"
    - 選擇您的 GitHub 儲存庫
    - 按照指示完成部署

### 方法三：拖拽部署

1. **打包專案**

```bash
# 壓縮整個專案資料夾
```

2. **拖拽到 Vercel**
    - 前往 [vercel.com](https://vercel.com)
    - 直接將壓縮檔拖拽到 Vercel 網站上

## 專案結構說明

```
nba-player-ordering/
├── api/                    # Vercel Serverless Functions
│   ├── create-order.js     # 建立訂單 API
│   ├── ecpay-return.js     # 綠界回傳處理
│   └── ecpay-order-result.js # 訂單查詢結果
├── public/                 # 靜態檔案
│   ├── index.html          # 首頁
│   ├── nba.html           # 主要訂購頁面
│   ├── payment-result.html # 付款結果頁面
│   └── assets/            # 圖片和資源
├── vercel.json            # Vercel 設定檔
└── package.json           # 依賴管理
```

## 環境變數設定

部署後，您可能需要在 Vercel Dashboard 中設定環境變數：

1. 前往 Vercel Dashboard
2. 選擇您的專案
3. 進入 "Settings" → "Environment Variables"
4. 新增以下變數：

```env
# 綠界正式環境設定（可選）
ECPAY_MERCHANT_ID=your_merchant_id
ECPAY_HASH_KEY=your_hash_key
ECPAY_HASH_IV=your_hash_iv
ECPAY_BASE_URL=https://payment.ecpay.com.tw
```

## 自訂網域名稱

1. 在 Vercel Dashboard 中選擇專案
2. 進入 "Settings" → "Domains"
3. 新增您的自訂網域
4. 按照指示設定 DNS

## 本地開發環境

```bash
# 安裝依賴
npm install

# 本地開發（使用 Vercel Dev）
npm run vercel-dev

# 或使用原始的 Express 伺服器
npm run dev
```

## 部署後的 URL 結構

-   **首頁**: `https://your-app.vercel.app/`
-   **訂購頁面**: `https://your-app.vercel.app/nba.html`
-   **API 端點**: `https://your-app.vercel.app/api/create-order`
-   **付款結果**: `https://your-app.vercel.app/payment-result.html`

## 常見問題解決

### 1. API 路由不工作

-   確認檔案放在 `api/` 資料夾中
-   檢查 `vercel.json` 設定是否正確
-   確認函數使用 `export default function handler(req, res)`

### 2. 靜態檔案載入失敗

-   確認檔案放在 `public/` 資料夾中
-   檢查檔案路徑是否正確
-   驗證 `vercel.json` 的路由設定

### 3. 綠界回傳 URL 錯誤

-   部署後更新 `api/create-order.js` 中的網域名稱
-   或使用環境變數動態設定

### 4. 部署失敗

-   檢查 `package.json` 中的依賴版本
-   確認 Node.js 版本兼容性
-   查看 Vercel 部署日誌

## 部署檢查清單

-   [x] 所有檔案都已提交到 Git
-   [x] `vercel.json` 設定正確
-   [x] API 函數測試正常
-   [x] 靜態檔案路徑正確
-   [x] 綠界回傳 URL 已更新

## 技術支援

-   Vercel 文件: https://vercel.com/docs
-   GitHub 儲存庫: https://github.com/your-username/nba-player-ordering
-   問題回報: 在 GitHub Issues 中提出
