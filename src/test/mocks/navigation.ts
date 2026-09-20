import { vi } from "vitest";

/**
 * Fonctions de navigation partagees par tous les rendus d'un meme test :
 * next/navigation est mocke une seule fois (voir vitest.setup.ts) et doit
 * rendre le meme objet `router` a chaque appel de useRouter(), sans quoi un
 * re-rendu invaliderait la reference que le test vient d'espionner.
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export function resetMockRouter() {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockRouter.refresh.mockClear();
  mockRouter.prefetch.mockClear();
}
