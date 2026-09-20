import { useEffect, useState } from "react";
import { listSubjects } from "@/lib/api/academics";
import type { Subject } from "@/lib/api/types";

export function useSubjectOptions() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    listSubjects({ per_page: 100 })
      .then((response) => setSubjects(response.data))
      .catch(() => setSubjects([]));
  }, []);

  return subjects;
}
