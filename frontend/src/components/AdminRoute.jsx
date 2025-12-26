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

    // ✅ refresca al cambiar ruta (por si venís navegando)
    useEffect(() => {
        refreshAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

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
