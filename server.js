const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== إنشاء مجلد uploads تلقائياً ==========
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 تم إنشاء مجلد uploads');
}

// ========== إعداد تخزين الملفات ==========
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});

const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB حد أقصى
});

app.use(express.json());
app.use(express.static(__dirname)); // يخدم index.html من نفس المجلد

// ========== رفع الملف ==========
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'لا يوجد ملف' });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const rawUrl = `${protocol}://${host}/raw/${req.file.filename}`;

    console.log(`✅ تم رفع ملف: ${req.file.originalname} -> ${rawUrl}`);
    res.json({ success: true, rawUrl: rawUrl });
});

// ========== رابط الـ Raw ==========
app.get('/raw/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('الملف غير موجود');
    }

    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath);
});

// ========== الصفحة الرئيسية ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== تشغيل السيرفر ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    console.log(`📁 مجلد الرفع: ${uploadDir}`);
});
