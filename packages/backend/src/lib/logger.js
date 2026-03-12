/**
 * Merkezi Loglama Sistemi
 * Tüm backend bileşenleri için tutarlı log formatı
 * Terminal + Dosya loglama (zaman damgalı)
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL = process.env.LOG_LEVEL || 'DEBUG';
const currentLevel = LOG_LEVELS[LOG_LEVEL] || 0;

const COLORS = {
  DEBUG: '\x1b[36m', // cyan
  INFO: '\x1b[32m',  // green
  WARN: '\x1b[33m',  // yellow
  ERROR: '\x1b[31m', // red
  RESET: '\x1b[0m',
};

// Log dizini
const LOG_DIR = path.join(__dirname, '../../../logs');

// Log dizinini oluştur
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Günlük log dosyası adı
function getLogFileName() {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `backend-${date}.log`;
}

// Log dosyası yolu
function getLogFilePath() {
  return path.join(LOG_DIR, getLogFileName());
}

// Dosyaya yazma (async, hata durumunda sessizce geç)
function writeToFile(formattedMessage) {
  const logPath = getLogFilePath();
  fs.appendFile(logPath, formattedMessage + '\n', (err) => {
    if (err) {
      // Dosya yazma hatası - sadece terminale yaz
      console.error('Log dosyasına yazılamadı:', err.message);
    }
  });
}

function formatTimestamp() {
  return new Date().toISOString();
}

function createLogger(module) {
  const log = (level, message, data = null) => {
    if (LOG_LEVELS[level] < currentLevel) return;

    const timestamp = formatTimestamp();
    const color = COLORS[level] || COLORS.RESET;
    const prefix = `[${timestamp}] [${level}] [${module}]`;

    // Terminal için renkli çıktı
    const terminalMsg = data
      ? `${color}${prefix}${COLORS.RESET} ${message} ${JSON.stringify(data, null, 2)}`
      : `${color}${prefix}${COLORS.RESET} ${message}`;

    console.log(terminalMsg);

    // Dosya için düz metin (renksiz)
    const fileMsg = data
      ? `${prefix} ${message} ${JSON.stringify(data, null, 2)}`
      : `${prefix} ${message}`;

    writeToFile(fileMsg);
  };

  return {
    debug: (msg, data) => log('DEBUG', msg, data),
    info: (msg, data) => log('INFO', msg, data),
    warn: (msg, data) => log('WARN', msg, data),
    error: (msg, data) => log('ERROR', msg, data),
  };
}

module.exports = { createLogger, LOG_DIR };
