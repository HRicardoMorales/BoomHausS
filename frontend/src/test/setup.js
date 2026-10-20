import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Cada test arranca con el DOM y el storage limpios.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
