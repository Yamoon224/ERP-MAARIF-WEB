"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { PAGE_SIZE_OPTIONS } from "@/lib/hooks/usePagination";
import { useT } from "@/lib/i18n/store";
import type { PaginationMeta } from "@/lib/api/types";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

/**
 * Barre de pagination : taille de page | precedent - page/total - suivant |
 * elements parcourus / total d'elements.
 */
export function Pagination({ meta, onPageChange, onPerPageChange }: PaginationProps) {
  const { t } = useT();
  const { current_page: currentPage, per_page: perPage, total } = meta;
  const lastPage = Math.max(meta.last_page, 1);
  const seen = Math.min(currentPage * perPage, total);

  // Apres une suppression, la page courante peut ne plus exister : on revient a la derniere.
  useEffect(() => {
    if (currentPage > lastPage) onPageChange(lastPage);
  }, [currentPage, lastPage, onPageChange]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1 py-3 text-sm text-muted">
      <label className="flex items-center gap-2">
        {t("Elements par page")}
        <Select
          className="h-9 w-20"
          value={perPage}
          onChange={(event) => onPerPageChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </label>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={t("Page precedente")}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="size-4" /> {t("Precedent")}
        </Button>
        <span className="min-w-12 text-center text-foreground">
          {currentPage} / {lastPage}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={t("Page suivante")}
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t("Suivant")} <ChevronRight className="size-4" />
        </Button>
      </div>

      <span>
        {seen} / {total}
      </span>
    </div>
  );
}
