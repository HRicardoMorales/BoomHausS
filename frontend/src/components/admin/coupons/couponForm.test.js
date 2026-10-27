import { describe, expect, it } from 'vitest';
import {
  EMPTY_FORM, couponStatus, couponSummary, describeDiscount, expiryEndOfDay,
  formatExpiry, normalizeCode, todayAR, usesLabel, validateCouponForm,
} from './couponForm.js';
import { moneyARS } from '../../../utils/pricing.js';

// 27/10/2026 02:00 UTC = 26/10 23:00 en Argentina.
const NOW = new Date('2026-10-27T02:00:00Z');
const form = (over) => ({ ...EMPTY_FORM, code: 'PROMO10', value: '10', ...over });

describe('normalizeCode', () => {
  it('pasa a mayúsculas y saca espacios, tildes y símbolos', () => {
    expect(normalizeCode(' promo 10% ')).toBe('PROMO10');
    expect(normalizeCode('verano-ñandú_2')).toBe('VERANO-NANDU_2');
    expect(normalizeCode(null)).toBe('');
  });
  it('corta en 30 caracteres', () => {
    expect(normalizeCode('A'.repeat(40))).toHaveLength(30);
  });
});

describe('todayAR', () => {
  it('usa el día de Argentina, no el de UTC', () => {
    expect(todayAR(NOW)).toBe('2026-10-26');
  });
});

describe('validateCouponForm', () => {
  it('arma el payload normalizado', () => {
    expect(validateCouponForm(form({ code: 'promo 10', minOrderAmount: '45000', maxUses: '5', expiresAt: '2026-11-01' }), NOW)).toEqual({
      ok: true,
      payload: { code: 'PROMO10', type: 'percent', value: 10, minOrderAmount: 45000, maxUses: 5, expiresAt: '2026-11-01T23:59:59.999-03:00' },
    });
  });

  it('opcionales vacíos → sin mínimo, ilimitado y sin vencimiento', () => {
    const r = validateCouponForm(form(), NOW);
    expect(r.payload).toMatchObject({ minOrderAmount: 0, maxUses: null, expiresAt: null });
  });

  it.each([
    [{ code: '' }, 'code'],
    [{ code: '%%' }, 'code'],
    [{ code: 'AB' }, 'code'],
    [{ value: '' }, 'value'],
    [{ value: '0' }, 'value'],
    [{ value: '-5' }, 'value'],
    [{ value: '101' }, 'value'],
    [{ value: '12.5' }, 'value'],
    [{ value: 'abc' }, 'value'],
    [{ type: 'fixed', value: '99.9' }, 'value'],
    [{ minOrderAmount: '-1' }, 'minOrderAmount'],
    [{ maxUses: '0' }, 'maxUses'],
    [{ maxUses: '1.5' }, 'maxUses'],
    [{ expiresAt: '2026-02-30' }, 'expiresAt'],
    [{ expiresAt: '2026-10-25' }, 'expiresAt'],
  ])('rechaza %j en el campo %s', (over, field) => {
    const r = validateCouponForm(form(over), NOW);
    expect(r.ok).toBe(false);
    expect(r.field).toBe(field);
    expect(r.message).toBeTruthy();
  });

  it('% entre 1 y 100 inclusive', () => {
    expect(validateCouponForm(form({ value: '1' }), NOW).ok).toBe(true);
    expect(validateCouponForm(form({ value: '100' }), NOW).ok).toBe(true);
  });

  it('monto fijo puede pasar de 100', () => {
    expect(validateCouponForm(form({ type: 'fixed', value: '5000' }), NOW).payload.value).toBe(5000);
  });

  it('un monto fijo que cubre el pedido mínimo regalaría el pedido', () => {
    const r = validateCouponForm(form({ type: 'fixed', value: '50000', minOrderAmount: '45000' }), NOW);
    expect(r).toMatchObject({ ok: false, field: 'value' });
  });

  it('vence hoy (en Argentina) es válido aunque en UTC ya sea mañana', () => {
    expect(validateCouponForm(form({ expiresAt: '2026-10-26' }), NOW).ok).toBe(true);
  });
});

describe('expiryEndOfDay', () => {
  it('el cupón sirve hasta el final del día elegido en Argentina', () => {
    const end = new Date(expiryEndOfDay('2026-11-01'));
    expect(end.toISOString()).toBe('2026-11-02T02:59:59.999Z');
    expect(new Date('2026-11-01T23:30:00-03:00') > end).toBe(false);
    expect(new Date('2026-11-02T00:00:00-03:00') > end).toBe(true);
  });
});

describe('couponStatus', () => {
  const base = { isActive: true, usedCount: 0, maxUses: null, expiresAt: null };
  it('activo sin límites', () => {
    expect(couponStatus(base, NOW)).toEqual({ live: true, reasons: [] });
  });
  it('junta todos los motivos', () => {
    const c = { ...base, isActive: false, expiresAt: '2026-10-01T00:00:00Z', maxUses: 3, usedCount: 3 };
    expect(couponStatus(c, NOW).reasons).toEqual(['disabled', 'expired', 'exhausted']);
  });
  it('maxUses ausente (undefined) es ilimitado, no agotado', () => {
    expect(couponStatus({ isActive: true, usedCount: 999 }, NOW).live).toBe(true);
  });
});

describe('textos', () => {
  it('descuento y usos', () => {
    expect(describeDiscount({ type: 'percent', value: 15 })).toBe('15 % de descuento');
    expect(describeDiscount({ type: 'fixed', value: 5000 })).toBe(`${moneyARS(5000)} de descuento`);
    expect(usesLabel({ usedCount: 2, maxUses: 10 })).toBe('2 de 10 usos');
    expect(usesLabel({ usedCount: 2, maxUses: null })).toBe('2 usos · sin límite');
  });

  it('vencimiento: los cupones viejos (00:00 UTC) muestran el día elegido', () => {
    expect(formatExpiry('2026-11-01T00:00:00.000Z')).toMatch(/^1 .*nov.* 2026$/);
    expect(formatExpiry(expiryEndOfDay('2026-11-01'))).toMatch(/^1 .*nov.* 2026$/);
    expect(formatExpiry(null)).toBe('');
    expect(formatExpiry('basura')).toBe('');
  });

  it('resumen', () => {
    const list = [{ isActive: true }, { isActive: false }, { isActive: true, maxUses: 1, usedCount: 1 }];
    expect(couponSummary(list, NOW)).toEqual({ total: 3, live: 1 });
    expect(couponSummary(undefined, NOW)).toEqual({ total: 0, live: 0 });
  });
});
