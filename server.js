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

function isBrowser(userAgent) {
    if (!userAgent) return true;
    const browsers = ['Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'MSIE', 'Trident'];
    return browsers.some(b => userAgent.includes(b));
}

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
    console.log(` تم رفع: ${req.file.originalname}`);
    res.json({ success: true, rawUrl });
});

app.get('/raw/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    saveLog({ filename, userAgent, ip, timestamp: new Date().toISOString() });

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('الملف غير موجود');
    }

    if (isBrowser(userAgent) && !isExecutor(userAgent)) {
        return res.status(403).send(`
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Divine Obfuscator </title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0f1c, #0c1222, #0a0f1c);
            background-attachment: fixed;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', system-ui, monospace;
            padding: 20px;
        }
        .card {
            background: rgba(18, 25, 45, 0.85);
            backdrop-filter: blur(16px);
            border-radius: 2rem;
            border: 1px solid rgba(255, 70, 85, 0.4);
            padding: 3rem 2rem;
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .icon {
            font-size: 5rem;
            margin-bottom: 1rem;
        }
        h1 {
            color: #ff6b6b;
            font-size: 1.8rem;
            margin-bottom: 1rem;
        }
        p {
            color: #b3d0ff;
            margin-bottom: 1rem;
            line-height: 1.6;
        }
        .divine {
            color: #8a9fd8;
            font-size: 0.8rem;
            margin-top: 1.5rem;
            border-top: 1px solid #2a3a60;
            padding-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🔒</div>
        <h1>عذرا الملف محمي</h1>
        <p>لا يمكنك رؤيته ولاكن يمكنك تشغيله في الهاك.</p>
        <p style="font-size: 0.8rem; opacity: 0.7;">Divine Obfuscator | Raw Access Denied</p>
        <div class="divine"> تم التشفير بواسطة Divine Obfuscator</div>
    </div>
</body>
</html>
        `);
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
    console.log(`✅ Divine Obfuscator Server running on port ${PORT}`);
});
