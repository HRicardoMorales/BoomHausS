// Unit del middleware validate() con req/res falsos: contrato del 400 y
// reemplazo de req.body/params por la versión parseada.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');
const { validate, formatIssues } = require('../src/middlewares/validate');

function run(mw, req) {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  let nextCalled = false;
  mw(req, res, () => { nextCalled = true; });
  return { res, nextCalled };
}

describe('validate()', () => {
  const mw = validate({
    params: z.object({ slug: z.string().min(3, 'slug corto') }),
    query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
    body: z.object({ name: z.string().trim().min(1, 'nombre requerido') }),
  });

  it('si todo es válido llama a next y deja el input parseado', () => {
    const req = { params: { slug: 'abc' }, query: { page: '2' }, body: { name: '  Ana  ', isAdmin: true } };
    const { res, nextCalled } = run(mw, req);

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(req.body, { name: 'Ana' }); // sin claves desconocidas
    assert.deepEqual(req.validatedQuery, { page: 2 });
    assert.deepEqual(req.query, { page: '2' }); // Express 5: req.query no se pisa
  });

  it('junta errores de params, query y body en un solo 400', () => {
    const { res, nextCalled } = run(mw, { params: { slug: 'a' }, query: { page: '0' }, body: {} });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(Object.keys(res.body.fields).sort(), ['name', 'page', 'slug']);
    assert.equal(res.body.message, 'slug corto'); // el primero, en orden params → query → body
  });

  it('body ausente se valida como {} (no revienta)', () => {
    const { res } = run(validate({ body: z.object({ a: z.string() }) }), {});
    assert.equal(res.statusCode, 400);
    assert.ok('a' in res.body.fields);
  });
});

describe('formatIssues()', () => {
  it('usa la ruta con puntos, "_" para la raíz y se queda con el primer mensaje por campo', () => {
    const fields = formatIssues([
      { path: ['items', 0, 'qty'], message: 'cantidad inválida' },
      { path: ['items', 0, 'qty'], message: 'otro error' },
      { path: [], message: 'objeto inválido' },
    ]);
    assert.deepEqual(fields, { 'items.0.qty': 'cantidad inválida', _: 'objeto inválido' });
  });
});
