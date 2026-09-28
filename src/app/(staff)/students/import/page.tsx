"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Database, FileSpreadsheet, FileText, FileUp, UploadCloud } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { getErrorMessage } from "@/lib/api/error";
import { importStudents } from "@/lib/api/students";
import type { StudentImportError, StudentImportResult, StudentImportStudent } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
import { buildSql, downloadBlob, exportXlsx } from "@/lib/export/tableExport";
import type { ExportTable } from "@/lib/utils/tableData";

const COLUMN_HINTS = [
  ["prenom", "Prénom de l'élève"],
  ["nom", "Nom de famille"],
  ["sexe", "M ou F"],
  ["date_naissance", "JJ/MM/AAAA (optionnel)"],
  ["classe", "Nom exact de la classe (optionnel)"],
  ["annee_scolaire", "Ex. 2025-2026 (optionnel, sinon l'année courante)"],
  ["nom_tuteur", "Nom complet du tuteur"],
  ["telephone_tuteur", "Numéro de téléphone du tuteur"],
  ["email_tuteur", "E-mail du tuteur (optionnel)"],
  ["adresse", "Adresse (optionnel)"],
] as const;

/** Deux lignes d'exemple (une complète, une avec les champs optionnels vides) pour chaque modèle téléchargeable. */
const TEMPLATE_ROWS: string[][] = [
  [
    "Fatoumata",
    "Camara",
    "F",
    "12/05/2012",
    "6eme A",
    "2025-2026",
    "Ibrahima Camara",
    "+224612345678",
    "ibrahima.camara@exemple.com",
    "Quartier Almamya, Conakry",
  ],
  ["Moussa", "Diallo", "M", "03/09/2011", "", "", "Aissatou Diallo", "+224622334455", "", ""],
];

function templateTable(): ExportTable {
  return { title: "Modèle import élèves", headers: COLUMN_HINTS.map(([column]) => column), rows: TEMPLATE_ROWS };
}

