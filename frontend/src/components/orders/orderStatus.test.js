import { describe, expect, it } from "vitest";
import { formatOrderDate, headlineStep, isPaymentSettled, isProofVerified, orderSteps, shippingMethodLabel, shortRef } from "./orderStatus";

const states = (o) => Object.fromEntries(orderSteps(o).map((s) => [s.key, s.state]));

describe("orderSteps", () => {
  it("pedido nuevo: pago en curso, envío esperando", () => {
    expect(states({})).toEqual({ order: "done", payment: "current", shipping: "waiting" });
  });

  it("comprobante subido → revisando", () => {
    const steps = orderSteps({ paymentStatus: "proof_uploaded" });
    expect(steps[1]).toMatchObject({ state: "current", hint: "Revisando comprobante" });
  });

  it.each(["approved", "confirmed", "APPROVED"])("pago %s → preparando envío", (paymentStatus) => {
    expect(states({ paymentStatus })).toEqual({ order: "done", payment: "done", shipping: "current" });
  });

  it("comprobante verificado cuenta como pagado", () => {
    expect(states({ paymentProofVerified: true }).payment).toBe("done");
  });

  it("rechazado frena el pago y es el titular del pedido", () => {
    const steps = orderSteps({ paymentStatus: "rejected" });
    expect(steps[1].state).toBe("stopped");
    expect(headlineStep(steps).key).toBe("payment");
  });

  it("entregado: todo hecho, el titular es el último hito", () => {
    const steps = orderSteps({ paymentStatus: "approved", shippingStatus: "delivered" });
    expect(steps.every((s) => s.state === "done")).toBe(true);
    expect(headlineStep(steps).key).toBe("shipping");
  });
});

describe("helpers", () => {
  it("isProofVerified sigue la misma regla que el backend", () => {
    expect(isProofVerified({ paymentStatus: "Confirmed" })).toBe(true);
    expect(isProofVerified({ paymentProofVerified: 1 })).toBe(true);
    expect(isProofVerified({ paymentStatus: "approved" })).toBe(false);
    expect(isProofVerified(null)).toBe(false);
  });

  it("isPaymentSettled: verificado o aprobado ya no deja subir comprobante", () => {
    expect(isPaymentSettled({ paymentStatus: "approved" })).toBe(true);
    expect(isPaymentSettled({ paymentStatus: "Confirmed" })).toBe(true);
    expect(isPaymentSettled({ paymentProofVerified: true })).toBe(true);
    expect(isPaymentSettled({ paymentStatus: "proof_uploaded", paymentProofUrl: "x" })).toBe(false);
    expect(isPaymentSettled({ paymentStatus: "pending" })).toBe(false);
    expect(isPaymentSettled(undefined)).toBe(false);
  });

  it("shortRef toma los últimos 8 caracteres en mayúscula", () => {
    expect(shortRef("65f1a2b3c4d5e6f73f9a21c0")).toBe("#3F9A21C0");
    expect(shortRef()).toBe("#");
  });

  it("shippingMethodLabel traduce o humaniza", () => {
    expect(shippingMethodLabel("domicilio")).toBe("Envío a domicilio");
    expect(shippingMethodLabel("retiro_en_local")).toBe("retiro en local");
    expect(shippingMethodLabel()).toBe("A coordinar");
  });

  it("formatOrderDate no rompe con fechas inválidas", () => {
    expect(formatOrderDate("no-fecha")).toEqual({ date: "—", time: "" });
    expect(formatOrderDate(null)).toEqual({ date: "—", time: "" });
    expect(formatOrderDate("2026-03-05T15:04:00Z").date).toMatch(/2026/);
  });
});
