import { describe, expect, it } from "vitest";
import { nodeToText, sortRows } from "@/lib/utils/tableData";

describe("nodeToText", () => {
  it("reads plain values", () => {
    expect(nodeToText("Fatoumata")).toBe("Fatoumata");
    expect(nodeToText(12)).toBe("12");
    expect(nodeToText(null)).toBe("");
    expect(nodeToText(false)).toBe("");
  });

  it("reads the text of nested elements", () => {
    expect(nodeToText(<span className="font-mono">MAA-1</span>)).toBe("MAA-1");
    expect(
      nodeToText(
        <p>
          <b>Nom</b> Prénom
        </p>,
      ),
    ).toBe("Nom Prénom");
  });

  it("reads a list of badges as a comma-separated list", () => {
    expect(nodeToText(<div>{["Administrateur", "Enseignant"].map((label) => <span key={label}>{label}</span>)}</div>)).toBe(
      "Administrateur, Enseignant",
    );
  });

  it("glues text split by expressions", () => {
    const grade = 12;

    expect(nodeToText(<span>Moyenne : {grade}/20</span>)).toBe("Moyenne : 12/20");
  });

  it("turns the narrow no-break spaces of fr-FR numbers into plain spaces", () => {
    expect(nodeToText("1 250 000 FG")).toBe("1 250 000 FG");
  });

  it("gives an icon-only cell an empty text", () => {
    expect(nodeToText(<button aria-label="Supprimer" />)).toBe("");
  });
});

describe("sortRows", () => {
  const sortBy = (values: (string | number | null)[], direction: "asc" | "desc") => sortRows(values, (value) => value, direction);

  it("sorts text without regard to case or accents", () => {
    expect(sortBy(["ibrahima", "Élodie", "aïssatou", "Fatoumata"], "asc")).toEqual(["aïssatou", "Élodie", "Fatoumata", "ibrahima"]);
  });

  it("sorts numbers by value, not alphabetically", () => {
    expect(sortBy([100, 9, 25], "asc")).toEqual([9, 25, 100]);
    expect(sortBy([100, 9, 25], "desc")).toEqual([100, 25, 9]);
  });

  it("reads amounts and averages carrying a unit as numbers", () => {
    expect(sortBy(["1 250 000 FG", "90 000 FG", "400 000 FG"], "asc")).toEqual(["90 000 FG", "400 000 FG", "1 250 000 FG"]);
    expect(sortBy(["12,5/20", "9,75/20", "15/20"], "asc")).toEqual(["9,75/20", "12,5/20", "15/20"]);
  });

  it("sorts French dates chronologically", () => {
    expect(sortBy(["05/03/2026", "30/11/2025", "12/01/2026"], "asc")).toEqual(["30/11/2025", "12/01/2026", "05/03/2026"]);
  });

  it("orders class names by their number", () => {
    expect(sortBy(["10ème B", "6ème A", "7ème A"], "asc")).toEqual(["6ème A", "7ème A", "10ème B"]);
  });

  it("always puts empty cells last, whichever the direction", () => {
    expect(sortBy(["b", null, "a", "—", ""], "asc")).toEqual(["a", "b", null, "—", ""]);
    expect(sortBy(["b", null, "a", "—", ""], "desc")).toEqual(["b", "a", null, "—", ""]);
  });

  it("does not modify the array it is given, and keeps equal rows in their original order", () => {
    const rows = [
      { id: 1, group: "a" },
      { id: 2, group: "a" },
      { id: 3, group: "a" },
    ];

    expect(sortRows(rows, (row) => row.group, "desc").map((row) => row.id)).toEqual([1, 2, 3]);
    expect(rows.map((row) => row.id)).toEqual([1, 2, 3]);
  });
});
