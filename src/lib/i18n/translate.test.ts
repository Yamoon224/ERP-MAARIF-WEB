import { describe, expect, it } from "vitest";
import { EN_MESSAGES } from "@/lib/i18n/messages.en";
import { isLocale, translate } from "@/lib/i18n/translate";

describe("translate", () => {
  it("returns the French text as is in French", () => {
    expect(translate("fr", "Tableau de bord")).toBe("Tableau de bord");
  });

  it("translates a known text to American English", () => {
    expect(translate("en", "Tableau de bord")).toBe("Dashboard");
    expect(translate("en", "Déconnexion")).toBe("Log out");
  });

  it("falls back to the French text when there is no translation yet", () => {
    expect(translate("en", "Un texte que personne n'a traduit")).toBe("Un texte que personne n'a traduit");
  });

  it("fills in {placeholders}", () => {
    expect(translate("fr", "Le compte de {name} a été créé.", { name: "Aïssatou" })).toBe("Le compte de Aïssatou a été créé.");
    expect(translate("en", "Le compte de {name} a été créé.", { name: "Aïssatou" })).toBe("Aïssatou's account has been created.");
    expect(translate("en", "Notifications, {count} à traiter", { count: 3 })).toBe("Notifications, 3 to review");
  });

  it("leaves a placeholder alone when no value is given for it", () => {
    expect(translate("en", "Supprimer {role}", {})).toBe("Delete {role}");
  });

  it("keeps the same placeholders in every translation", () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

    for (const [french, english] of Object.entries(EN_MESSAGES)) {
      expect(placeholders(english), french).toEqual(placeholders(french));
    }
  });
});

describe("isLocale", () => {
  it("accepts only the supported languages", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
