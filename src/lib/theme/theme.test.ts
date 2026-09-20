import { describe, expect, it } from "vitest";
import { NO_FLASH_SCRIPT, THEME_STORAGE_KEY, parsePreference, resolveTheme } from "@/lib/theme/theme";

describe("parsePreference", () => {
  it("accepts the two themes", () => {
    expect(parsePreference("light")).toBe("light");
    expect(parsePreference("blue-dark")).toBe("blue-dark");
  });

  it("falls back to the system preference for anything else", () => {
    expect(parsePreference(null)).toBe("system");
    expect(parsePreference("")).toBe("system");
    expect(parsePreference("dark")).toBe("system");
    expect(parsePreference("system")).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("keeps an explicit choice whatever the operating system prefers", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("blue-dark", false)).toBe("blue-dark");
  });

  it("follows the operating system when the preference is automatic", () => {
    expect(resolveTheme("system", true)).toBe("blue-dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("no-flash script", () => {
  function run(stored: string | null, prefersDark: boolean) {
    document.documentElement.removeAttribute("data-theme");
    if (stored === null) window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, stored);

    window.matchMedia = (() => ({ matches: prefersDark })) as unknown as typeof window.matchMedia;
    new Function(NO_FLASH_SCRIPT)();

    return document.documentElement.getAttribute("data-theme");
  }

  // Le script tourne dans <head> avant React : il doit donner le meme verdict que resolveTheme.
  it.each([
    ["light", true, "light"],
    ["blue-dark", false, "blue-dark"],
    [null, true, "blue-dark"],
    [null, false, "light"],
    ["n-importe-quoi", true, "blue-dark"],
  ] as const)("stored=%s prefersDark=%s -> %s", (stored, prefersDark, expected) => {
    expect(run(stored, prefersDark)).toBe(expected);
    expect(run(stored, prefersDark)).toBe(resolveTheme(parsePreference(stored), prefersDark));
  });
});
