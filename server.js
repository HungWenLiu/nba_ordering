const express = require('express');
const crypto = require('crypto');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// 綠界測試環境設定
const ECPAY_CONFIG = {
    MerchantID: '2000132', // 測試商店代號
    HashKey: '5294y06JbISpM5x9', // 測試金鑰
    HashIV: 'v77hoKGq4kWxNNIS', // 測試向量
    BaseURL: 'https://payment-stage.ecpay.com.tw', // 測試環境網址
    ReturnURL: 'http://localhost:3000/ecpay/return',
    ClientBackURL: 'http://localhost:3000/ecpay/client_back',
    OrderResultURL: 'http://localhost:3000/ecpay/order_result'
};

// 中間件設定
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('src'));

// 生成檢查碼
function generateCheckMacValue(params, hashKey, hashIV) {
    // 將參數依照 key 排序
    const sortedKeys = Object.keys(params).sort();
    let str = `HashKey=${hashKey}`;
    
    sortedKeys.forEach(key => {
        str += `&${key}=${params[key]}`;
    });
    
    str += `&HashIV=${hashIV}`;
    
    // URL encode
    str = encodeURIComponent(str).toLowerCase();
    
    // 特殊字符處理
    str = str.replace(/%20/g, '+');
    str = str.replace(/%21/g, '!');
    str = str.replace(/%2a/g, '*');
    str = str.replace(/%28/g, '(');
    str = str.replace(/%29/g, ')');
    
    // SHA256 加密後轉大寫
    return crypto.createHash('sha256').update(str).digest('hex').toUpperCase();
}

// 首頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'nba.html'));
});

// 建立訂單並跳轉到綠界
app.post('/create-order', (req, res) => {
    const {
        productName,
        productPrice,
        warranty,
        customerName,
        customerEmail,
        city,
        district,
        address,
        paymentMethod
    } = req.body;

    // 計算總金額
    let totalAmount = parseInt(productPrice);
    if (warranty === 'true') {
        totalAmount += 199;
    }
    if (paymentMethod === 'cod') {
        totalAmount += 30;
    } else if (paymentMethod === 'atm') {
        totalAmount += 20;
    }

    // 生成訂單編號（時間戳 + 隨機數）
    const merchantTradeNo = 'NBA' + Date.now() + Math.floor(Math.random() * 1000);
    
    // 綠界金流參數
    const ecpayParams = {
        MerchantID: ECPAY_CONFIG.MerchantID,
        MerchantTradeNo: merchantTradeNo,
        MerchantTradeDate: new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/-/g, '/'),
        PaymentType: 'aio',
        TotalAmount: totalAmount,
        TradeDesc: 'NBA球員卡購買',
        ItemName: productName,
        ReturnURL: ECPAY_CONFIG.ReturnURL,
        ClientBackURL: ECPAY_CONFIG.ClientBackURL,
        OrderResultURL: ECPAY_CONFIG.OrderResultURL,
        NeedExtraPaidInfo: 'N',
        ChoosePayment: getEcpayPaymentMethod(paymentMethod),
        EncryptType: 1
    };

    // 根據付款方式設定額外參數
    if (paymentMethod === 'creditcard') {
        ecpayParams.CreditInstallment = '3,6,12';
    } else if (paymentMethod === 'atm') {
        ecpayParams.ExpireDate = 3; // ATM 繳費期限（天）
    }

    // 生成檢查碼
    ecpayParams.CheckMacValue = generateCheckMacValue(
        ecpayParams, 
        ECPAY_CONFIG.HashKey, 
        ECPAY_CONFIG.HashIV
    );

    // 生成表單HTML
    let formHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>跳轉到綠界金流</title>
    </head>
    <body onload="document.forms[0].submit();">
        <form action="${ECPAY_CONFIG.BaseURL}/Cashier/AioCheckOut/V5" method="post">
    `;

    Object.keys(ecpayParams).forEach(key => {
        formHTML += `<input type="hidden" name="${key}" value="${ecpayParams[key]}">`;
    });

    formHTML += `
        </form>
        <div style="text-align: center; padding: 50px;">
            <h3>正在跳轉到綠界金流...</h3>
            <p>如果頁面沒有自動跳轉，請點擊下方按鈕</p>
            <button onclick="document.forms[0].submit();">前往付款</button>
        </div>
    </body>
    </html>
    `;

    res.send(formHTML);
});

// 綠界付款結果回傳
app.post('/ecpay/return', (req, res) => {
    console.log('綠界回傳結果:', req.body);
    
    // 驗證檢查碼
    const receivedCheckMacValue = req.body.CheckMacValue;
    delete req.body.CheckMacValue;
    
    const calculatedCheckMacValue = generateCheckMacValue(
        req.body,
        ECPAY_CONFIG.HashKey,
        ECPAY_CONFIG.HashIV
    );

    if (receivedCheckMacValue === calculatedCheckMacValue) {
        console.log('付款結果驗證成功');
        // 這裡可以更新資料庫訂單狀態
        res.send('1|OK'); // 回應綠界成功
    } else {
        console.log('付款結果驗證失敗');
        res.send('0|FAIL');
    }
});

// 使用者返回頁面
app.get('/ecpay/client_back', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'payment-result.html'));
});

// 訂單查詢結果
app.post('/ecpay/order_result', (req, res) => {
    console.log('訂單查詢結果:', req.body);
    res.send('1|OK');
});

// 轉換付款方式
function getEcpayPaymentMethod(method) {
    switch(method) {
        case 'creditcard':
            return 'Credit';
        case 'atm':
            return 'ATM';
        case 'cod':
            return 'CVS'; // 超商代碼
        case 'linepay':
            return 'Credit'; // LINE Pay 通常歸類在信用卡
        default:
            return 'ALL';
    }
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('綠界金流測試環境已啟動');
});

module.exports = app;
