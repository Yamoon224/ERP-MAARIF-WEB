"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileUp, UploadCloud } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { getErrorMessage } from "@/lib/api/error";
import { importStudents } from "@/lib/api/students";
import type { StudentImportError, StudentImportResult, StudentImportStudent } from "@/lib/api/types";

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

/**
 * Import en masse d'élèves depuis un fichier CSV/Excel (migration depuis un
 * système existant). Toujours analysé d'abord (aucune écriture), pour que le
 * personnel corrige le fichier avant de confirmer l'import définitif.
 */
export default function StudentImportPage() {
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
      setError(getErrorMessage(failure, "Impossible d'analyser ce fichier."));
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
      setError(getErrorMessage(failure, "Impossible d'importer ce fichier."));
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
        <ArrowLeft className="size-4" aria-hidden="true" /> Élèves
      </Link>
      <PageHeader
        title="Importer des élèves"
        description="Migrez les élèves d'un système existant (ex. un tableau Excel) sans les ressaisir un par un."
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      {imported ? (
        <Card accent="primary">
          <CardHeader>
            <CardTitle>Import terminé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard accent="primary" label="Élèves importés" value={imported.valid} />
              <StatCard accent="discipline" label="Lignes en erreur" value={imported.invalid} />
            </div>

            {imported.students.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm text-muted">
                  <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                  Remettez ces identifiants aux tuteurs concernés : les mots de passe ne seront plus jamais affichés en clair.
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
                <p className="mb-2 text-sm text-muted">Ces lignes n&apos;ont pas été importées :</p>
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
                <Button>Retour à la liste</Button>
              </Link>
              <Button variant="secondary" onClick={reset}>
                Importer un autre fichier
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
                Formats acceptés : CSV, Excel (.xlsx, .xls) ou export SQL (.sql), 5 Mo maximum. Pour un tableur, la première
                ligne doit contenir les en-têtes de colonnes ; l&apos;ordre des colonnes n&apos;a pas d&apos;importance. Pour un
                fichier SQL, seules les instructions <code className="font-mono">INSERT INTO</code> dont les colonnes sont
                reconnues sont lues — le fichier n&apos;est jamais exécuté, ses autres tables (paiements, classes...) sont
                simplement ignorées.
              </p>

              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-background px-4 py-8 text-center hover:border-primary">
                <UploadCloud className="size-6 text-muted" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">{file ? file.name : "Choisir un fichier"}</span>
                <span className="text-xs text-muted">CSV, XLSX, XLS ou SQL</span>
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
                <summary className="cursor-pointer font-medium text-foreground">Colonnes reconnues</summary>
                <table className="mt-2 w-full text-left text-xs">
                  <tbody>
                    {COLUMN_HINTS.map(([column, hint]) => (
                      <tr key={column} className="border-b border-border last:border-0">
                        <td className="py-1.5 pr-3 font-mono">{column}</td>
                        <td className="py-1.5 text-muted">{hint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>

              <div className="flex justify-end">
                <Button type="button" loading={isAnalyzing} disabled={!file} onClick={handleAnalyze}>
                  <FileUp className="size-4" /> Analyser le fichier
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
                  <StatCard accent="neutral" label="Lignes lues" value={preview.total} />
                  <StatCard accent="primary" label="Valides" value={preview.valid} />
                  <StatCard accent="discipline" label="En erreur" value={preview.invalid} />
                </div>

                {preview.errors.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm text-muted">Corrigez ces lignes dans le fichier, puis analysez-le à nouveau :</p>
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
                  <p className="text-sm text-danger">Aucune ligne valide : rien à importer.</p>
                ) : (
                  <div className="flex justify-end">
                    <Button type="button" loading={isImporting} onClick={handleConfirm}>
                      Confirmer l&apos;import de {preview.valid} élève(s)
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
