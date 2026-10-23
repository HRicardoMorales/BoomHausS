import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { useConfirm } from "./useConfirm.jsx";
import { useNotice } from "./useNotice.jsx";

function ConfirmHarness({ onResult, options }) {
  const { confirm, confirmDialog } = useConfirm();
  return (
    <>
      <button type="button" onClick={async () => onResult(await confirm(options))}>Borrar</button>
      {confirmDialog}
    </>
  );
}

const opts = { title: "¿Eliminar el cupón?", message: "No se puede deshacer.", confirmLabel: "Eliminar", tone: "danger" };

describe("useConfirm", () => {
  it("abre un diálogo nombrado y descrito, con foco en Cancelar", () => {
    render(<ConfirmHarness onResult={() => {}} options={opts} />);
    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
    const dialog = screen.getByRole("dialog", { name: "¿Eliminar el cupón?" });
    expect(document.getElementById(dialog.getAttribute("aria-describedby")).textContent).toBe("No se puede deshacer.");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancelar" }));
  });

  it("resuelve true al confirmar y cierra el diálogo", async () => {
    const onResult = vi.fn();
    render(<ConfirmHarness onResult={onResult} options={opts} />);
    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resuelve false con Cancelar, con Esc (evento cancel) y con click en el fondo", async () => {
    const onResult = vi.fn();
    render(<ConfirmHarness onResult={onResult} options={opts} />);
    const open = () => fireEvent.click(screen.getByRole("button", { name: "Borrar" }));

    open();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    open();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    open();
    fireEvent.click(screen.getByRole("dialog"));

    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(3));
    expect(onResult.mock.calls.every(([v]) => v === false)).toBe(true);
  });

  it("devuelve el foco al botón que lo abrió", async () => {
    render(<ConfirmHarness onResult={() => {}} options={opts} />);
    const opener = screen.getByRole("button", { name: "Borrar" });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it("acepta un string como título", async () => {
    render(<ConfirmHarness onResult={() => {}} options="¿Seguro?" />);
    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
    expect(screen.getByRole("dialog", { name: "¿Seguro?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeTruthy();
  });
});

function NoticeHarness() {
  const { notify, notice } = useNotice({ duration: 1000 });
  return (
    <>
      <button type="button" onClick={() => notify("No se pudo eliminar", { tone: "error" })}>Fallar</button>
      {notice}
    </>
  );
}

describe("useNotice", () => {
  it("la región viva existe antes del aviso y lo anuncia sin robar el foco", () => {
    render(<NoticeHarness />);
    const region = screen.getByRole("status");
    expect(region.childElementCount).toBe(0);
    const btn = screen.getByRole("button", { name: "Fallar" });
    btn.focus();
    fireEvent.click(btn);
    expect(region.textContent).toContain("No se pudo eliminar");
    expect(document.activeElement).toBe(btn);
  });

  it("se cierra solo al vencer el tiempo y con su botón", () => {
    vi.useFakeTimers();
    try {
      render(<NoticeHarness />);
      fireEvent.click(screen.getByRole("button", { name: "Fallar" }));
      act(() => { vi.advanceTimersByTime(1000); });
      expect(screen.getByRole("status").childElementCount).toBe(0);

      fireEvent.click(screen.getByRole("button", { name: "Fallar" }));
      fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
      expect(screen.getByRole("status").childElementCount).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
