"use client";

import { useEffect, useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { listStudents } from "@/lib/api/students";
import type { Student } from "@/lib/api/types";

interface StudentPickerProps {
  selected: Student | null;
  onSelect: (student: Student) => void;
  onClear?: () => void;
}

/** Recherche d'un eleve par nom ou matricule, utilisee partout ou une action doit cibler un seul eleve (notes, presences, discipline). */
export function StudentPicker({ selected, onSelect, onClear }: StudentPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    listStudents({ search: debouncedQuery, per_page: 8 })
      .then((response) => setResults(response.data))
      .catch(() => setResults([]));
  }, [debouncedQuery]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-2.5">
        <div>
          <p className="text-sm font-medium text-foreground">
            {selected.first_name} {selected.last_name}
          </p>
          <p className="font-mono text-xs text-muted">{selected.matricule}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            onClear?.();
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un eleve par nom ou matricule..." />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-w-sm overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          {results.map((student) => (
            <li key={student.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(student);
                  setResults([]);
                  setQuery("");
                }}
                className="flex w-full flex-col px-4 py-2 text-left text-sm hover:bg-background"
              >
                <span className="font-medium text-foreground">
                  {student.first_name} {student.last_name}
                </span>
                <span className="font-mono text-xs text-muted">{student.matricule}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
