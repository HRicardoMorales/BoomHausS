import { Component } from 'react';
import { Link } from 'react-router-dom';
import { logger } from '../utils/logger.js';
import StatePanel from './ui/StatePanel.jsx';

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk/i;

/**
 * Error boundary de rutas.
 *
 * Atrapa errores de render y de carga de chunks lazy (cuando `lazyWithRetry`
 * ya recargó una vez y el chunk sigue fallando). Sin esto, cualquier excepción
 * en una página dejaba la app en blanco. `resetKey` (la ruta actual) limpia el
 * error al navegar, así el usuario no queda atrapado en la pantalla de error.
 *
 * Se usa en dos niveles:
 * - `scope="route"` (App.jsx): alrededor de <Routes>; navbar y footer siguen.
 * - `scope="app"` (main.jsx): red de seguridad sobre todo el árbol, para
 *   errores en navbar, footer o providers (carrito, motion). Está por fuera
 *   del Router, así que no puede usar <Link> y "reintentar" recarga.
 */
export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, info) {
    logger.error('[ErrorBoundary]', error, info?.componentStack);
  }

  retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isChunk = CHUNK_ERROR.test(String(error?.message || error));
    const isApp = this.props.scope === 'app';
    const reload = () => window.location.reload();

    const actions = (
      <>
        {isChunk || isApp ? (
          <button type="button" className="btn btn-primary" onClick={reload}>
            {isChunk ? 'Recargar' : 'Reintentar'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={this.retry}>
            Reintentar
          </button>
        )}
        {isApp ? (
          <a href="/" className="btn btn-ghost">Ir al inicio</a>
        ) : (
          <Link to="/" className="btn btn-ghost" onClick={this.retry}>
            Ir al inicio
          </Link>
        )}
      </>
    );

    // Mismo lenguaje visual que los estados vacíos/de error de la tienda.
    // h1: la página que falló no llegó a renderizar el suyo.
    return (
      <>
        <StatePanel
          tone="error"
          icon={isChunk ? 'refresh' : 'alert'}
          as="h1"
          eyebrow={isChunk ? 'Actualización' : 'Error inesperado'}
          title={isChunk ? 'Hay una versión nueva del sitio' : 'Algo no salió como esperábamos'}
          actions={actions}
          className={isApp ? 'error-fallback--app' : ''}
        >
          <p>
            {isChunk
              ? 'Actualizamos la tienda mientras navegabas. Recargá la página para seguir.'
              : `No pudimos mostrar ${isApp ? 'la página' : 'esta sección'}. Tu carrito sigue guardado.`}
          </p>
        </StatePanel>
        {import.meta.env.DEV && (
          <pre className="error-fallback__debug">{String(error?.stack || error)}</pre>
        )}
      </>
    );
  }
}
