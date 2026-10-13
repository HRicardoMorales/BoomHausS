// Alta al newsletter de la home.
//
// MOCK: todavía no hay proveedor (Brevo, Mailchimp, Klaviyo…) ni endpoint en
// el backend, así que esto valida y simula la latencia de red. La UI depende
// solo de esta firma `subscribe(email) → Promise<{ ok: true }>` (o rechaza
// con un Error con mensaje para el usuario): conectar el proveedor real es
// cambiar este archivo. Ver "Pendientes para Rick" en NIGHTLY.md.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribe(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(value)) {
    throw new Error("Revisá el mail: parece que le falta algo.");
  }
  await new Promise((r) => setTimeout(r, 650));
  return { ok: true, email: value };
}
