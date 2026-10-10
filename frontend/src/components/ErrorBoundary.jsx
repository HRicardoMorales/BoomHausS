import { Component } from 'react';
import { Link } from 'react-router-dom';
import logger from '../utils/logger.js';

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk/i;

/**
 * Error boundary de rutas.
 *
 * Atrapa errores de render y de carga de chunks lazy (cuando `lazyWithRetry`
 * ya recargó una vez y el chunk sigue fallando). Sin esto, cualquier excepción
 * en una página dejaba la app en blanco. `resetKey` (la ruta actual) limpia el
 * error al navegar, así el usuario no queda atrapado en la pantalla de error.
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

    return (
      <section className="error-fallback" role="alert" aria-live="assertive">
        <span className="error-fallback__mark" aria-hidden="true">!</span>
        <h1 className="error-fallback__title">
          {isChunk ? 'Hay una versión nueva del sitio' : 'Algo no salió como esperábamos'}
        </h1>
        <p className="error-fallback__text">
          {isChunk
            ? 'Actualizamos la tienda mientras navegabas. Recargá la página para seguir.'
            : 'No pudimos mostrar esta sección. Tu carrito sigue guardado.'}
        </p>
        <div className="error-fallback__actions">
          {isChunk ? (
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Recargar
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={this.retry}>
              Reintentar
            </button>
          )}
          <Link to="/" className="btn btn-ghost" onClick={this.retry}>
            Ir al inicio
          </Link>
        </div>
        {import.meta.env.DEV && (
          <pre className="error-fallback__debug">{String(error?.stack || error)}</pre>
        )}
      </section>
    );
  }
}
