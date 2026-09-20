import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "@/test/msw/server";
import { useAuthStore } from "@/lib/auth/store";
import { resetMockRouter } from "@/test/mocks/navigation";

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
