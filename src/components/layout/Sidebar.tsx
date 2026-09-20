"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, X } from "lucide-react";
import { BrandMark } from "@/components/layout/Logo";
import { isNavItemActive, type NavGroup } from "@/components/layout/nav";
import { useLayoutStore } from "@/lib/layout/store";
import { cn } from "@/lib/utils/cn";

export interface SidebarProfile {
  name: string;
  subtitle: string;
  href: string;
}

interface SidebarProps {
  groups: NavGroup[];
  brandSubtitle: string;
  profile: SidebarProfile;
}

interface SidebarContentProps extends SidebarProps {
  /** Réduite à ses icônes. Toujours faux dans le tiroir mobile. */
  collapsed: boolean;
  onClose?: () => void;
}

/**
 * Contenu de la barre latérale : en-tête (logo), navigation groupée qui défile
 * seule, et profil de l'utilisateur épinglé en bas. Les trois zones sont dans
 * une colonne à hauteur d'écran : seule la navigation défile, le logo et le
 * profil restent toujours visibles.
 */
function SidebarContent({ groups, brandSubtitle, profile, collapsed, onClose }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border", collapsed ? "justify-center" : "justify-between px-5")}>
        <BrandMark subtitle={brandSubtitle} showText={!collapsed} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group, groupIndex) => {
          const headingId = `nav-group-${groupIndex}`;

          return (
            <div key={group.label} role="group" aria-labelledby={headingId} className={cn(groupIndex > 0 && "mt-5")}>
              {collapsed ? (
                <>
                  <span id={headingId} className="sr-only">
                    {group.label}
                  </span>
                  {groupIndex > 0 && <div className="mx-3 mb-3 border-t border-border" aria-hidden="true" />}
                </>
              ) : (
                <p id={headingId} className="mb-1.5 px-3 text-xs font-semibold tracking-wider text-muted uppercase">
                  {group.label}
                </p>
              )}

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = isNavItemActive(pathname, item);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                          collapsed ? "justify-center px-0" : "gap-3 px-3",
                          isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-foreground/5 hover:text-foreground",
                        )}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        <span className={cn(collapsed && "sr-only")}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <Link
          href={profile.href}
          title={collapsed ? `${profile.name} — Mon profil` : undefined}
          aria-label={collapsed ? `Mon profil : ${profile.name}` : undefined}
          className={cn(
            "flex items-center rounded-md py-2 transition-colors hover:bg-foreground/5",
            collapsed ? "justify-center px-0" : "gap-3 px-2",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-5" aria-hidden="true" />
          </span>
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium text-foreground">{profile.name}</span>
              <span className="block truncate text-xs text-muted">{profile.subtitle}</span>
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

/**
 * Barre latérale de l'application : fixe et réductible en icônes sur bureau,
 * tiroir plein écran sur mobile (ouvert depuis la barre du haut).
 */
export function Sidebar(props: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useLayoutStore((state) => state.collapsed);
  const mobileOpen = useLayoutStore((state) => state.mobileOpen);
  const setMobileOpen = useLayoutStore((state) => state.setMobileOpen);

  // Naviguer referme le tiroir.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, setMobileOpen]);

  return (
    <>
      <aside
        aria-label="Barre latérale"
        data-collapsed={collapsed}
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-surface transition-[width] duration-200 md:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <SidebarContent {...props} collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside aria-label="Menu" className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-surface shadow-xl">
            <SidebarContent {...props} collapsed={false} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
