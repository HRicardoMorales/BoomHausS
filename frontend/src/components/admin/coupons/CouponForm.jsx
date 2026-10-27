// Formulario de alta de cupón. Valida con `validateCouponForm` (puro) antes de
// llamar a `onCreate`; el error queda junto al campo que lo causó, con foco.
import { useId, useRef, useState } from 'react';
import { CODE_MAX, EMPTY_FORM, normalizeCode, todayAR, validateCouponForm } from './couponForm.js';

function Field({ name, label, optional, hint, error, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={`ac-field${error ? ' ac-field--error' : ''}`} data-field={name}>
      <label className="ac-lbl" htmlFor={id}>
        {label}{optional && <span className="ac-opt">opcional</span>}
      </label>
      {children({
        id,
        name,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [errId, hintId].filter(Boolean).join(' ') || undefined,
      })}
      {error && <p id={errId} className="ac-err">{error}</p>}
      {hint && <p id={hintId} className="ac-hint">{hint}</p>}
    </div>
  );
}

export default function CouponForm({ onCreate, creating, onCancel }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }));
  const [invalid, setInvalid] = useState(null); // { field, message }
  const [serverError, setServerError] = useState('');
  const formRef = useRef(null);

  const set = (key) => (e) => {
    const value = key === 'code' ? normalizeCode(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (invalid?.field === key) setInvalid(null);
    setServerError('');
  };
  const err = (key) => (invalid?.field === key ? invalid.message : '');

  async function submit(e) {
    e.preventDefault();
    const r = validateCouponForm(form);
    if (!r.ok) {
      setInvalid(r);
      formRef.current?.querySelector(`[data-field="${r.field}"] :is(input,select)`)?.focus();
      return;
    }
    setInvalid(null);
    const res = await onCreate(r.payload);
    if (res.ok) {
      setForm({ ...EMPTY_FORM });
      setServerError('');
    } else {
      setServerError(res.message);
    }
  }

  const percent = form.type === 'percent';

  return (
    <form ref={formRef} className="ac-form" onSubmit={submit} noValidate aria-labelledby="ac-form-title">
      <div className="ac-form-head">
        <h2 id="ac-form-title" className="ac-h2">Nuevo cupón</h2>
        <button type="button" className="ac-link" onClick={onCancel}>Cerrar</button>
      </div>

      <Field name="code" label="Código" error={err('code')} hint="Mayúsculas, números, guion. Así lo escribe el cliente en el checkout.">
        {(p) => (
          <input
            {...p}
            className="ac-inp ac-inp--code"
            placeholder="PROMO10"
            value={form.code}
            onChange={set('code')}
            maxLength={CODE_MAX}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </Field>

      <div className="ac-row">
        <fieldset className="ac-seg">
          <legend className="ac-lbl">Tipo</legend>
          <div className="ac-seg-opts">
            {[['percent', '%  Porcentaje'], ['fixed', '$  Monto fijo']].map(([value, text]) => (
              <label key={value} className="ac-seg-opt">
                <input type="radio" name="type" value={value} checked={form.type === value} onChange={set('type')} />
                <span>{text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field name="value" label={percent ? 'Descuento (%)' : 'Descuento ($)'} error={err('value')}>
          {(p) => (
            <div className="ac-affix" data-affix={percent ? '%' : '$'} data-side={percent ? 'end' : 'start'}>
              <input
                {...p}
                className="ac-inp"
                type="number"
                inputMode="numeric"
                placeholder={percent ? '15' : '5000'}
                value={form.value}
                onChange={set('value')}
                min="1"
                max={percent ? 100 : undefined}
                step="1"
              />
            </div>
          )}
        </Field>
      </div>

      <div className="ac-row">
        <Field name="minOrderAmount" label="Pedido mínimo ($)" optional error={err('minOrderAmount')}>
          {(p) => (
            <input {...p} className="ac-inp" type="number" inputMode="numeric" placeholder="Sin mínimo" value={form.minOrderAmount} onChange={set('minOrderAmount')} min="0" step="1" />
          )}
        </Field>
        <Field name="maxUses" label="Usos máximos" optional error={err('maxUses')}>
          {(p) => (
            <input {...p} className="ac-inp" type="number" inputMode="numeric" placeholder="Ilimitado" value={form.maxUses} onChange={set('maxUses')} min="1" step="1" />
          )}
        </Field>
      </div>

      <Field name="expiresAt" label="Vence el" optional error={err('expiresAt')} hint="Sirve hasta las 23:59 de ese día (hora de Argentina).">
        {(p) => (
          <input {...p} className="ac-inp" type="date" value={form.expiresAt} onChange={set('expiresAt')} min={todayAR()} />
        )}
      </Field>

      <div className="ac-server-err" role="alert">{serverError}</div>

      <button type="submit" className="ac-submit" disabled={creating} aria-busy={creating || undefined}>
        {creating ? 'Creando…' : 'Crear cupón'}
      </button>
    </form>
  );
}
