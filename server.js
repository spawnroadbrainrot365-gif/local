const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 100 * 1024 * 1024 } });

app.use(express.json());
app.use(express.static(__dirname)); // يخدم الملفات من نفس المجلد

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'لا يوجد ملف' });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const rawUrl = `${protocol}://${host}/raw/${req.file.filename}`;

    res.json({ success: true, rawUrl: rawUrl });
});

app.get('/raw/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('الملف غير موجود');

    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
