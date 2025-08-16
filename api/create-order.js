const crypto = require('crypto');

// 綠界測試環境設定
const ECPAY_CONFIG = {
    MerchantID: '2000132', // 測試商店代號
    HashKey: '5294y06JbISpM5x9', // 測試金鑰
    HashIV: 'v77hoKGq4kWxNNIS', // 測試向量
    BaseURL: 'https://payment-stage.ecpay.com.tw', // 測試環境網址
    ReturnURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/ecpay-return` : 'https://your-domain.vercel.app/api/ecpay-return',
    ClientBackURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/payment-result.html` : 'https://your-domain.vercel.app/payment-result.html',
    OrderResultURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/ecpay-order-result` : 'https://your-domain.vercel.app/api/ecpay-order-result'
};

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

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
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
        if (warranty === true || warranty === 'true') {
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
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px; 
                    background-color: #f5f5f5;
                }
                .loading-container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 400px;
                    margin: 0 auto;
                }
                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 2s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .btn {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-top: 20px;
                }
                .btn:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body onload="document.forms[0].submit();">
            <form action="${ECPAY_CONFIG.BaseURL}/Cashier/AioCheckOut/V5" method="post">
        `;

        Object.keys(ecpayParams).forEach(key => {
            formHTML += `<input type="hidden" name="${key}" value="${ecpayParams[key]}">`;
        });

        formHTML += `
            </form>
            <div class="loading-container">
                <div class="spinner"></div>
                <h3>正在跳轉到綠界金流...</h3>
                <p>請稍候，系統正在為您處理付款...</p>
                <button class="btn" onclick="document.forms[0].submit();">手動前往付款</button>
            </div>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(formHTML);

    } catch (error) {
        console.error('建立訂單錯誤:', error);
        res.status(500).json({ error: '訂單建立失敗' });
    }
}
