import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "@/test/msw/server";
import { useAuthStore } from "@/lib/auth/store";
import { resetMockRouter } from "@/test/mocks/navigation";

// Les écrans enchaînent plusieurs appels API (années, puis liste, puis bilan) : sur une machine chargée,
// la seconde par défaut de findBy* ne suffit pas toujours et rend les tests intermittents.
configure({ asyncUtilTimeout: 5000 });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  // Chaque test part d'une session vide : la persistance zustand survivrait
  // sinon d'un test de connexion au suivant via le localStorage partage.
  useAuthStore.getState().clear();
  window.localStorage.clear();
  resetMockRouter();
});

afterAll(() => server.close());

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  const { mockRouter } = await import("@/test/mocks/navigation");

  return {
    ...actual,
    useRouter: () => mockRouter,
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
  };
});
