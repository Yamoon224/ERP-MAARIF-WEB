import type { AcademicYear, StaffUser } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { resetPeriodStore } from "@/lib/period/usePeriodFilter";

export const API_URL = "http://localhost:8000/api";

/** Deux années scolaires de trois trimestres ; la plus récente est en cours. */
export const ACADEMIC_YEARS: AcademicYear[] = [
  {
    label: "2026-2027",
    starts_at: "2026-10-01",
    ends_at: "2027-06-30",
    is_current: true,
    terms: [
      { id: "t-2026-1", name: "1er trimestre", starts_at: "2026-10-01", ends_at: "2026-12-31", is_current: true },
      { id: "t-2026-2", name: "2eme trimestre", starts_at: "2027-01-01", ends_at: "2027-03-31", is_current: false },
      { id: "t-2026-3", name: "3eme trimestre", starts_at: "2027-04-01", ends_at: "2027-06-30", is_current: false },
    ],
  },
  {
    label: "2025-2026",
    starts_at: "2025-10-01",
    ends_at: "2026-06-30",
    is_current: false,
    terms: [
      { id: "t-2025-1", name: "1er trimestre", starts_at: "2025-10-01", ends_at: "2025-12-31", is_current: false },
      { id: "t-2025-2", name: "2eme trimestre", starts_at: "2026-01-01", ends_at: "2026-03-31", is_current: false },
      { id: "t-2025-3", name: "3eme trimestre", starts_at: "2026-04-01", ends_at: "2026-06-30", is_current: false },
    ],
  },
];

export function signInAs(permissions: string[], roles: StaffUser["roles"] = ["admin"]) {
  useAuthStore.getState().setSession("test-token", "staff", {
    id: "u1",
    name: "Admin Maarif",
    email: "admin@maarif.test",
    phone: null,
    type: "staff",
    roles,
    permissions,
  });
  resetPeriodStore();
}

export function paged<T>(data: T[], perPage = 10) {
  return { data, meta: { current_page: 1, last_page: 1, per_page: perPage, total: data.length } };
}
