"use client";

import type { AttendanceStatus } from "@/lib/api/types";
import { ATTENDANCE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils/cn";

const OPTIONS: AttendanceStatus[] = ["present", "absent", "retard"];

const ACTIVE_CLASS: Record<AttendanceStatus, string> = {
  present: "bg-success text-primary-foreground",
  absent: "bg-danger text-primary-foreground",
  retard: "bg-warning text-primary-foreground",
};

interface StatusPickerProps {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  /** Nom de l'élève, pour le libellé accessible du groupe. */
  label: string;
}

/** Choix Présent / Absent / Retard en un clic, pour l'appel d'une classe. */
export function StatusPicker({ value, onChange, label }: StatusPickerProps) {
  return (
    <div role="radiogroup" aria-label={`Statut de ${label}`} className="inline-flex overflow-hidden rounded-full border border-border">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-8 px-3 text-xs font-medium transition-colors",
            value === option ? ACTIVE_CLASS[option] : "text-muted hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          {ATTENDANCE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
