const crypto = require('crypto');

// 綠界測試環境設定
const ECPAY_CONFIG = {
    MerchantID: '2000132',
    HashKey: '5294y06JbISpM5x9',
    HashIV: 'v77hoKGq4kWxNNIS'
};

// 生成檢查碼
function generateCheckMacValue(params, hashKey, hashIV) {
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

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('綠界回傳結果:', req.body);
        
        // 驗證檢查碼
        const receivedCheckMacValue = req.body.CheckMacValue;
        const paramsForCheck = { ...req.body };
        delete paramsForCheck.CheckMacValue;
        
        const calculatedCheckMacValue = generateCheckMacValue(
            paramsForCheck,
            ECPAY_CONFIG.HashKey,
            ECPAY_CONFIG.HashIV
        );

        if (receivedCheckMacValue === calculatedCheckMacValue) {
            console.log('付款結果驗證成功');
            console.log('訂單詳細資訊:', {
                訂單編號: req.body.MerchantTradeNo,
                付款金額: req.body.TradeAmt,
                付款時間: req.body.PaymentDate,
                付款方式: req.body.PaymentType,
                商品名稱: req.body.ItemName,
                交易狀態: req.body.RtnCode === '1' ? '成功' : '失敗',
                綠界交易編號: req.body.TradeNo
            });
            
            // 檢查是否為信用卡或 LINE Pay 付款
            const paymentType = req.body.PaymentType;
            const isCardPayment = paymentType && (paymentType.includes('Credit') || paymentType.includes('AndroidPay') || paymentType.includes('ApplePay'));
            
            // 如果是信用卡類付款且成功，重定向到成功頁面
            if (isCardPayment && req.body.RtnCode === '1') {
                const redirectUrl = process.env.VERCEL_URL ? 
                    `https://${process.env.VERCEL_URL}/payment-result.html` : 
                    'https://nbaordering-hoyi0ic1c-kevins-projects-40d4751e.vercel.app/payment-result.html';
                
                // 建構重定向 URL 帶上所有必要參數
                const params = new URLSearchParams({
                    MerchantTradeNo: req.body.MerchantTradeNo || '',
                    RtnCode: req.body.RtnCode || '',
                    RtnMsg: req.body.RtnMsg || '',
                    TradeNo: req.body.TradeNo || '',
                    TradeAmt: req.body.TradeAmt || '',
                    PaymentDate: req.body.PaymentDate || '',
                    PaymentType: req.body.PaymentType || '',
                    SimulatePaid: req.body.SimulatePaid || '0'
                });
                
                const fullRedirectUrl = `${redirectUrl}?${params.toString()}`;
                console.log('重定向到:', fullRedirectUrl);
                
                // 對於信用卡付款，返回重定向頁面
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.status(200).send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>付款完成</title>
                        <script>
                            window.location.href = "${fullRedirectUrl}";
                        </script>
                    </head>
                    <body>
                        <div style="text-align: center; padding: 50px;">
                            <h2>付款完成，正在跳轉...</h2>
                            <p>如果沒有自動跳轉，請<a href="${fullRedirectUrl}">點擊這裡</a></p>
                        </div>
                    </body>
                    </html>
                `);
            } else {
                // 對於其他付款方式或失敗情況，返回標準回應
                res.status(200).send('1|OK');
            }
            
            // 這裡可以更新資料庫訂單狀態
            // 例如：updateOrderStatus(req.body.MerchantTradeNo, req.body.RtnCode === '1' ? 'paid' : 'failed');
            
        } else {
            console.log('付款結果驗證失敗');
            console.log('接收到的 CheckMacValue:', receivedCheckMacValue);
            console.log('計算出的 CheckMacValue:', calculatedCheckMacValue);
            res.status(400).send('0|FAIL');
        }
    } catch (error) {
        console.error('處理綠界回傳錯誤:', error);
        res.status(500).send('0|ERROR');
    }
}
