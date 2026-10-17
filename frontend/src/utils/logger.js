// frontend/src/utils/logger.js
//
// Logger del cliente: debug/info solo en desarrollo (en producción son no-op,
// no ensucian la consola del cliente), warn/error siempre.
const isDev = import.meta.env.DEV;
const noop = () => {};

export const logger = {
  debug: isDev ? (...args) => console.debug(...args) : noop,
  info: isDev ? (...args) => console.info(...args) : noop,
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export default logger;
