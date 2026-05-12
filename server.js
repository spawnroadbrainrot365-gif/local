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
    const executors = ['Delta', 'Synapse', 'Krnl', 'Solara', 'ScriptWare', 'Fluxus', 'Hydrogen', 'Roblox', 'Executor'];
    return executors.some(e => userAgent.includes(e));
}
