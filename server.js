const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const dbFile = './files.json';
let filesDB = {};
if (fs.existsSync(dbFile)) {
    filesDB = JSON.parse(fs.readFileSync(dbFile));
}

const saveDB = () => fs.writeFileSync(dbFile, JSON.stringify(filesDB, null, 2));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB حد أقصى
});

app.use(express.json());
app.use(express.static(__dirname));

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'لا يوجد ملف' });
    
    const originalName = req.file.originalname;
    const filename = req.file.filename;
    const protocol = req.protocol;
    const host = req.get('host');
    
    filesDB[filename] = {
        originalName: originalName,
        secure: false,
        createdAt: new Date().toISOString()
    };
    saveDB();
    
    const rawUrl = `${protocol}://${host}/${filename}`;
    
    res.json({
        success: true,
        message: `✅ تم وضع ملف: ${originalName}`,
        filename: filename,
        rawUrl: rawUrl
    });
});

app.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    const fileData = filesDB[filename];
    
    if (filename === 'favicon.ico') return res.status(204).end();
    if (!fs.existsSync(filePath)) return res.status(404).send('الملف غير موجود');
    
    const userAgent = req.headers['user-agent'] || '';
    const isRoblox = userAgent.includes('Roblox') || userAgent.includes('HttpClient') || userAgent.includes('game:HttpGet') || userAgent.includes('Lua') || userAgent.includes('Synapse') || userAgent.includes('Krnl') || userAgent.includes('Delta') || userAgent.includes('Executor');
    
    if (fileData && fileData.secure === true && !isRoblox) {
        return res.status(403).send('🚫 غير مسموح لك برؤية الكود');
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath);
});

app.post('/secure/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!filesDB[filename]) return res.status(404).json({ error: 'الملف غير موجود' });
    
    filesDB[filename].secure = true;
    saveDB();
    res.json({ success: true, message: `🔒 تم تأمين الملف: ${filesDB[filename].originalName}` });
});

app.post('/unsecure/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!filesDB[filename]) return res.status(404).json({ error: 'الملف غير موجود' });
    
    filesDB[filename].secure = false;
    saveDB();
    res.json({ success: true, message: `🔓 تم فك التأمين عن الملف: ${filesDB[filename].originalName}` });
});

app.get('/files', (req, res) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const files = Object.keys(filesDB).map(key => ({
        filename: key,
        originalName: filesDB[key].originalName,
        secure: filesDB[key].secure,
        createdAt: filesDB[key].createdAt,
        rawUrl: `${protocol}://${host}/${key}`
    }));
    res.json(files);
});

app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (filesDB[filename]) delete filesDB[filename];
    saveDB();
    
    res.json({ success: true, message: '🗑️ تم حذف الملف' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
