export default function handler(req, res) {
    if (req.method === 'GET') {
        return res.status(200).json({ message: 'ECPay order result API is working.' });
    } else if (req.method === 'POST') {
        try {
            console.log('訂單查詢結果:', req.body);
            res.status(200).send('1|OK');
        } catch (error) {
            console.error('處理訂單查詢錯誤:', error);
            res.status(500).send('0|ERROR');
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
