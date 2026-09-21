"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Database, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/store";
import { exportPdf, exportSql, exportXlsx, printTable, slugify } from "@/lib/export/tableExport";
import { cn } from "@/lib/utils/cn";
import { nodeToText, sortRows, type CellValue, type ExportTable, type SortDirection } from "@/lib/utils/tableData";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /**
   * Valeur utilisée pour le tri et l'export quand le texte affiché ne convient pas (montant brut, date ISO...).
   * Sans elle, on relit le texte que `render` produit.
   */
  value?: (row: T) => CellValue | undefined;
  /** Par défaut, toute colonne titrée se trie ; `false` retire l'icône de tri. */
  sortable?: boolean;
  /** Par défaut, toute colonne titrée s'exporte ; `false` l'écarte (colonne d'actions...). */
  exportable?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Titre du tableau dans les exports (PDF, impression...) ; le nom des fichiers et de la table SQL en découle. */
  exportName?: string;
  /** Barre d'export (PDF, Excel, impression, SQL). Active par défaut ; `false` la masque. */
  exportable?: boolean;
  /**
   * Charge toutes les lignes du jeu de données quand `rows` n'en montre qu'une page. Sans cette fonction, les
   * exports portent sur les lignes affichées.
   */
  exportAll?: () => Promise<T[]>;
}

type ExportAction = "pdf" | "xlsx" | "print" | "sql";

interface SortState {
  key: string;
  direction: SortDirection;
}

const isSortable = <T,>(column: DataTableColumn<T>) => column.sortable ?? column.header !== "";
const isExportable = <T,>(column: DataTableColumn<T>) => column.exportable ?? column.header !== "";

function cellValue<T>(column: DataTableColumn<T>, row: T): CellValue | undefined {
  return column.value ? column.value(row) : nodeToText(column.render(row));
}

/**
 * Tableau de donnees generique : chaque page de liste (eleves, notes, presences...) lui fournit ses colonnes.
 *
 * En-tete en degrade bleu vers blanc ; lignes alternees et surlignees au survol ; chaque colonne titree se trie
 * d'un clic (croissant, decroissant, puis retour a l'ordre d'origine) ; et une barre d'export produit un PDF, un
 * fichier Excel, une impression directe ou un script SQL. Le tri porte sur les lignes chargees : sur une liste
 * paginee par le serveur, il ordonne la page affichee.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  emptyMessage = "Aucun résultat.",
  exportName = "Export",
  exportable = true,
  exportAll,
}: DataTableProps<T>) {
  const { t } = useT();
  const [sort, setSort] = useState<SortState | null>(null);
  const [runningExport, setRunningExport] = useState<ExportAction | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const sortColumn = sort ? columns.find((column) => column.key === sort.key) : undefined;

  const sortedRows = useMemo(
    () => (sort && sortColumn ? sortRows(rows, (row) => cellValue(sortColumn, row), sort.direction) : rows),
    [rows, sort, sortColumn],
  );

  /** Aucun tri -> croissant -> decroissant -> aucun : un meme clic active puis desactive le tri. */
  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  async function runExport(action: ExportAction) {
    setRunningExport(action);
    setExportError(null);

    try {
      const source = exportAll ? await exportAll() : rows;
      const ordered = sort && sortColumn ? sortRows(source, (row) => cellValue(sortColumn, row), sort.direction) : source;
      const exported = columns.filter(isExportable);

      const table: ExportTable = {
        title: t(exportName),
        headers: exported.map((column) => t(column.header)),
        rows: ordered.map((row) => exported.map((column) => cellValue(column, row) ?? null)),
      };
      const fileName = slugify(t(exportName));

      if (action === "pdf") await exportPdf(table, fileName);
      if (action === "xlsx") await exportXlsx(table, fileName);
      if (action === "sql") exportSql(table, fileName, slugify(t(exportName), "_"));
      if (action === "print") printTable(table);
    } catch {
      setExportError(t("L'export a échoué. Veuillez réessayer."));
    } finally {
      setRunningExport(null);
    }
  }

  const canExport = exportable && !isLoading && rows.length > 0;
  const exportActions: { action: ExportAction; label: string; icon: typeof FileText }[] = [
    { action: "pdf", label: "PDF", icon: FileText },
    { action: "xlsx", label: "Excel", icon: FileSpreadsheet },
    { action: "print", label: "Imprimer", icon: Printer },
    { action: "sql", label: "SQL", icon: Database },
  ];

  return (
    <div>
      {exportable && (
        <div className="mb-2 flex flex-wrap items-center justify-end gap-2" role="group" aria-label={t("Exporter le tableau")}>
          {exportError && (
            <span role="alert" className="mr-auto text-sm text-danger">
              {exportError}
            </span>
          )}
          {exportActions.map(({ action, label, icon: Icon }) => (
            <Button
              key={action}
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canExport || runningExport !== null}
              loading={runningExport === action}
              title={exportAll ? `${t(label)} : ${t("toutes les lignes")}` : `${t(label)} : ${t("lignes affichées")}`}
              onClick={() => runExport(action)}
            >
              {runningExport !== action && <Icon className="size-4" aria-hidden="true" />}
              {t(label)}
            </Button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-brand-fade border-b border-border text-xs tracking-wide uppercase">
              {columns.map((column) => {
                const sortable = isSortable(column);
                const direction = sort?.key === column.key ? sort.direction : null;
                const SortIcon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : sortable ? "none" : undefined}
                    className={cn("px-4 py-3 font-semibold", column.className)}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        title={
                          direction === "asc"
                            ? t("Tri croissant : cliquer pour trier en décroissant")
                            : direction === "desc"
                              ? t("Tri décroissant : cliquer pour désactiver le tri")
                              : t("Cliquer pour trier")
                        }
                        className="inline-flex items-center gap-1.5 rounded uppercase hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {t(column.header)}
                        <SortIcon className={cn("size-3.5 shrink-0", direction ? "opacity-100" : "opacity-50")} aria-hidden="true" />
                      </button>
                    ) : (
                      t(column.header)
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                  {t("Chargement...")}
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                  {t(emptyMessage)}
                </td>
              </tr>
            )}
            {!isLoading &&
              sortedRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-border transition-colors last:border-0 even:bg-primary/5 hover:bg-primary/10"
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3 text-foreground", column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
