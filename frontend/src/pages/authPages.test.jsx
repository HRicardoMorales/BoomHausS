import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("../services/api", () => ({ default: { post: vi.fn() } }));
import api from "../services/api";
import Register from "./register.jsx";
import Login from "./login.jsx";

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname}</p>;
}

function renderAt(path, state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );
}

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillRegister({ pass = "secreto1", confirm = pass } = {}) {
  type("Nombre", "Ana");
  type("Email", "ana@mail.com");
  type("Contraseña", pass);
  type("Repetir contraseña", confirm);
}

beforeEach(() => {
  api.post.mockReset();
  localStorage.clear();
});

describe("Register", () => {
  it("labels asociados y botón mostrar/ocultar con aria-pressed", () => {
    renderAt("/register");
    const pass = screen.getByLabelText("Contraseña");
    expect(pass).toHaveProperty("type", "password");
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    fireEvent.click(toggle);
    expect(pass).toHaveProperty("type", "text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("marca el campo repetido como inválido mientras no coincide, sin pegarle al backend", () => {
    renderAt("/register");
    fillRegister({ confirm: "otra-cosa" });
    const confirm = screen.getByLabelText("Repetir contraseña");
    expect(confirm.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(confirm.getAttribute("aria-describedby")).textContent).toBe(
      "Las contraseñas no coinciden."
    );
    fireEvent.submit(confirm.closest("form"));
    expect(screen.getByRole("alert").textContent).toMatch("Las contraseñas no coinciden.");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("409 → mensaje propio aunque el servidor mande otro", async () => {
    api.post.mockRejectedValue({ response: { status: 409, data: { message: "E11000" } } });
    renderAt("/register");
    fillRegister();
    fireEvent.submit(screen.getByLabelText("Nombre").closest("form"));
    expect((await screen.findByRole("alert")).textContent).toMatch("Ese email ya está registrado");
    expect(api.post).toHaveBeenCalledWith("/auth/register", {
      name: "Ana",
      email: "ana@mail.com",
      password: "secreto1",
    });
  });

  it("con token vuelve a la ruta de origen", async () => {
    api.post.mockResolvedValue({ data: { token: "t", user: { email: "ana@mail.com" } } });
    renderAt("/register", { from: { pathname: "/checkout" } });
    fillRegister();
    fireEvent.submit(screen.getByLabelText("Nombre").closest("form"));
    await waitFor(() => expect(screen.getByTestId("where").textContent).toBe("/checkout"));
  });

  it("sin token manda al login", async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    renderAt("/register");
    fillRegister();
    fireEvent.submit(screen.getByLabelText("Nombre").closest("form"));
    expect(await screen.findByRole("heading", { level: 1, name: "Iniciar sesión" })).toBeTruthy();
  });
});

describe("Login", () => {
  it("401 sin mensaje → 'Email o contraseña incorrectos.'", async () => {
    api.post.mockRejectedValue({ response: { status: 401, data: {} } });
    renderAt("/login");
    type("Email", "a@b.com");
    type("Contraseña", "x");
    fireEvent.submit(screen.getByLabelText("Email").closest("form"));
    expect((await screen.findByRole("alert")).textContent).toMatch("Email o contraseña incorrectos.");
  });
});
