import { useEffect, useState } from "react";
import { listAllTerms } from "@/lib/api/academics";
import type { Term } from "@/lib/api/types";

export function useTermOptions() {
  const [terms, setTerms] = useState<Term[]>([]);

  useEffect(() => {
    listAllTerms()
      .then(setTerms)
      .catch(() => setTerms([]));
  }, []);

  return terms;
}
