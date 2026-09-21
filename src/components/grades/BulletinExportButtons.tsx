"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BulletinFormat } from "@/lib/api/grades";
import { downloadBlob } from "@/lib/export/tableExport";

interface BulletinExportButtonsProps {
  /** Nom du fichier sans extension. */
  fileName: string;
  /** Télécharge le bulletin dans le format demandé. */
  load: (format: BulletinFormat) => Promise<Blob>;
  disabled?: boolean;
}

/** Exporter un bulletin en PDF (à remettre ou imprimer) ou en Excel (à retravailler). */
export function BulletinExportButtons({ fileName, load, disabled }: BulletinExportButtonsProps) {
  const [running, setRunning] = useState<BulletinFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: BulletinFormat) {
    setRunning(format);
    setError(null);

    try {
      downloadBlob(await load(format), `${fileName}.${format}`);
    } catch {
      setError("Le bulletin n'a pas pu être exporté. Veuillez réessayer.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Exporter le bulletin">
      {error && (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || running !== null}
        loading={running === "pdf"}
        onClick={() => handleExport("pdf")}
      >
        {running !== "pdf" && <FileText className="size-4" aria-hidden="true" />}
        Bulletin PDF
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || running !== null}
        loading={running === "xlsx"}
        onClick={() => handleExport("xlsx")}
      >
        {running !== "xlsx" && <FileSpreadsheet className="size-4" aria-hidden="true" />}
        Bulletin Excel
      </Button>
    </div>
  );
}
