import { afterEach, describe, expect, it } from "vitest";
import {
  ACCENT_OPTIONS,
  ACCENT_TOKENS,
  APPEARANCE_SCRIPT,
  APPEARANCE_STORAGE_KEY,
  applyAppearance,
  sanitizeColor,
  toneOf,
} from "@/lib/appearance/palettes";

function root() {
  return document.documentElement;
}

afterEach(() => {
  root().removeAttribute("style");
  for (const attribute of ["data-tone-sidebar", "data-tone-topbar", "data-tone-sidebar-header", "data-theme"]) root().removeAttribute(attribute);
  window.localStorage.clear();
});

function luminance(hex: string) {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

describe("toneOf", () => {
  it("asks for light text on dark backgrounds, and dark text on light ones", () => {
    expect(toneOf("#0f1e3d")).toBe("dark");
    expect(toneOf("#000000")).toBe("dark");
    expect(toneOf("#7f1d1d")).toBe("dark");
    expect(toneOf("#ffffff")).toBe("light");
    expect(toneOf("#f1f5f9")).toBe("light");
    expect(toneOf("#dbeafe")).toBe("light");
  });
});

describe("sanitizeColor", () => {
  it("only lets a #rrggbb color through, lowercased", () => {
    expect(sanitizeColor("#0F1E3D")).toBe("#0f1e3d");
    expect(sanitizeColor("red")).toBeNull();
    expect(sanitizeColor("#fff")).toBeNull();
    expect(sanitizeColor("#ffffff; background: url(//evil)")).toBeNull();
    expect(sanitizeColor(null)).toBeNull();
    expect(sanitizeColor(42)).toBeNull();
  });
});

describe("palettes", () => {
  it("offers eleven colors, starting with the original blue", () => {
    expect(ACCENT_OPTIONS).toHaveLength(11);
    expect(ACCENT_OPTIONS[0]).toMatchObject({ id: "blue", swatch: "#2563eb" });
  });

  it("gives every palette a full set of tokens in both themes", () => {
    for (const { id } of ACCENT_OPTIONS) {
      for (const theme of ["light", "blue-dark"] as const) {
        expect(Object.keys(ACCENT_TOKENS[id][theme]).sort()).toEqual(["--grad-1", "--grad-2", "--grad-3", "--grad-end", "--primary", "--primary-hover"]);
      }
    }
  });

  it("keeps the dark theme's primary readable against its dark text and its dark surface", () => {
    for (const { id } of ACCENT_OPTIONS) {
      const primary = ACCENT_TOKENS[id]["blue-dark"]["--primary"];

      expect(contrast(primary, "#0a1224"), `${id} under primary-foreground`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(primary, "#101c34"), `${id} on surface`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps white text readable on every primary color of the light theme", () => {
    for (const { id } of ACCENT_OPTIONS) {
      expect(contrast(ACCENT_TOKENS[id].light["--primary"], "#ffffff"), `${id} primary`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("applyAppearance", () => {
  const apply = (state: Parameters<typeof applyAppearance>[1], theme = "light") => applyAppearance(root(), state, theme, ACCENT_TOKENS, toneOf);

  it("leaves the stylesheet's own blue alone", () => {
    apply({ accent: "blue" });

    expect(root().style.getPropertyValue("--primary")).toBe("");
  });

  it("sets the tokens of the chosen color for the current theme", () => {
    apply({ accent: "emerald" }, "light");
    expect(root().style.getPropertyValue("--primary")).toBe(ACCENT_TOKENS.emerald.light["--primary"]);

    apply({ accent: "emerald" }, "blue-dark");
    expect(root().style.getPropertyValue("--primary")).toBe(ACCENT_TOKENS.emerald["blue-dark"]["--primary"]);
  });

  it("removes the tokens when going back to blue", () => {
    apply({ accent: "rose" });
    apply({ accent: "blue" });

    expect(root().style.getPropertyValue("--primary")).toBe("");
    expect(root().style.getPropertyValue("--grad-1")).toBe("");
  });

  it("sets each bar's background with the tone that keeps its text readable", () => {
    apply({ sidebarBg: "#0f1e3d", topbarBg: "#ffffff", sidebarHeaderBg: "#1e293b" });

    expect(root().style.getPropertyValue("--sidebar-bg")).toBe("#0f1e3d");
    expect(root().getAttribute("data-tone-sidebar")).toBe("dark");
    expect(root().style.getPropertyValue("--topbar-bg")).toBe("#ffffff");
    expect(root().getAttribute("data-tone-topbar")).toBe("light");
    expect(root().getAttribute("data-tone-sidebar-header")).toBe("dark");
  });

  it("clears a background that is reset to the theme's", () => {
    apply({ sidebarBg: "#0f1e3d" });
    apply({ sidebarBg: null });

    expect(root().style.getPropertyValue("--sidebar-bg")).toBe("");
    expect(root().hasAttribute("data-tone-sidebar")).toBe(false);
  });

  it("ignores a background that is not a plain hex color", () => {
    apply({ topbarBg: "red; background: url(x)" });

    expect(root().style.getPropertyValue("--topbar-bg")).toBe("");
  });
});

describe("APPEARANCE_SCRIPT (applied before the first render)", () => {
  function runScript() {
    // eslint-disable-next-line no-new-func
    new Function(APPEARANCE_SCRIPT)();
  }

  it("applies the saved color and backgrounds from localStorage", () => {
    root().setAttribute("data-theme", "light");
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ state: { accent: "violet", sidebarBg: "#0f1e3d" }, version: 0 }));

    runScript();

    expect(root().style.getPropertyValue("--primary")).toBe(ACCENT_TOKENS.violet.light["--primary"]);
    expect(root().style.getPropertyValue("--sidebar-bg")).toBe("#0f1e3d");
    expect(root().getAttribute("data-tone-sidebar")).toBe("dark");
  });

  it("uses the dark tokens when the page is in the dark theme", () => {
    root().setAttribute("data-theme", "blue-dark");
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ state: { accent: "violet" } }));

    runScript();

    expect(root().style.getPropertyValue("--primary")).toBe(ACCENT_TOKENS.violet["blue-dark"]["--primary"]);
  });

  it("does nothing, and does not throw, without saved settings or with corrupted ones", () => {
    expect(runScript).not.toThrow();

    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, "{ not json");
    expect(runScript).not.toThrow();
    expect(root().style.getPropertyValue("--primary")).toBe("");
  });
});
