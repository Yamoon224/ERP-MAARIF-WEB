import { RequireAuth } from "@/components/auth/RequireAuth";
import { StaffSidebar } from "@/components/layout/StaffSidebar";
import { StaffTopbar } from "@/components/layout/StaffTopbar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth actorType="staff" redirectTo="/connexion">
      <div className="flex min-h-screen">
        <StaffSidebar />
        <div className="flex flex-1 flex-col">
          <StaffTopbar />
          <main className="flex-1 bg-background p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
