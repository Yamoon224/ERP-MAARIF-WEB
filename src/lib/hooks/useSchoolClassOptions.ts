import { useEffect, useState } from "react";
import { listSchoolClasses } from "@/lib/api/academics";
import type { SchoolClass } from "@/lib/api/types";

/** Options de classe pour un select : une seule page suffit pour un etablissement de taille courante. */
export function useSchoolClassOptions() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  useEffect(() => {
    listSchoolClasses({ per_page: 100 })
      .then((response) => setClasses(response.data))
      .catch(() => setClasses([]));
  }, []);

  return classes;
}
