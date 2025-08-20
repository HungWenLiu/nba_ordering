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
                交易狀態: req.body.RtnCode === '1' ? '成功' : '失敗'
            });
            
            // 這裡可以更新資料庫訂單狀態
            // 例如：updateOrderStatus(req.body.MerchantTradeNo, 'paid');
            
            res.status(200).send('1|OK'); // 回應綠界成功
        } else {
            console.log('付款結果驗證失敗');
            res.status(400).send('0|FAIL');
        }
    } catch (error) {
        console.error('處理綠界回傳錯誤:', error);
        res.status(500).send('0|ERROR');
    }
}
