// Textos del hero de la ficha (`subtitle` / `highlights`) editables desde el
// admin: normalización en el controller y topes del modelo, sin Mongo.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('./setup');
const Product = require('../src/models/Product');
const { normalizeHighlights, normalizeSubtitle } = require('../src/controllers/products.controller');

describe('normalizeHighlights', () => {
  it('recorta, descarta vacíos y no-strings, y topea en 6 × 80', () => {
    const long = 'x'.repeat(100);
    const out = normalizeHighlights(['  Uno ', '', '   ', 42, { $ne: 1 }, 'Dos', long, 'a', 'b', 'c', 'd']);
    assert.deepEqual(out.slice(0, 2), ['Uno', 'Dos']);
    assert.equal(out[2].length, 80);
    assert.equal(out.length, 6);
  });

  it('cualquier cosa que no sea array → []', () => {
    for (const v of [undefined, null, 'texto', { 0: 'a' }, 3]) {
      assert.deepEqual(normalizeHighlights(v), []);
    }
  });
});

describe('normalizeSubtitle', () => {
  it('string recortado y topeado; el resto → ""', () => {
    assert.equal(normalizeSubtitle('  Hola  '), 'Hola');
    assert.equal(normalizeSubtitle('y'.repeat(200)).length, 120);
    assert.equal(normalizeSubtitle({ $gt: '' }), '');
    assert.equal(normalizeSubtitle(undefined), '');
  });
});

describe('Product schema', () => {
  it('por defecto subtitle "" y highlights []', () => {
    const p = new Product({ name: 'Test', price: 100 });
    assert.equal(p.subtitle, '');
    assert.deepEqual([...p.highlights], []);
    assert.equal(p.validateSync(), undefined);
  });

  it('rechaza más de 6 highlights y highlights de más de 80 caracteres', () => {
    const many = new Product({ name: 'T', price: 1, highlights: ['1', '2', '3', '4', '5', '6', '7'] });
    assert.ok(many.validateSync()?.errors?.highlights);
    const long = new Product({ name: 'T', price: 1, highlights: ['z'.repeat(81)] });
    assert.ok(long.validateSync());
  });
});
