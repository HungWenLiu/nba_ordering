// 這個 API 專門處理付款成功後的前端重定向
export default function handler(req, res) {
    try {
        // 取得查詢參數
        const {
            MerchantTradeNo,
            RtnCode,
            RtnMsg,
            TradeNo,
            TradeAmt,
            PaymentDate,
            PaymentType,
            SimulatePaid
        } = req.query;

        console.log('付款成功重定向處理:', {
            MerchantTradeNo,
            RtnCode,
            RtnMsg,
            TradeNo,
            TradeAmt,
            PaymentDate,
            PaymentType,
            SimulatePaid
        });

        // 建構重定向 URL
        const redirectUrl = '/payment-result.html';
        const params = new URLSearchParams();
        
        if (MerchantTradeNo) params.append('MerchantTradeNo', MerchantTradeNo);
        if (RtnCode) params.append('RtnCode', RtnCode);
        if (RtnMsg) params.append('RtnMsg', RtnMsg);
        if (TradeNo) params.append('TradeNo', TradeNo);
        if (TradeAmt) params.append('TradeAmt', TradeAmt);
        if (PaymentDate) params.append('PaymentDate', PaymentDate);
        if (PaymentType) params.append('PaymentType', PaymentType);
        if (SimulatePaid) params.append('SimulatePaid', SimulatePaid);

        const fullRedirectUrl = `${redirectUrl}?${params.toString()}`;

        // 返回重定向頁面
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>付款完成</title>
                <meta http-equiv="refresh" content="0; url=${fullRedirectUrl}">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px; 
                        background-color: #f5f5f5;
                    }
                    .success-container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        max-width: 400px;
                        margin: 0 auto;
                    }
                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #28a745;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .btn {
                        background-color: #28a745;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-top: 20px;
                        text-decoration: none;
                        display: inline-block;
                    }
                    .btn:hover {
                        background-color: #1e7e34;
                    }
                </style>
            </head>
            <body>
                <div class="success-container">
                    <div class="spinner"></div>
                    <h3>✅ 付款成功！</h3>
                    <p>正在跳轉到結果頁面...</p>
                    <a href="${fullRedirectUrl}" class="btn">手動前往結果頁</a>
                </div>
                <script>
                    // 如果 meta refresh 沒有作用，用 JavaScript 重定向
                    setTimeout(function() {
                        window.location.href = "${fullRedirectUrl}";
                    }, 1000);
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('付款成功重定向處理錯誤:', error);
        
        // 發生錯誤時，重定向到一般的成功頁面
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>付款完成</title>
                <meta http-equiv="refresh" content="0; url=/payment-result.html">
            </head>
            <body>
                <div style="text-align: center; padding: 50px;">
                    <h2>付款完成，正在跳轉...</h2>
                    <p>如果沒有自動跳轉，請<a href="/payment-result.html">點擊這裡</a></p>
                </div>
            </body>
            </html>
        `);
    }
}
