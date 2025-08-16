export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('訂單查詢結果:', req.body);
        res.status(200).send('1|OK');
    } catch (error) {
        console.error('處理訂單查詢錯誤:', error);
        res.status(500).send('0|ERROR');
    }
}
