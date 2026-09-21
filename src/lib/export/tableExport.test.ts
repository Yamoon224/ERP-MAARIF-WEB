import { describe, expect, it } from "vitest";
import { buildPrintHtml, buildSql, slugify } from "@/lib/export/tableExport";
import type { ExportTable } from "@/lib/utils/tableData";

const table: ExportTable = {
  title: "Élèves inscrits",
  headers: ["Matricule", "Nom", "E-mail", "Moyenne"],
  rows: [
    ["MAA-2026-000001", "Fatoumata Camara", "fatou@maarif.test", 14.5],
    ["MAA-2026-000002", "Jean d'Arc", null, 9],
  ],
};

describe("slugify", () => {
  it("makes a safe file name", () => {
    expect(slugify("Élèves inscrits")).toBe("eleves-inscrits");
    expect(slugify("  Frais de scolarité (2026) ")).toBe("frais-de-scolarite-2026");
  });

  it("can use another separator, for SQL identifiers", () => {
    expect(slugify("Journal des notifications", "_")).toBe("journal_des_notifications");
  });

  it("never returns an empty name", () => {
    expect(slugify("???")).toBe("export");
  });
});

describe("buildSql", () => {
  it("writes one INSERT with a column list derived from the headers", () => {
    const sql = buildSql(table, "eleves_inscrits");

    expect(sql).toContain("INSERT INTO `eleves_inscrits` (`matricule`, `nom`, `e_mail`, `moyenne`) VALUES");
    expect(sql).toContain("('MAA-2026-000001', 'Fatoumata Camara', 'fatou@maarif.test', 14.5)");
  });

  it("quotes text, doubles its apostrophes, and writes an empty cell as NULL", () => {
    const sql = buildSql(table, "eleves");

    expect(sql).toContain("('MAA-2026-000002', 'Jean d''Arc', NULL, 9);");
  });

  it("neutralises backslashes and line breaks in text", () => {
    const sql = buildSql({ title: "T", headers: ["Note"], rows: [["a\\b\nc"]] }, "t");

    expect(sql).toContain("('a\\\\b\\nc')");
  });

  it("separates rows with commas and ends the statement with a semicolon", () => {
    const body = buildSql(table, "eleves").split("VALUES\n")[1];

    expect(body.trim().split("\n")).toHaveLength(2);
    expect(body.split("\n")[0].endsWith("),")).toBe(true);
    expect(body.trim().endsWith(";")).toBe(true);
  });

  it("deduplicates headers that give the same column name", () => {
    const sql = buildSql({ title: "T", headers: ["Nom", "Nom", "Élève"], rows: [["a", "b", "c"]] }, "t");

    expect(sql).toContain("(`nom`, `nom_2`, `eleve`)");
  });

  it("says so when there is no row, instead of writing an invalid INSERT", () => {
    const sql = buildSql({ title: "T", headers: ["Nom"], rows: [] }, "t");

    expect(sql).not.toContain("INSERT");
    expect(sql).toContain("Aucune ligne");
  });
});

describe("buildPrintHtml", () => {
  it("prints the title, the headers and every row", () => {
    const html = buildPrintHtml(table);

    expect(html).toContain("<h1>Élèves inscrits</h1>");
    expect(html).toContain("<th>Matricule</th>");
    expect(html).toContain("<td>Fatoumata Camara</td>");
  });

  it("escapes what it prints, so a cell cannot inject markup into the print window", () => {
    const html = buildPrintHtml({ title: "<b>T</b>", headers: ["Nom"], rows: [['<img src=x onerror="alert(1)">']] });

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("<h1>&lt;b&gt;T&lt;/b&gt;</h1>");
  });
});
