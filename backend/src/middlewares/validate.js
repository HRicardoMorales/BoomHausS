// backend/src/middlewares/validate.js
//
// Valida req.body / req.params / req.query contra schemas de zod antes de
// llegar al controller. Si falla responde 400 con un contrato estable:
//
//   { ok: false, message: 'primer error legible', fields: { email: '...' } }
//
// Si pasa, reemplaza req.body (y req.params) por la versión parseada:
// tipos coercionados, strings recortados y SIN claves desconocidas. Eso es
// lo que corta inyecciones tipo `{ "email": { "$ne": null } }` en login.
// (En Express 5 req.query es un getter, así que el query parseado va a
// req.validatedQuery en lugar de pisarlo.)

function formatIssues(issues) {
  const fields = {};
  for (const issue of issues) {
    const key = issue.path.length ? issue.path.join('.') : '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

function validate(schemas = {}) {
  return function validateRequest(req, res, next) {
    const fields = {};

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        Object.assign(fields, formatIssues(result.error.issues));
        continue;
      }

      if (part === 'query') req.validatedQuery = result.data;
      else req[part] = result.data;
    }

    const keys = Object.keys(fields);
    if (keys.length) {
      return res.status(400).json({
        ok: false,
        message: fields[keys[0]],
        fields,
      });
    }

    return next();
  };
}

module.exports = { validate, formatIssues };
