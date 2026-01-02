import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { clearAuth, getStoredAuth, isAdmin } from '../utils/auth';

function Marquee({ items }) {
    const repeated = [...items, ...items, ...items];
    return (
        <div className="marquee-bar" style={{ width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 28, padding: '10px 18px', whiteSpace: 'nowrap', animation: 'marquee 18s linear infinite', willChange: 'transform' }}>
                {repeated.map((text, idx) => (
                    <span key={`${text}-${idx}`} style={{ fontWeight: 950, letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'center', gap: 16 }}>
                        {text} <span style={{ opacity: 0.55 }}>•</span>
                    </span>
                ))}
            </div>
            <style>{`@keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-33.333%); } }`}</style>
        </div>
    );
}

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { items } = useCart();
    const cartCount = useMemo(() => (items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0), [items]);
    const [currentUser, setCurrentUser] = useState(() => getStoredAuth().user);

    function refreshUser() {
        const { user } = getStoredAuth();
        setCurrentUser(user || null);
    }

    useEffect(() => { refreshUser(); }, [location.pathname]);
    useEffect(() => { window.addEventListener('auth:changed', refreshUser); return () => window.removeEventListener('auth:changed', refreshUser); }, []);
    useEffect(() => { function onFocus() { refreshUser(); } window.addEventListener('focus', onFocus); return () => window.removeEventListener('focus', onFocus); }, []);

    const admin = isAdmin(currentUser);
    const [open, setOpen] = useState(false);
    useEffect(() => setOpen(false), [location.pathname]);

    function logout() {
        clearAuth();
        setCurrentUser(null);
        navigate('/login');
    }

    const storeName = import.meta.env.VITE_STORE_NAME || 'BoomHausS';
    const linkBase = ({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`;

    return (
        <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
            <Marquee items={['Envíos gratis a todo el país 🚚', 'Pago por transferencia 💸', 'Soporte por WhatsApp 💬', 'Compra segura ✅']} />

            <div className="container" style={{ padding: '0.85rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                    
                    {/* Brand */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid rgba(11,92,255,.25)', background: 'linear-gradient(180deg, rgba(11,92,255,.22), rgba(34,195,255,.14))', display: 'grid', placeItems: 'center', fontWeight: 950 }}>
                            {storeName.slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ lineHeight: 1.1 }}>
                            <div style={{ fontWeight: 950, letterSpacing: '-0.03em' }}>{storeName}</div>
                            <div className="muted" style={{ fontSize: '0.85rem' }}>Tienda oficial</div>
                        </div>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="nav-desktop" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <NavLink className={linkBase} to="/">Inicio</NavLink>
                        <NavLink className={linkBase} to="/products">Tienda</NavLink>

                        {/* 🔥 Carrito con estilo actualizado */}
                        <NavLink 
                            className={({ isActive }) => 
                                `nav-link ${isActive ? 'nav-link--active' : ''} ${cartCount > 0 ? 'cart-highlight' : ''}`
                            } 
                            to="/cart"
                        >
                            Carrito
                            {cartCount > 0 ? <span className="nav-pill">{cartCount}</span> : null}
                        </NavLink>

                        <NavLink className={linkBase} to="/checkout">Checkout</NavLink>

                        {currentUser ? <NavLink className={linkBase} to="/my-orders">Mis pedidos</NavLink> : null}
                        {admin ? <><NavLink className={linkBase} to="/admin/orders">Admin pedidos</NavLink><NavLink className={linkBase} to="/admin/products">Admin productos</NavLink></> : null}

                        <div style={{ width: 1, height: 26, background: 'var(--border)', margin: '0 0.35rem' }} />

                        {!currentUser ? (
                            <>
                                <NavLink className={linkBase} to="/login">Login</NavLink>
                                <NavLink className="btn btn-primary" to="/register">Registrarse →</NavLink>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                <span className="muted" style={{ fontWeight: 900, fontSize: '0.9rem' }}>{currentUser.name || currentUser.email}</span>
                                <button className="btn btn-ghost" type="button" onClick={logout}>Salir</button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile button */}
                    <button className="nav-burger btn btn-ghost" type="button" onClick={() => setOpen((v) => !v)} aria-label="Abrir menú">
                        {open ? 'Cerrar' : 'Menú'}
                        {cartCount > 0 ? <span className="nav-pill" style={{ marginLeft: 8 }}>{cartCount}</span> : null}
                    </button>
                </div>

                {/* Mobile menu */}
                {open ? (
                    <div className="card" style={{ marginTop: '0.85rem', padding: '0.85rem' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <NavLink className={linkBase} to="/">Inicio</NavLink>
                            <NavLink className={linkBase} to="/products">Tienda</NavLink>
                            
                            <NavLink 
                                className={({ isActive }) => 
                                    `nav-link ${isActive ? 'nav-link--active' : ''} ${cartCount > 0 ? 'cart-highlight' : ''}`
                                } 
                                to="/cart"
                            >
                                Carrito {cartCount > 0 && `(${cartCount})`}
                            </NavLink>

                            <NavLink className={linkBase} to="/checkout">Checkout</NavLink>
                            {currentUser ? <NavLink className={linkBase} to="/my-orders">Mis pedidos</NavLink> : null}
                            {admin ? <><NavLink className={linkBase} to="/admin/orders">Admin pedidos</NavLink><NavLink className={linkBase} to="/admin/products">Admin productos</NavLink></> : null}
                            <div style={{ height: 1, background: 'var(--border)', margin: '0.35rem 0' }} />
                            {!currentUser ? <><NavLink className={linkBase} to="/login">Login</NavLink><NavLink className="btn btn-primary" to="/register">Registrarse →</NavLink></> : <button className="btn btn-ghost" type="button" onClick={logout}>Cerrar sesión</button>}
                        </div>
                    </div>
                ) : null}
            </div>

            <style>{`
        .nav-link{ 
            position: relative; text-decoration: none; color: rgba(255,255,255,0.86); padding: 10px 12px; 
            border-radius: 12px; border: 1px solid transparent; transition: all .18s ease; 
            font-weight: 850; letter-spacing: -0.01em; display: inline-flex; align-items: center; gap: 8px; 
        }
        .nav-link:hover{ background: rgba(255,255,255,0.04); border-color: var(--border); transform: translateY(-1px); }
        .nav-link--active{ background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.14); box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
        
        /* 🔥 Estilo para Carrito Lleno: Fondo Blanco + Texto Azul + Borde Azul */
        .cart-highlight {
            background: #ffffff !important;
            color: #0B5CFF !important;
            border: 2px solid #0B5CFF !important;
            box-shadow: 0 4px 15px rgba(11, 92, 255, 0.25) !important;
            font-weight: 950 !important;
        }
        /* Ajustamos el "pill" del contador para que contraste dentro del botón blanco */
        .cart-highlight .nav-pill {
            background: #0B5CFF !important;
            color: #ffffff !important;
            border: none !important;
        }
        
        .nav-pill{ display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08); font-size: 0.82rem; font-weight: 950; line-height: 1; }
        .nav-burger{ display: none; }
        @media (max-width: 980px){ .nav-desktop{ display: none !important; } .nav-burger{ display: inline-flex; } }
      `}</style>
        </header>
    );
}