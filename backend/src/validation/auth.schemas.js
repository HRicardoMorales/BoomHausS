// backend/src/validation/auth.schemas.js
//
// Contratos de entrada de /api/auth. Los mensajes son los que ve el
// usuario (el front muestra `message`), por eso van en español.

const { z } = require('zod');

// bcrypt solo usa los primeros 72 bytes: más largo no suma seguridad y
// abre la puerta a requests caros.
const PASSWORD_MAX = 72;

const email = z
  .string({ error: 'El email es obligatorio.' })
  .trim()
  .toLowerCase()
  .min(1, 'El email es obligatorio.')
  .max(254, 'El email es demasiado largo.')
  .pipe(z.email('Ingresá un email válido.'));

const newPassword = z
  .string({ error: 'La contraseña es obligatoria.' })
  .min(6, 'La contraseña debe tener al menos 6 caracteres.')
  .max(PASSWORD_MAX, `La contraseña puede tener hasta ${PASSWORD_MAX} caracteres.`);

// En login no exigimos el mínimo: hay cuentas viejas y el mensaje
// tiene que seguir siendo "Credenciales inválidas".
const anyPassword = z
  .string({ error: 'La contraseña es obligatoria.' })
  .min(1, 'La contraseña es obligatoria.')
  .max(PASSWORD_MAX, 'Credenciales inválidas.');

const loginBody = z.object({ email, password: anyPassword });

const registerBody = z.object({
  name: z
    .string({ error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(80, 'El nombre puede tener hasta 80 caracteres.'),
  email,
  password: newPassword,
});

const forgotPasswordBody = z.object({ email });

// El token lo genera crypto.randomBytes(20).toString('hex') → 40 hex.
const resetPasswordParams = z.object({
  token: z.string().regex(/^[a-f0-9]{40}$/i, 'El enlace es inválido o ha expirado.'),
});

const resetPasswordBody = z.object({ password: newPassword });

module.exports = {
  loginBody,
  registerBody,
  forgotPasswordBody,
  resetPasswordParams,
  resetPasswordBody,
  PASSWORD_MAX,
};
