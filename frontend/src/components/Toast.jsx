import { useEffect } from "react";

export default function Toast({ open, message, type = "success", onClose, duration = 2000 }) {
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => onClose?.(), duration);
        return () => clearTimeout(t);
    }, [open, message, type, duration, onClose]); // ✅ reinicia timer si cambia mensaje

    if (!open) return null;

    return (
        <div className={`toast toast--${type}`} role="status" aria-live="polite">
            <div className="toast__dot" />
            <div className="toast__msg">{message}</div>
            <button className="toast__x" onClick={onClose} aria-label="Cerrar">
                ✕
            </button>
        </div>
    );
}
