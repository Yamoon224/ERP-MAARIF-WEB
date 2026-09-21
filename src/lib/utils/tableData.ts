import { Children, isValidElement, type ReactNode } from "react";

/** Valeur d'une cellule telle qu'elle sort d'un export : texte, nombre, ou vide. */
export type CellValue = string | number | null;

export type SortDirection = "asc" | "desc";

/** Les formateurs `Intl` fr-FR séparent les milliers par des espaces insécables, que ni le PDF ni un tri ne savent traiter. */
function normalizeSpaces(text: string): string {
  return text.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
}

function rawText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);

  if (Array.isArray(node)) {
    const items = Children.toArray(node);

    // Une liste de pastilles (rôles, statuts...) se lit « a, b » ; du texte coupé par des expressions se recolle tel quel.
    if (items.length > 1 && items.every((item) => isValidElement(item))) {
      return items.map(rawText).map(normalizeSpaces).filter(Boolean).join(", ");
    }

    return items.map(rawText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) return rawText(node.props.children);

  return "";
}

/**
 * Texte visible d'une cellule de tableau. Les colonnes décrivent leur affichage (`render`), pas leur donnée :
 * pour trier ou exporter sans redéclarer chaque valeur, on relit le texte que ce rendu produit.
 */
export function nodeToText(node: ReactNode): string {
  return normalizeSpaces(rawText(node));
}

const NUMBER_WITH_UNIT = /^(-?\d[\d ]*(?:[.,]\d+)?)\s*(?:FG|GNF|FCFA|CFA|F|€|\$|%|\/\s*\d+)?$/i;
const DATE_FR = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}:\d{2}))?$/;

type SortKey = { kind: "number"; value: number } | { kind: "text"; value: string };

/** Nombre (avec ou sans unité : « 1 250 000 FG », « 12,5/20 ») ou texte ; une date `jj/mm/aaaa` devient `aaaa-mm-jj` pour se classer chronologiquement. */
function toSortKey(value: CellValue | undefined): SortKey | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? { kind: "number", value } : null;

  const text = normalizeSpaces(value);
  if (text === "" || text === "—") return null;

  const date = DATE_FR.exec(text);
  if (date) return { kind: "text", value: `${date[3]}-${date[2]}-${date[1]}${date[4] ? ` ${date[4]}` : ""}` };

  const number = NUMBER_WITH_UNIT.exec(text);
  if (number) {
    const parsed = Number(number[1].replace(/ /g, "").replace(",", "."));
    if (Number.isFinite(parsed)) return { kind: "number", value: parsed };
  }

  return { kind: "text", value: text };
}

function compareKeys(a: SortKey, b: SortKey): number {
  if (a.kind === "number" && b.kind === "number") return a.value - b.value;

  return String(a.value).localeCompare(String(b.value), "fr", { numeric: true, sensitivity: "base" });
}

/**
 * Trie une copie des lignes selon la valeur d'une colonne. Les cellules vides passent toujours en dernier,
 * quel que soit le sens : un tiret ne doit pas ouvrir la liste d'un tri décroissant.
 */
export function sortRows<T>(rows: readonly T[], getValue: (row: T) => CellValue | undefined, direction: SortDirection): T[] {
  const factor = direction === "asc" ? 1 : -1;

  return rows
    .map((row, index) => ({ row, index, key: toSortKey(getValue(row)) }))
    .sort((a, b) => {
      if (a.key === null && b.key === null) return a.index - b.index;
      if (a.key === null) return 1;
      if (b.key === null) return -1;

      return compareKeys(a.key, b.key) * factor || a.index - b.index;
    })
    .map((entry) => entry.row);
}

/** Données prêtes à être écrites dans un fichier ou envoyées à l'imprimante. */
export interface ExportTable {
  /** Titre lisible, en tête du PDF et de l'impression. */
  title: string;
  headers: string[];
  rows: CellValue[][];
}
