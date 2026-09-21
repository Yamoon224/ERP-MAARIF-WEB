import { RequireAuth } from "@/components/auth/RequireAuth";
import { ParentShell } from "@/components/layout/ParentShell";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth actorType="parent" redirectTo="/portal/login">
      <ParentShell>{children}</ParentShell>
    </RequireAuth>
  );
}
