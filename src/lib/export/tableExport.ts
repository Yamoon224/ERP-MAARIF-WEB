import type { CellValue, ExportTable } from "@/lib/utils/tableData";

/** « Élèves inscrits » -> `eleves-inscrits` : nom de fichier sûr, sans accents ni espaces. */
export function slugify(text: string, separator = "-"): string {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");

  return slug || "export";
}

function timestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Le navigateur a besoin d'un instant pour lancer le téléchargement avant que l'URL ne soit libérée.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ----------------------------------------------------------------------------
// SQL
// ----------------------------------------------------------------------------

function sqlIdentifier(text: string): string {
  const name = slugify(text, "_");

  // Un identifiant qui commencerait par un chiffre doit rester valide sans guillemets particuliers.
  return /^\d/.test(name) ? `c_${name}` : name;
}

function sqlValue(value: CellValue): string {
  if (value === null || value === "") return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";

  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/\r?\n/g, "\\n")}'`;
}

/** Noms de colonnes SQL uniques, dérivés des en-têtes (« E-mail » -> `e_mail`). */
function sqlColumnNames(headers: string[]): string[] {
  const seen = new Map<string, number>();

  return headers.map((header, index) => {
    const base = sqlIdentifier(header) || `colonne_${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

/** Script `INSERT` (une instruction par ligne du tableau), à rejouer dans MySQL/MariaDB ou PostgreSQL. */
export function buildSql(table: ExportTable, tableName: string): string {
  const name = sqlIdentifier(tableName);
  const columns = sqlColumnNames(table.headers).map((column) => `\`${column}\``).join(", ");

  const lines = [`-- ${table.title}`, `-- Exporté le ${timestamp()} depuis ERP Maarif`, ""];

  if (table.rows.length === 0) {
    lines.push("-- Aucune ligne à exporter.");
  } else {
    lines.push(`INSERT INTO \`${name}\` (${columns}) VALUES`);
    lines.push(table.rows.map((row) => `  (${row.map(sqlValue).join(", ")})`).join(",\n") + ";");
  }

  return lines.join("\n") + "\n";
}

export function exportSql(table: ExportTable, fileName: string, tableName: string): void {
  downloadBlob(new Blob([buildSql(table, tableName)], { type: "application/sql;charset=utf-8" }), `${fileName}.sql`);
}

// ----------------------------------------------------------------------------
// Excel
// ----------------------------------------------------------------------------

/** Fichier `.xlsx` : en-têtes en bleu (comme à l'écran), colonnes dimensionnées d'après leur contenu. */
export async function exportXlsx(table: ExportTable, fileName: string): Promise<void> {
  const { default: writeExcelFile } = await import("write-excel-file/browser");

  const header = table.headers.map((value) => ({
    value,
    fontWeight: "bold" as const,
    backgroundColor: "#bfdbfe",
    textColor: "#0b1b3a",
  }));
  const body = table.rows.map((row) => row.map((cell) => (cell === "" ? null : cell)));

  const columns = table.headers.map((title, index) => {
    const longest = table.rows.reduce((max, row) => Math.max(max, String(row[index] ?? "").length), title.length);

    return { width: Math.min(Math.max(longest + 2, 10), 50) };
  });

  const blob = await writeExcelFile([header, ...body], { columns, sheet: table.title.slice(0, 31) }).toBlob();
  downloadBlob(blob, `${fileName}.xlsx`);
}

// ----------------------------------------------------------------------------
// PDF
// ----------------------------------------------------------------------------

/** PDF paginé (en-tête répété sur chaque page), en paysage dès que le tableau compte plus de cinq colonnes. */
export async function exportPdf(table: ExportTable, fileName: string): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const pdf = new jsPDF({ orientation: table.headers.length > 5 ? "landscape" : "portrait", unit: "pt", format: "a4" });

  pdf.setFontSize(14);
  pdf.text(table.title, 40, 40);
  pdf.setFontSize(9);
  pdf.setTextColor(102, 112, 133);
  pdf.text(`Exporté le ${timestamp()}`, 40, 56);

  autoTable(pdf, {
    startY: 70,
    head: [table.headers],
    body: table.rows.map((row) => row.map((cell) => (cell === null ? "" : String(cell)))),
    styles: { fontSize: 8, cellPadding: 4, textColor: [16, 24, 40] },
    headStyles: { fillColor: [191, 219, 254], textColor: [11, 27, 58], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 246, 255] },
    margin: { left: 40, right: 40 },
  });

  pdf.save(`${fileName}.pdf`);
}

// ----------------------------------------------------------------------------
// Impression directe
// ----------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildPrintHtml(table: ExportTable): string {
  const head = table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const body = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell === null ? "" : String(cell))}</td>`).join("")}</tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(table.title)}</title>
<style>
  body { font-family: system-ui, Arial, sans-serif; color: #101828; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { margin: 0 0 16px; font-size: 12px; color: #667085; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 8px 10px; background: linear-gradient(90deg, #bfdbfe, #ffffff); color: #0b1b3a; border-bottom: 1px solid #93c5fd; }
  td { padding: 7px 10px; border-bottom: 1px solid #e4e7ec; }
  tbody tr:nth-child(even) td { background: #f3f7ff; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head>
<body>
<h1>${escapeHtml(table.title)}</h1>
<p>Imprimé le ${timestamp()}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`;
}

/** Ouvre la boîte d'impression du navigateur sur le seul tableau, sans le reste de la page (iframe invisible). */
export function printTable(table: ExportTable): void {
  const frame = document.createElement("iframe");

  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.srcdoc = buildPrintHtml(table);

  frame.onload = () => {
    const frameWindow = frame.contentWindow;
    if (!frameWindow) {
      frame.remove();
      return;
    }

    frameWindow.addEventListener("afterprint", () => setTimeout(() => frame.remove(), 500));
    frameWindow.focus();
    frameWindow.print();
  };

  document.body.appendChild(frame);
}
