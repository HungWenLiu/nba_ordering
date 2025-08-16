# NBA球員卡訂購系統 - 綠界金流串接

## 功能特色
- 串接綠界ECPay金流API
- 支援多種付款方式（信用卡、ATM、超商代碼）
- 訂單管理和付款狀態追蹤
- 響應式設計，支援手機和桌面裝置

## 安裝步驟

1. 安裝依賴套件：
```bash
npm install
```

2. 啟動伺服器：
```bash
npm start
```

3. 開啟瀏覽器，前往 `http://localhost:3000`

## 綠界金流設定

### 測試環境設定（已預設）
- 商店代號：2000132
- HashKey：5294y06JbISpM5x9
- HashIV：v77hoKGq4kWxNNIS
- 測試網址：https://payment-stage.ecpay.com.tw

### 正式環境設定
請至綠界官網申請正式商店帳號，並更新 `server.js` 中的以下設定：

```javascript
const ECPAY_CONFIG = {
    MerchantID: '您的商店代號',
    HashKey: '您的HashKey',
    HashIV: '您的HashIV',
    BaseURL: 'https://payment.ecpay.com.tw', // 正式環境
    // ... 其他設定
};
```

## 支援的付款方式

1. **信用卡付款**
   - 支援 VISA、MasterCard、JCB
   - 可設定分期付款

2. **ATM轉帳**
   - 產生虛擬帳號
   - 3天內完成付款

3. **超商代碼**
   - 7-11、全家、萊爾富、OK超商
   - 貨到付款服務

4. **LINE Pay**
   - 整合行動支付
   - 快速結帳

## API 端點

- `GET /` - 首頁
- `POST /create-order` - 建立訂單並跳轉綠界
- `POST /ecpay/return` - 綠界付款結果通知
- `GET /ecpay/client_back` - 付款完成返回頁面
- `POST /ecpay/order_result` - 訂單查詢結果

## 訂單流程

1. 使用者選擇商品並填寫資料
2. 提交表單至後端建立訂單
3. 自動跳轉至綠界付款頁面
4. 完成付款後返回結果頁面
5. 綠界回傳付款結果到伺服器

## 安全性考量

- 使用 SHA256 加密檢查碼
- 驗證綠界回傳的付款結果
- 避免重複訂單號碼

## 開發模式

```bash
npm run dev
```

使用 nodemon 自動重啟伺服器，適合開發階段使用。

## 注意事項

1. 測試環境的金流不會實際扣款
2. 正式環境需要通過綠界的商店審核
3. 請確保伺服器的回傳網址可以被綠界存取
4. 建議使用 HTTPS 協定以確保資料安全

## 問題排除

### 常見問題

1. **檢查碼驗證失敗**
   - 確認 HashKey 和 HashIV 設定正確
   - 檢查參數編碼是否正確

2. **跳轉失敗**
   - 確認訂單編號格式正確
   - 檢查必填欄位是否完整

3. **回傳通知失敗**
   - 確認 ReturnURL 可以被外部存取
   - 檢查防火牆設定

## 技術支援

如有問題請聯絡：
- 綠界技術支援：https://www.ecpay.com.tw
- 開發文件：https://developers.ecpay.com.tw
