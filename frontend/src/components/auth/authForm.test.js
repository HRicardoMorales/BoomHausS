import { describe, it, expect } from "vitest";
import { authErrorMessage, authFromResponse, redirectTarget, registerError } from "./authForm";

const axiosErr = (status, data) => ({ response: { status, data } });

describe("authFromResponse", () => {
  it("lee el token plano o envuelto en data", () => {
    expect(authFromResponse({ token: "a", user: { id: 1 } })).toEqual({ token: "a", user: { id: 1 } });
    expect(authFromResponse({ data: { token: "b", user: null } }).token).toBe("b");
  });
  it("sin token devuelve token vacío (saveAuth lo rechaza)", () => {
    expect(authFromResponse({ ok: true })).toEqual({ token: "", user: null });
    expect(authFromResponse(undefined)).toEqual({ token: "", user: null });
  });
});

describe("redirectTarget", () => {
  it("vuelve a la ruta protegida que mandó al login", () => {
    expect(redirectTarget({ from: { pathname: "/checkout" } })).toBe("/checkout");
  });
  it("sin origen va a Mis pedidos", () => {
    expect(redirectTarget(null)).toBe("/my-orders");
    expect(redirectTarget({ from: {} })).toBe("/my-orders");
  });
});

describe("authErrorMessage", () => {
  it("prefiere el mensaje del servidor, después error", () => {
    expect(authErrorMessage(axiosErr(400, { message: "Email inválido" }), "x")).toBe("Email inválido");
    expect(authErrorMessage(axiosErr(500, { error: "Falla" }), "x")).toBe("Falla");
  });
  it("fallbackByStatus solo aplica si el servidor no mandó texto (401 del login)", () => {
    const opts = { fallbackByStatus: { 401: "Email o contraseña incorrectos." } };
    expect(authErrorMessage(axiosErr(401, {}), "x", opts)).toBe("Email o contraseña incorrectos.");
    expect(authErrorMessage(axiosErr(401, { message: "Cuenta bloqueada" }), "x", opts)).toBe("Cuenta bloqueada");
  });
  it("byStatus pisa al servidor (409 del registro)", () => {
    const opts = { byStatus: { 409: "Ese email ya está registrado." } };
    expect(authErrorMessage(axiosErr(409, { message: "E11000 duplicate key" }), "x", opts)).toBe("Ese email ya está registrado.");
  });
  it("sin respuesta (red caída) o con mensaje no-string usa el fallback", () => {
    expect(authErrorMessage(new Error("Network Error"), "Error al iniciar sesión.")).toBe("Error al iniciar sesión.");
    expect(authErrorMessage(axiosErr(400, { message: { $ne: 1 } }), "fb")).toBe("fb");
  });
});

describe("registerError", () => {
  it("exige 6 caracteres y que coincidan", () => {
    expect(registerError({ password: "12345", confirm: "12345" })).toMatch(/al menos 6/);
    expect(registerError({ password: "123456", confirm: "123457" })).toBe("Las contraseñas no coinciden.");
    expect(registerError({ password: "123456", confirm: "123456" })).toBe("");
  });
});