/** Modèle CSV : encodage et guillemets simples, pas besoin d'une bibliothèque pour ça. */
function downloadCsvTemplate() {
  const escape = (value: string) => (/["\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const content = [templateTable().headers, ...TEMPLATE_ROWS].map((row) => row.map(escape).join(",")).join("\r\n");

  downloadBlob(new Blob([content], { type: "text/csv;charset=utf-8" }), "modele-import-eleves.csv");
}

function downloadSqlTemplate() {
  downloadBlob(new Blob([buildSql(templateTable(), "eleves")], { type: "application/sql;charset=utf-8" }), "modele-import-eleves.sql");
}

/**
 * Import en masse d'élèves depuis un fichier CSV/Excel (migration depuis un
 * système existant). Toujours analysé d'abord (aucune écriture), pour que le
 * personnel corrige le fichier avant de confirmer l'import définitif.
 */
export default function StudentImportPage() {
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<StudentImportResult | null>(null);
  const [imported, setImported] = useState<StudentImportResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setPreview(null);
    setImported(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setPreview(null);

    try {
      setPreview(await importStudents(file, true));
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible d'analyser ce fichier.")));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleConfirm() {
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      setImported(await importStudents(file, false));
      setPreview(null);
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible d'importer ce fichier.")));
    } finally {
      setIsImporting(false);
    }
  }

  const errorColumns: DataTableColumn<StudentImportError>[] = [
    { key: "row", header: "Ligne", render: (row) => row.row, className: "w-20" },
    { key: "messages", header: "Erreur", render: (row) => row.messages.join(" ") },
  ];

  const studentColumns: DataTableColumn<StudentImportStudent>[] = [
    { key: "matricule", header: "Matricule", render: (row) => <span className="font-mono text-xs">{row.matricule}</span> },
    { key: "name", header: "Nom", render: (row) => row.name },
    {
      key: "password",
      header: "Mot de passe initial",
      render: (row) => <span className="font-mono text-xs">{row.initial_password}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/students" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> {t("Élèves")}
      </Link>
      <PageHeader
        title={t("Importer des élèves")}
        description={t("Migrez les élèves d'un système existant (ex. un tableau Excel) sans les ressaisir un par un.")}
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      {imported ? (
        <Card accent="primary">
          <CardHeader>
            <CardTitle>Import terminé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard accent="primary" label={t("Élèves importés")} value={imported.valid} />
              <StatCard accent="discipline" label={t("Lignes en erreur")} value={imported.invalid} />
            </div>

            {imported.students.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm text-muted">
                  <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                  {t("Remettez ces identifiants aux tuteurs concernés : les mots de passe ne seront plus jamais affichés en clair.")}
                </p>
                <DataTable
                  columns={studentColumns}
                  rows={imported.students}
                  rowKey={(row) => row.matricule}
                  exportable={false}
                  emptyMessage="Aucun élève importé."
                />
              </div>
            )}

            {imported.errors.length > 0 && (
              <div>
                <p className="mb-2 text-sm text-muted">{t("Ces lignes n'ont pas été importées :")}</p>
                <DataTable
                  columns={errorColumns}
                  rows={imported.errors}
                  rowKey={(row) => String(row.row)}
                  exportable={false}
                  emptyMessage="Aucune erreur."
                />
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/students">
                <Button>{t("Retour à la liste")}</Button>
              </Link>
              <Button variant="secondary" onClick={reset}>
                {t("Importer un autre fichier")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card accent="primary">
            <CardHeader>
              <CardTitle>Fichier à importer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted">
                {t(
                  "Formats acceptés : CSV, Excel (.xlsx, .xls) ou export SQL (.sql), 5 Mo maximum. Pour un tableur, la première ligne doit contenir les en-têtes de colonnes ; l'ordre des colonnes n'a pas d'importance.",
                )}{" "}
                {t(
                  "Pour un fichier SQL, seules les instructions INSERT INTO dont les colonnes sont reconnues sont lues - le fichier n'est jamais exécuté, ses autres tables (paiements, classes...) sont simplement ignorées.",
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-4 py-3">
                <span className="text-xs font-medium text-muted">{t("Un modèle à remplir, selon le format choisi :")}</span>
                <Button type="button" variant="secondary" size="sm" onClick={downloadCsvTemplate}>
                  <FileText className="size-4" /> CSV
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => void exportXlsx(templateTable(), "modele-import-eleves")}>
                  <FileSpreadsheet className="size-4" /> Excel
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={downloadSqlTemplate}>
                  <Database className="size-4" /> SQL
                </Button>
              </div>

              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-background px-4 py-8 text-center hover:border-primary">
                <UploadCloud className="size-6 text-muted" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">{file ? file.name : t("Choisir un fichier")}</span>
                <span className="text-xs text-muted">CSV, XLSX, XLS {t("ou")} SQL</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls,.sql"
                  className="sr-only"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setPreview(null);
                  }}
                />
              </label>

              <details className="text-sm text-muted">
                <summary className="cursor-pointer font-medium text-foreground">{t("Colonnes reconnues")}</summary>
                <table className="mt-2 w-full text-left text-xs">
                  <tbody>
                    {COLUMN_HINTS.map(([column, hint]) => (
                      <tr key={column} className="border-b border-border last:border-0">
                        <td className="py-1.5 pr-3 font-mono">{column}</td>
                        <td className="py-1.5 text-muted">{t(hint)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>

              <div className="flex justify-end">
                <Button type="button" loading={isAnalyzing} disabled={!file} onClick={handleAnalyze}>
                  <FileUp className="size-4" /> {t("Analyser le fichier")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card accent={preview.valid > 0 ? "primary" : "discipline"}>
              <CardHeader>
                <CardTitle>Aperçu de l&apos;import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard accent="neutral" label={t("Lignes lues")} value={preview.total} />
                  <StatCard accent="primary" label={t("Valides")} value={preview.valid} />
                  <StatCard accent="discipline" label={t("En erreur")} value={preview.invalid} />
                </div>

                {preview.errors.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm text-muted">{t("Corrigez ces lignes dans le fichier, puis analysez-le à nouveau :")}</p>
                    <DataTable
                      columns={errorColumns}
                      rows={preview.errors}
                      rowKey={(row) => String(row.row)}
                      exportable={false}
                      emptyMessage="Aucune erreur."
                    />
                  </div>
                )}

                {preview.valid === 0 ? (
                  <p className="text-sm text-danger">{t("Aucune ligne valide : rien à importer.")}</p>
                ) : (
                  <div className="flex justify-end">
                    <Button type="button" loading={isImporting} onClick={handleConfirm}>
                      {t("Confirmer l'import de {count} élève(s)", { count: preview.valid })}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
