// frontend/src/components/AdminRoute.jsx

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredAuth, isAdmin } from '../utils/auth';

export default function AdminRoute({ children }) {
    const location = useLocation();

    const [auth, setAuth] = useState(() => getStoredAuth());

    function refreshAuth() {
        setAuth(getStoredAuth());
    }

    // ✅ refresca al cambiar ruta (por si venís navegando). Ajuste de estado
    // durante el render en lugar de useEffect: sin render intermedio.
    const [prevPath, setPrevPath] = useState(location.pathname);
    if (prevPath !== location.pathname) {
        setPrevPath(location.pathname);
        setAuth(getStoredAuth());
    }

    // ✅ refresca al hacer login/logout (evento auth:changed)
    useEffect(() => {
        window.addEventListener('auth:changed', refreshAuth);
        return () => window.removeEventListener('auth:changed', refreshAuth);
    }, []);

    const { token, user } = auth;

    // 1) No logueado => a login con "from"
    if (!token || !user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // 2) Logueado pero no admin => afuera
    if (!isAdmin(user)) {
        return <Navigate to="/" replace />;
    }

    // 3) Admin => pasa
    return children;
}
