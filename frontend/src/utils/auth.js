// frontend/src/utils/auth.js
const AUTH_KEY = "auth";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function getStoredAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  const parsed = raw ? safeParse(raw, null) : null;

  const token = parsed?.token || "";
  const user = parsed?.user || null;

  return { token, user };
}

/**
 * Normaliza respuestas típicas del backend (por si token/user vienen anidados)
 */
export function normalizeAuthResponse(data) {
  const token =
    data?.token ??
    data?.accessToken ??
    data?.jwt ??
    data?.data?.token ??
    data?.data?.accessToken ??
    data?.data?.jwt ??
    data?.payload?.token ??
    data?.payload?.accessToken ??
    "";

  const user =
    data?.user ??
    data?.data?.user ??
    data?.payload?.user ??
    data?.data?.data?.user ??
    null;

  return { token, user };
}

/**
 * ✅ Compatible con:
 *   saveAuth(token, user)
 *   saveAuth({ token, user })
 *   saveAuth(res.data) (si trae token/user en algún nivel)
 */
export function saveAuth(tokenOrObj, userMaybe) {
  let token = "";
  let user = null;

  if (typeof tokenOrObj === "string") {
    token = tokenOrObj;
    user = userMaybe ?? null;
  } else if (tokenOrObj && typeof tokenOrObj === "object") {
    const norm = normalizeAuthResponse(tokenOrObj);
    token = norm.token || "";
    user = norm.user ?? null;

    // por si viene tipo { ok:true, data:{token,user} }
    if (!token && tokenOrObj?.data) {
      const norm2 = normalizeAuthResponse(tokenOrObj.data);
      token = norm2.token || "";
      user = norm2.user ?? user;
    }
  }

  if (!token) return false;

  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
  return true;
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/**
 * ✅ Navbar/AdminRoute lo usan.
 * Si no le pasás user, usa el guardado en storage.
 */
export function isAdmin(userArg) {
  const user = userArg ?? getStoredAuth().user;
  const role = user?.role ?? user?.user?.role ?? user?.data?.role;

  return role === "admin" || role === "ADMIN" || user?.isAdmin === true;
}
