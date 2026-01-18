import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Intenta subir la ventana normal (por si acaso)
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);

    // 2. BUSCA TUS CONTENEDORES INTERNOS (Aquí está el truco)
    // Buscamos '.app-body' que es donde vive tu contenido
    const containers = document.querySelectorAll('.app-body, .app-shell, #root, main');
    
    containers.forEach((el) => {
        try {
            el.scrollTo({ top: 0, left: 0, behavior: "instant" }); // "instant" evita la animación lenta
            el.scrollTop = 0; // Método antiguo para asegurar compatibilidad
        } catch (e) {
            el.scrollTop = 0;
        }
    });

  }, [pathname]); // Se ejecuta cada vez que cambias de página

  return null;
}