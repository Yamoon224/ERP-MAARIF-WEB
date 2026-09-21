import { beforeEach, describe, expect, it } from "vitest";
import { APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE } from "@/lib/appearance/palettes";
import { useAppearanceStore } from "@/lib/appearance/store";

describe("useAppearanceStore", () => {
  beforeEach(() => useAppearanceStore.setState({ ...DEFAULT_APPEARANCE }));

  it("starts on the original blue, with a vertical menu and the theme's own backgrounds", () => {
    expect(useAppearanceStore.getState()).toMatchObject(DEFAULT_APPEARANCE);
  });

  it("changes the color and the layout", () => {
    useAppearanceStore.getState().setAccent("teal");
    useAppearanceStore.getState().setNavLayout("horizontal");

    expect(useAppearanceStore.getState()).toMatchObject({ accent: "teal", navLayout: "horizontal" });
  });

  it("falls back to the defaults on an unknown color or layout", () => {
    useAppearanceStore.getState().setAccent("fuchsia" as never);
    useAppearanceStore.getState().setNavLayout("diagonal" as never);

    expect(useAppearanceStore.getState()).toMatchObject({ accent: "blue", navLayout: "vertical" });
  });

  it("only keeps a #rrggbb background, lowercased", () => {
    const { setBackground } = useAppearanceStore.getState();

    setBackground("topbar", "#0F1E3D");
    setBackground("sidebar", "url(javascript:alert(1))");

    expect(useAppearanceStore.getState().topbarBg).toBe("#0f1e3d");
    expect(useAppearanceStore.getState().sidebarBg).toBeNull();
  });

  it("gives a background back to the theme with null, and resets everything", () => {
    const store = useAppearanceStore.getState();
    store.setAccent("rose");
    store.setBackground("topbar", "#0f1e3d");

    store.setBackground("topbar", null);
    expect(useAppearanceStore.getState().topbarBg).toBeNull();

    store.reset();
    expect(useAppearanceStore.getState()).toMatchObject(DEFAULT_APPEARANCE);
  });

  it("writes to the device as it changes", () => {
    useAppearanceStore.getState().setAccent("orange");

    expect(JSON.parse(window.localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? "{}").state).toMatchObject({ accent: "orange" });
  });

  it("reads what was saved, and never trusts a corrupted value", async () => {
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ state: { accent: "fuchsia", navLayout: "horizontal", topbarBg: "#123456", sidebarBg: "javascript:1" }, version: 0 }),
    );

    await useAppearanceStore.persist.rehydrate();

    expect(useAppearanceStore.getState()).toMatchObject({ accent: "blue", navLayout: "horizontal", topbarBg: "#123456", sidebarBg: null });
  });
});
