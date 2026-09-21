import { RequireAuth } from "@/components/auth/RequireAuth";
import { StaffShell } from "@/components/layout/StaffShell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth actorType="staff" redirectTo="/login">
      <StaffShell>{children}</StaffShell>
    </RequireAuth>
  );
}
