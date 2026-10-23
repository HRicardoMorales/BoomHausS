import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("../../services/api", () => ({ default: { post: vi.fn() } }));
import api from "../../services/api";
import ForgotPassword, { FORGOT_SENT_MESSAGE } from "./ForgotPassword.jsx";
import ResetPassword, { RESET_REDIRECT_MS } from "./ResetPassword.jsx";

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );
}

// Como axios: un Error con `response`, no un objeto pelado.
function httpError(response) {
  return Object.assign(new Error(`HTTP ${response.status}`), { response });
}

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });


// Sin `mockReset` en beforeEach: con él, vitest 4.0 marcaba como fallido
// el test del rechazo aunque el componente lo atrapa. `clearMocks`
// Cada test define su propia implementación del mock.
afterEach(() => vi.useRealTimers());

describe("ForgotPassword", () => {
  it("manda el mismo request y anuncia el envío en role=status", async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    renderAt("/forgot-password");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("¿Olvidaste tu contraseña?");
    type("Email", "ana@mail.com");
    fireEvent.submit(screen.getByLabelText("Email").closest("form"));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain(FORGOT_SENT_MESSAGE));
    expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", { email: "ana@mail.com" });
    expect(screen.getByRole("button", { name: "Reenviar link" })).toBeTruthy();
    // Sin panel lateral: variante de una columna
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("muestra el mensaje del servidor en role=alert", async () => {
    api.post.mockImplementation(async () => {
      throw httpError({ status: 404, data: { message: "No existe ese email" } });
    });
    renderAt("/forgot-password");
    type("Email", "x@mail.com");
    fireEvent.submit(screen.getByLabelText("Email").closest("form"));
    expect((await screen.findByRole("alert")).textContent).toContain("No existe ese email");
    expect(screen.getByRole("status").textContent).toBe("");
  });
});

describe("ResetPassword", () => {
  it("no le pega al backend si la contraseña es corta o no coincide", () => {
    renderAt("/reset-password/abc123");
    type("Nueva contraseña", "123");
    type("Repetir contraseña", "123");
    fireEvent.submit(screen.getByLabelText("Nueva contraseña").closest("form"));
    expect(screen.getByRole("alert").textContent).toContain("al menos 6");

    type("Nueva contraseña", "secreto1");
    type("Repetir contraseña", "secreto2");
    const confirm = screen.getByLabelText("Repetir contraseña");
    expect(confirm.getAttribute("aria-invalid")).toBe("true");
    fireEvent.submit(confirm.closest("form"));
    expect(screen.getByRole("alert").textContent).toContain("no coinciden");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("postea con el token de la URL y redirige al login tras el aviso", async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    renderAt("/reset-password/abc123");
    type("Nueva contraseña", "secreto1");
    type("Repetir contraseña", "secreto1");
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.submit(screen.getByLabelText("Nueva contraseña").closest("form"));
    });
    expect(api.post).toHaveBeenCalledWith("/auth/reset-password/abc123", { password: "secreto1" });
    expect(screen.getByRole("status").textContent).toContain("Contraseña actualizada");
    expect(screen.queryByLabelText("Nueva contraseña")).toBeNull();

    act(() => vi.advanceTimersByTime(RESET_REDIRECT_MS));
    expect(screen.getByTestId("where").textContent).toBe("/login");
  });

  it("el timer no navega si la persona ya se fue con el link", async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    renderAt("/reset-password/abc123");
    type("Nueva contraseña", "secreto1");
    type("Repetir contraseña", "secreto1");
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.submit(screen.getByLabelText("Nueva contraseña").closest("form"));
    });
    act(() => fireEvent.click(screen.getByRole("link", { name: /Ir a iniciar sesión/ })));
    expect(screen.getByTestId("where").textContent).toBe("/login");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("link vencido: mensaje de fallback", async () => {
    api.post.mockImplementation(async () => {
      throw httpError({ status: 400, data: {} });
    });
    renderAt("/reset-password/viejo");
    type("Nueva contraseña", "secreto1");
    type("Repetir contraseña", "secreto1");
    fireEvent.submit(screen.getByLabelText("Nueva contraseña").closest("form"));
    expect((await screen.findByRole("alert")).textContent).toContain("expiró o es inválido");
  });
});
