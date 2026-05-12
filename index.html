const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const logsFile = path.join(__dirname, 'logs.json');
let logs = [];
if (fs.existsSync(logsFile)) {
    try { logs = JSON.parse(fs.readFileSync(logsFile)); } catch(e) { logs = []; }
}

function saveLog(entry) {
    logs.unshift(entry);
    if (logs.length > 500) logs.pop();
    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
}

// الكشف عن المتصفحات
function isBrowser(userAgent) {
    if (!userAgent) return true;
    const browsers = ['Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'MSIE', 'Trident'];
    return browsers.some(b => userAgent.includes(b));
}

// الكشف عن المنفذات
function isExecutor(userAgent) {
    if (!userAgent) return false;
    const executors = ['Roblox', 'Delta', 'Synapse', 'Krnl', 'Solara', 'ScriptWare', 'Fluxus', 'Hydrogen', 'Comet', 'Executor'];
    return executors.some(e => userAgent.includes(e));
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

app.use(express.json());
app.use(express.static(__dirname));

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'لا يوجد ملف' });
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const rawUrl = `${protocol}://${host}/raw/${req.file.filename}`;
    console.log(`✅ تم رفع: ${req.file.originalname}`);
    res.json({ success: true, rawUrl });
});

// رابط raw مع منع المتصفحات
app.get('/raw/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // تسجيل الطلب
    saveLog({
        filename,
        userAgent,
        ip,
        timestamp: new Date().toISOString(),
        fullUrl: req.headers['referer'] || 'direct'
    });

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('الملف غير موجود');
    }

    // منع المتصفحات
    if (isBrowser(userAgent) && !isExecutor(userAgent)) {
        return res.status(403).send('🚫 غير مسموح لك برؤية الكود - هذا الرابط مخصص للتشغيل عبر المنفذات فقط');
    }

    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath);
});

app.get('/api/logs', (req, res) => {
    res.json(logs);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
