import { RequireAuth } from "@/components/auth/RequireAuth";
import { ParentSidebar } from "@/components/layout/ParentSidebar";
import { ParentTopbar } from "@/components/layout/ParentTopbar";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth actorType="parent" redirectTo="/portail/connexion">
      <div className="flex min-h-screen">
        <ParentSidebar />
        <div className="flex flex-1 flex-col">
          <ParentTopbar />
          <main className="flex-1 bg-background p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
