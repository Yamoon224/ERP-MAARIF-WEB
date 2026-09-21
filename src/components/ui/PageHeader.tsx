"use client";

import { type ReactNode } from "react";
import { useT } from "@/lib/i18n/store";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** En-tête de page : titre, sous-titre et actions principales à droite. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { t } = useT();

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(title)}</h1>
        {description && <p className="mt-1 text-sm text-muted">{t(description)}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
