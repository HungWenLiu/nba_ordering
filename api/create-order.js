const crypto = require('crypto');

// 綠界測試環境設定
const ECPAY_CONFIG = {
    MerchantID: '2000132', // 測試商店代號
    HashKey: '5294y06JbISpM5x9', // 測試金鑰
    HashIV: 'v77hoKGq4kWxNNIS', // 測試向量
    BaseURL: 'https://payment-stage.ecpay.com.tw', // 測試環境網址
    ReturnURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/ecpay-return` : 'https://nbaordering-hoyi0ic1c-kevins-projects-40d4751e.vercel.app/api/ecpay-return',
    ClientBackURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/payment-result.html` : 'https://nbaordering-hoyi0ic1c-kevins-projects-40d4751e.vercel.app/payment-result.html',
    OrderResultURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/ecpay-order-result` : 'https://nbaordering-hoyi0ic1c-kevins-projects-40d4751e.vercel.app/api/ecpay-order-result'
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
            return 'CVS'; // 超商代碼繳費
        case 'linepay':
            return 'Credit'; // LINE Pay 歸類在信用卡，但需要特殊處理
        default:
            return 'ALL';
    }
}

// 取得付款方式的額外參數
function getPaymentExtraParams(method, ecpayParams) {
    switch(method) {
        case 'creditcard':
            // 信用卡參數
            ecpayParams.CreditInstallment = '3,6,12'; // 支援分期
            ecpayParams.DeviceSource = 'P'; // 桌面版
            break;
        case 'atm':
            // ATM 轉帳參數
            ecpayParams.ExpireDate = 3; // 3天內完成轉帳
            ecpayParams.PaymentInfoURL = ecpayParams.ReturnURL; // ATM 資訊通知
            break;
        case 'cod':
            // 超商代碼繳費參數
            ecpayParams.StoreExpireDate = 10080; // 7天有效期(分鐘)
            break;
        case 'linepay':
            // LINE Pay 特殊設定
            ecpayParams.CreditInstallment = ''; // LINE Pay 不支援分期
            ecpayParams.DeviceSource = 'P'; // 桌面版
            // LINE Pay 需要特殊的 ChooseSubPayment 參數
            ecpayParams.ChooseSubPayment = 'LinePay';
            break;
    }
    return ecpayParams;
}

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('收到的請求體:', req.body);
        
        const {
            productName,
            productPrice,
            warranty,
            customerName,
            customerEmail,
            city,
            district,
            address,
            paymentMethod,
            creditCard // 信用卡資訊（僅用於日誌記錄，不傳給綠界）
        } = req.body;

        // 驗證必要欄位
        if (!productName || !productPrice || !customerName || !customerEmail || !paymentMethod) {
            console.log('缺少必要欄位:', {
                productName: !!productName,
                productPrice: !!productPrice,
                customerName: !!customerName,
                customerEmail: !!customerEmail,
                paymentMethod: !!paymentMethod
            });
            return res.status(400).json({ error: '缺少必要欄位' });
        }

        // 如果是信用卡付款，記錄相關資訊（但不記錄敏感資料）
        if (paymentMethod === 'creditcard' && creditCard) {
            console.log('信用卡付款資訊已收到:', {
                cardHolder: creditCard.cardHolder,
                cardNumberMask: creditCard.cardNumber ? 
                    '**** **** **** ' + creditCard.cardNumber.slice(-4) : 'N/A',
                expiryDate: creditCard.expiryDate
                // 注意：我們不記錄完整卡號和CVV以確保安全
            });
        }

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
        
        // 生成正確的綠界時間格式
        const now = new Date();
        const merchantTradeDate = now.getFullYear() + '/' + 
            String(now.getMonth() + 1).padStart(2, '0') + '/' + 
            String(now.getDate()).padStart(2, '0') + ' ' + 
            String(now.getHours()).padStart(2, '0') + ':' + 
            String(now.getMinutes()).padStart(2, '0') + ':' + 
            String(now.getSeconds()).padStart(2, '0');
        
        // 綠界金流參數
        let ecpayParams = {
            MerchantID: ECPAY_CONFIG.MerchantID,
            MerchantTradeNo: merchantTradeNo,
            MerchantTradeDate: merchantTradeDate,
            PaymentType: 'aio',
            TotalAmount: totalAmount,
            TradeDesc: `NBA球員卡-${productName}`,
            ItemName: `${productName}${warranty ? '+保固服務' : ''}`,
            ReturnURL: ECPAY_CONFIG.ReturnURL,
            OrderResultURL: ECPAY_CONFIG.OrderResultURL,
            NeedExtraPaidInfo: 'N',
            ChoosePayment: getEcpayPaymentMethod(paymentMethod),
            EncryptType: 1
        };

        // 對於信用卡和 LINE Pay 付款，設定 ClientBackURL
        if (paymentMethod === 'creditcard' || paymentMethod === 'linepay') {
            ecpayParams.ClientBackURL = ECPAY_CONFIG.ClientBackURL;
        }

        // 根據付款方式設定額外參數
        ecpayParams = getPaymentExtraParams(paymentMethod, ecpayParams);

        // 生成檢查碼
        ecpayParams.CheckMacValue = generateCheckMacValue(
            ecpayParams, 
            ECPAY_CONFIG.HashKey, 
            ECPAY_CONFIG.HashIV
        );

        // 記錄參數到控制台，方便除錯
        console.log('綠界參數:', ecpayParams);
        console.log('訂單資訊:', {
            customerName,
            customerEmail,
            city,
            district,
            address,
            totalAmount,
            paymentMethod
        });

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
                .payment-info {
                    text-align: left;
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 5px;
                    border-left: 4px solid #007bff;
                }
            </style>
        </head>
        <body onload="document.forms[0].submit();">
            <form action="${ECPAY_CONFIG.BaseURL}/Cashier/AioCheckOut/V5" method="post">
        `;

        Object.keys(ecpayParams).forEach(key => {
            formHTML += `<input type="hidden" name="${key}" value="${ecpayParams[key]}">`;
        });

        // 根據付款方式顯示不同的說明
        let paymentDescription = '';
        if (paymentMethod === 'creditcard') {
            paymentDescription = `
                <div class="payment-info">
                    <h4>💳 信用卡付款</h4>
                    <p>您將在綠界安全頁面輸入信用卡資訊完成付款</p>
                    <small>• 支援 Visa、MasterCard、JCB<br>
                    • 支援分期付款<br>
                    • 所有交易均經過SSL加密保護</small>
                </div>
            `;
        } else if (paymentMethod === 'linepay') {
            paymentDescription = `
                <div class="payment-info">
                    <h4>💚 LINE Pay</h4>
                    <p>您將被導向 LINE Pay 完成付款</p>
                    <small>• 使用您的 LINE 帳號快速付款<br>
                    • 支援各大銀行信用卡<br>
                    • 安全便利的行動支付</small>
                </div>
            `;
        }

        formHTML += `
            </form>
            <div class="loading-container">
                <div class="spinner"></div>
                <h3>正在跳轉到綠界金流...</h3>
                <p>請稍候，系統正在為您處理付款...</p>
                ${paymentDescription}
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
