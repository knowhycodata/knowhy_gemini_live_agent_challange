/**
 * Frontend Logger Sistemi
 * Tarayıcı konsolu + Backend üzerinden dosya loglama
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'DEBUG';
const currentLevel = LOG_LEVELS[LOG_LEVEL] || 0;

const COLORS = {
  DEBUG: 'color: #00bcd4', // cyan
  INFO: 'color: #4caf50',   // green
  WARN: 'color: #ff9800',   // orange
  ERROR: 'color: #f44336',  // red
};

// Backend log endpoint'i
const LOG_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ENABLE_REMOTE_LOG = import.meta.env.VITE_ENABLE_REMOTE_LOG === 'true';

function formatTimestamp() {
  return new Date().toISOString();
}

// Backend'e log gönder
async function sendToBackend(level, module, message, data) {
  if (!ENABLE_REMOTE_LOG) return;
  
  try {
    await fetch(`${LOG_API_URL}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        module: `Frontend:${module}`,
        message,
        data,
        timestamp: formatTimestamp(),
      }),
    });
  } catch (err) {
    // Backend'e gönderilemedi - sessizce geç
    console.warn('Log backend\'e gönderilemedi:', err.message);
  }
}

function createLogger(module) {
  const log = (level, message, data = null) => {
    if (LOG_LEVELS[level] < currentLevel) return;

    const timestamp = formatTimestamp();
    const color = COLORS[level] || '';
    const prefix = `[${timestamp}] [${level}] [${module}]`;

    // Tarayıcı konsolu
    const consoleMethod = level.toLowerCase();
    if (data) {
      console[consoleMethod](`%c${prefix}`, color, message, data);
    } else {
      console[consoleMethod](`%c${prefix}`, color, message);
    }

    // Backend'e gönder (async, beklemeden)
    sendToBackend(level, module, message, data);
  };

  return {
    debug: (msg, data) => log('DEBUG', msg, data),
    info: (msg, data) => log('INFO', msg, data),
    warn: (msg, data) => log('WARN', msg, data),
    error: (msg, data) => log('ERROR', msg, data),
  };
}

export { createLogger };
