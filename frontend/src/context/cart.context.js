import { createContext } from "react";

// Objeto de contexto separado del Provider para que el archivo del Provider
// exporte solo componentes (Fast Refresh) y el hook viva en hooks/useCart.js.
export const CartContext = createContext(null);
