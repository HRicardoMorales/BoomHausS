// frontend/src/hooks/useDebouncedValue.js
import { useEffect, useState } from 'react';

/** Devuelve `value` recién cuando deja de cambiar durante `delay` ms (búsquedas que pegan a la API). */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
