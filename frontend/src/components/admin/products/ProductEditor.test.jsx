import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductEditor from './ProductEditor.jsx';
import { EMPTY_FORM } from './productForm.js';

const noop = () => {};
const description = el => (el.getAttribute('aria-describedby') || '').split(' ').map(id => document.getElementById(id)?.textContent).join(' ');
const props = (over = {}) => ({
  form: { ...EMPTY_FORM }, setField: noop, setBundleField: noop, landingInfo: null, hasChanges: false,
  saving: false, deleting: false, error: null, onDismissError: noop, onSubmit: noop, onDelete: noop, onBack: noop,
  ...over,
});

describe('ProductEditor', () => {
  it('cada campo tiene un rótulo asociado (antes eran <span> sueltos)', () => {
    render(<ProductEditor {...props()} />);
    for (const name of ['Nombre del producto', 'Slug (URL)', 'Categoría', 'Descripción corta', 'Precio actual (ARS)', 'Precio tachado (ARS)', 'URLs (1 por línea)']) {
      expect(screen.getByLabelText(name).tagName).toMatch(/INPUT|SELECT|TEXTAREA/);
    }
    expect(description(screen.getByLabelText('Nombre del producto'))).toMatch(/título H1/);
    expect(screen.getByRole('switch', { name: 'Activo' }).checked).toBe(true);
  });

  it('los inputs de cada paquete tienen nombre propio', () => {
    const bundles = [
      { qty: 1, label: 'x1', price: '100', compareAt: '200', popular: false, badge: '', benefit: '' },
      { qty: 2, label: 'x2', price: '180', compareAt: '400', popular: true, badge: 'Ahorro', benefit: 'Envío gratis' },
    ];
    render(<ProductEditor {...props({ form: { ...EMPTY_FORM, bundles } })} />);
    const group = screen.getByRole('group', { name: /Paquete 2/ });
    expect(group.textContent).toContain('★ POPULAR');
    expect(screen.getAllByLabelText('Precio ARS')).toHaveLength(2);
    expect(description(screen.getAllByLabelText('Precio ARS')[0])).toBe('-50% off');
  });

  it('el error de guardado aparece junto al botón, con foco, y se vuelve a enfocar al repetirse', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const { rerender } = render(<ProductEditor {...props({ error: { text: 'Falta el nombre', seq: 1 } })} />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Falta el nombre');
    expect(document.activeElement).toBe(alert);
    expect(alert.nextElementSibling.contains(screen.getByRole('button', { name: 'Crear producto' }))).toBe(true);
    expect(scroll).toHaveBeenCalledTimes(1);

    alert.blur();
    rerender(<ProductEditor {...props({ error: { text: 'Falta el nombre', seq: 2 } })} />);
    expect(document.activeElement).toBe(screen.getByRole('alert'));
    expect(scroll).toHaveBeenCalledTimes(2);
    delete Element.prototype.scrollIntoView;
  });
});
