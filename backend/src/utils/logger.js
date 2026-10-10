// backend/src/utils/logger.js
//
// Logger mínimo con niveles, sin dependencias.
//
// - Niveles: debug < info < warn < error < silent.
// - Nivel por defecto: `debug` en desarrollo, `info` en producción.
//   Se puede forzar con LOG_LEVEL (opcional, no es un secreto).
// - Producción (NODE_ENV=production): una línea JSON por evento, lista para
//   filtrar en los logs de Render (`"level":"error"`, `"scope":"orders"`).
// - Desarrollo: salida legible con hora, nivel y scope.
// - Los Error se serializan con name/message/stack (el stack solo fuera de
//   producción o en nivel error) para no perder diagnóstico.
// - `logger.child('scope')` crea un logger con contexto fijo.
//
// Uso:
//   const logger = require('../utils/logger').child('orders');
//   logger.info('Orden creada', { orderId });
//   logger.error('Fallo Mercado Pago', err);

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const isProd = process.env.NODE_ENV === 'production';

function resolveLevel() {
    const fromEnv = String(process.env.LOG_LEVEL || '').toLowerCase();
    if (fromEnv in LEVELS) return fromEnv;
    return isProd ? 'info' : 'debug';
}

const threshold = LEVELS[resolveLevel()];

function serializeError(err, level) {
    const out = { name: err.name, message: err.message };
    if (err.code !== undefined) out.code = err.code;
    if (err.status || err.statusCode) out.status = err.status || err.statusCode;
    if (!isProd || level === 'error') out.stack = err.stack;
    return out;
}

// Normaliza los argumentos extra: un Error va a `err`, un objeto plano se
// mezcla como contexto y cualquier otro valor va a `detail`.
function buildMeta(args, level) {
    const meta = {};
    for (const arg of args) {
        if (arg === undefined) continue;
        if (arg instanceof Error) meta.err = serializeError(arg, level);
        else if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
            for (const [k, v] of Object.entries(arg)) {
                meta[k] = v instanceof Error ? serializeError(v, level) : v;
            }
        } else meta.detail = arg;
    }
    return meta;
}

const COLORS = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' };
const RESET = '\x1b[0m';

function write(level, scope, msg, args) {
    if (LEVELS[level] < threshold) return;
    const meta = buildMeta(args, level);
    const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;

    if (isProd) {
        const line = { time: new Date().toISOString(), level, ...(scope && { scope }), msg, ...meta };
        let json;
        try {
            json = JSON.stringify(line);
        } catch {
            json = JSON.stringify({ time: line.time, level, scope, msg, detail: '[meta no serializable]' });
        }
        stream.write(json + '\n');
        return;
    }

    const time = new Date().toTimeString().slice(0, 8);
    const color = stream.isTTY ? COLORS[level] : '';
    const reset = stream.isTTY ? RESET : '';
    const tag = `${color}${level.toUpperCase().padEnd(5)}${reset}`;
    const scopeTxt = scope ? ` [${scope}]` : '';
    const { err, ...rest } = meta;
    const ctx = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
    stream.write(`${time} ${tag}${scopeTxt} ${msg}${ctx}\n`);
    if (err?.stack) stream.write(err.stack + '\n');
    else if (err) stream.write(`${err.name}: ${err.message}\n`);
}

function createLogger(scope) {
    return {
        debug: (msg, ...args) => write('debug', scope, msg, args),
        info: (msg, ...args) => write('info', scope, msg, args),
        warn: (msg, ...args) => write('warn', scope, msg, args),
        error: (msg, ...args) => write('error', scope, msg, args),
        child: (sub) => createLogger(scope ? `${scope}:${sub}` : sub),
        isLevelEnabled: (level) => LEVELS[level] >= threshold,
    };
}

// Para loguear un email sin exponerlo completo: "juan.perez@gmail.com" → "ju***@gmail.com".
function maskEmail(email) {
    const [user, domain] = String(email || '').split('@');
    if (!domain) return '[sin email]';
    return `${user.slice(0, 2)}***@${domain}`;
}

module.exports = createLogger();
module.exports.LEVELS = LEVELS;
module.exports.maskEmail = maskEmail;
