// frontend/src/pages/AdminCoupons.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

const EMPTY_FORM = { code: '', type: 'percent', value: '', minOrderAmount: '', maxUses: '', expiresAt: '' };

export default function AdminCoupons() {
  const [coupons, setCoupons]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [toggling, setToggling]   = useState(null); // id del cupón que se está toggling

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/coupons');
      setCoupons(res.data?.data || []);
    } catch {
      setError('No se pudieron cargar los cupones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(coupon) {
    setToggling(coupon._id);
    try {
      const res = await api.patch(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? res.data.data : c));
    } catch {
      setError('No se pudo actualizar el cupón.');
    } finally {
      setToggling(null);
    }
  }

  async function deleteCoupon(id) {
    if (!window.confirm('¿Eliminar este cupón?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch {
      setError('No se pudo eliminar el cupón.');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!form.code.trim() || !form.value) {
      setFormError('Código y descuento son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code:           form.code.trim().toUpperCase(),
        type:           form.type,
        value:          Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxUses:        form.maxUses        ? Number(form.maxUses)        : null,
        expiresAt:      form.expiresAt      || null,
      };
      const res = await api.post('/coupons', payload);
      setCoupons(prev => [res.data.data, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Error al crear el cupón.');
    } finally {
      setSaving(false);
    }
  }

  const isExpired = (c) => c.expiresAt && new Date() > new Date(c.expiresAt);
  const isExhausted = (c) => c.maxUses !== null && c.usedCount >= c.maxUses;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg, #f7f8fa)', padding: '0 0 60px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 14px' }}>

        {/* Header */}
        <div style={{ padding: '22px 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', letterSpacing: '-0.04em', fontWeight: 900 }}>
              🏷️ Cupones
            </h1>
            <div style={{ fontSize: '.82rem', color: 'rgba(11,18,32,.45)', fontWeight: 700, marginTop: 3 }}>
              {coupons.length} cupón{coupons.length !== 1 ? 'es' : ''}
            </div>
          </div>
          <button
            onClick={() => { setShowForm(s => !s); setFormError(''); }}
            style={{
              background: showForm ? 'rgba(11,18,32,.08)' : 'var(--primary, #0b5cff)',
              color: showForm ? 'rgba(11,18,32,.7)' : '#fff',
              border: 'none', borderRadius: 12, padding: '10px 18px',
              fontWeight: 900, fontSize: '.9rem', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {showForm ? 'Cancelar' : '+ Nuevo cupón'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#fff1f0', border: '1px solid #fca5a5', borderRadius: 12, padding: '10px 14px', color: '#b91c1c', fontSize: '.88rem', fontWeight: 700, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Formulario nuevo cupón */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            style={{ background: '#fff', borderRadius: 16, padding: '18px 16px', marginBottom: 16, boxShadow: '0 2px 14px rgba(11,18,32,.07)' }}
          >
            <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 14, letterSpacing: '-0.02em' }}>Nuevo cupón</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>Código</label>
                <input
                  style={inputStyle}
                  placeholder="ej: PROMO10"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  autoCapitalize="characters"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select
                    style={inputStyle}
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{form.type === 'percent' ? 'Descuento (%)' : 'Descuento ($)'}</label>
                  <input
                    style={inputStyle}
                    type="number"
                    placeholder={form.type === 'percent' ? 'ej: 15' : 'ej: 5000'}
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Pedido mínimo ($) <span style={{ opacity: .5 }}>opcional</span></label>
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="ej: 45000 — dejar vacío para sin mínimo"
                  value={form.minOrderAmount}
                  onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  min="0"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Usos máximos <span style={{ opacity: .5 }}>opcional</span></label>
                  <input
                    style={inputStyle}
                    type="number"
                    placeholder="vacío = ilimitado"
                    value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    min="1"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Vence el <span style={{ opacity: .5 }}>opcional</span></label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div style={{ marginTop: 10, color: '#b91c1c', fontSize: '.85rem', fontWeight: 700 }}>{formError}</div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 14, width: '100%', background: 'var(--primary, #0b5cff)',
                color: '#fff', border: 'none', borderRadius: 12, padding: '13px',
                fontWeight: 900, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? .65 : 1,
              }}
            >
              {saving ? 'Creando…' : 'Crear cupón'}
            </button>
          </form>
        )}

        {/* Lista de cupones */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(11,18,32,.4)', fontWeight: 700 }}>Cargando…</div>
        ) : coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(11,18,32,.4)', fontWeight: 700 }}>
            No hay cupones. Creá el primero con el botón de arriba.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coupons.map(c => {
              const expired   = isExpired(c);
              const exhausted = isExhausted(c);
              const inactive  = !c.isActive || expired || exhausted;

              return (
                <div
                  key={c._id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '14px 16px',
                    boxShadow: '0 2px 10px rgba(11,18,32,.06)',
                    opacity: inactive ? .65 : 1,
                    borderLeft: `4px solid ${inactive ? '#e2e8f0' : '#22c55e'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '.04em', fontFamily: 'monospace' }}>
                        {c.code}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#166534', marginTop: 2 }}>
                        {c.type === 'percent' ? `${c.value}% de descuento` : `${fmt(c.value)} de descuento`}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'rgba(11,18,32,.45)', fontWeight: 700, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                        {c.minOrderAmount > 0 && <span>Mín. {fmt(c.minOrderAmount)}</span>}
                        <span>Usos: {c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ' (ilimitado)'}</span>
                        {c.expiresAt && <span>Vence: {new Date(c.expiresAt).toLocaleDateString('es-AR')}</span>}
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {!c.isActive  && <Tag color="#64748b">Desactivado</Tag>}
                        {expired      && <Tag color="#dc2626">Expirado</Tag>}
                        {exhausted    && <Tag color="#d97706">Usos agotados</Tag>}
                        {!inactive    && <Tag color="#16a34a">Activo</Tag>}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                      {/* Toggle activo */}
                      <button
                        onClick={() => toggleActive(c)}
                        disabled={toggling === c._id}
                        style={{
                          background: c.isActive ? '#dcfce7' : 'rgba(11,18,32,.07)',
                          color: c.isActive ? '#166534' : 'rgba(11,18,32,.5)',
                          border: 'none', borderRadius: 999, padding: '6px 14px',
                          fontWeight: 900, fontSize: '.82rem', cursor: 'pointer',
                          minWidth: 80, textAlign: 'center',
                        }}
                      >
                        {toggling === c._id ? '…' : c.isActive ? '✅ Activo' : '⭕ Inactivo'}
                      </button>
                      {/* Eliminar */}
                      <button
                        onClick={() => deleteCoupon(c._id)}
                        style={{
                          background: 'transparent', color: '#dc2626',
                          border: 'none', padding: '4px 8px',
                          fontWeight: 800, fontSize: '.78rem', cursor: 'pointer',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{
      background: color + '1a',
      color,
      border: `1px solid ${color}44`,
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: '.72rem',
      fontWeight: 800,
    }}>
      {children}
    </span>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '.78rem',
  fontWeight: 800,
  color: 'rgba(11,18,32,.55)',
  marginBottom: 4,
  letterSpacing: '.02em',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  border: '1.5px solid rgba(11,18,32,.12)',
  borderRadius: 10,
  fontSize: '.92rem',
  fontWeight: 700,
  background: '#fafbfd',
  outline: 'none',
};
