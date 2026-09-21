"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { getErrorMessage } from "@/lib/api/error";
import { getRole, grantRolePermissions, revokeRolePermission, syncRolePermissions } from "@/lib/api/roles";
import type { Permission, Role } from "@/lib/api/types";

interface RolePermissionsEditorProps {
  role: Role;
  /** Toutes les permissions existantes. */
  catalog: Permission[];
  /** Appelé après chaque changement enregistré, pour rafraîchir les effectifs de la liste. */
  onChanged: () => void;
  onClose: () => void;
}

/**
 * Attribution et retrait des permissions d'un rôle. Chaque case cochée ou décochée est enregistrée aussitôt :
 * il n'y a pas de bouton « Enregistrer » à oublier. L'administrateur, lui, garde toutes les permissions
 * (le serveur refuse d'y toucher) : ses cases sont cochées et verrouillées.
 */
export function RolePermissionsEditor({ role, catalog, onChanged, onClose }: RolePermissionsEditorProps) {
  const [granted, setGranted] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = role.name === "admin";

  useEffect(() => {
    let cancelled = false;

    getRole(role.id)
      .then((loaded) => {
        if (!cancelled) setGranted(new Set(loaded.permissions ?? []));
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les permissions de ce rôle.");
      });

    return () => {
      cancelled = true;
    };
  }, [role.id]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, { label: string; permissions: Permission[] }>();

    for (const permission of catalog) {
      const group = byGroup.get(permission.group) ?? { label: permission.group_label, permissions: [] };
      group.permissions.push(permission);
      byGroup.set(permission.group, group);
    }

    return [...byGroup.entries()].sort(([, a], [, b]) => a.label.localeCompare(b.label, "fr"));
  }, [catalog]);

  /** Applique un changement au serveur ; en cas d'échec, l'affichage revient à l'état réellement enregistré. */
  async function apply(next: Set<string>, request: () => Promise<Role>) {
    const previous = granted;

    setBusy(true);
    setError(null);
    setGranted(next);

    try {
      const saved = await request();
      setGranted(new Set(saved.permissions ?? []));
      onChanged();
    } catch (failure) {
      setGranted(previous);
      setError(getErrorMessage(failure, "Impossible d'enregistrer ce changement."));
    } finally {
      setBusy(false);
    }
  }

  function toggle(permission: Permission, checked: boolean) {
    if (!granted) return;

    const next = new Set(granted);
    if (checked) next.add(permission.name);
    else next.delete(permission.name);

    void apply(next, () => (checked ? grantRolePermissions(role.id, [permission.name]) : revokeRolePermission(role.id, permission.id)));
  }

  function setGroup(permissions: Permission[], checked: boolean) {
    if (!granted) return;

    const next = new Set(granted);
    for (const permission of permissions) {
      if (checked) next.add(permission.name);
      else next.delete(permission.name);
    }

    void apply(next, () => syncRolePermissions(role.id, [...next]));
  }

  return (
    <Card accent="users" className="mb-6" role="region" aria-label={`Permissions du rôle ${role.label}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Permissions du rôle « {role.label} »</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Cochez ce que ce rôle peut faire : chaque changement est enregistré immédiatement et vaut pour tous les comptes qui
            portent ce rôle (leur menu se met à jour à leur prochaine connexion).
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" aria-label="Fermer l'éditeur de permissions" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && <Alert>{error}</Alert>}

        {isLocked && (
          <p className="flex items-center gap-2 rounded-md bg-background p-3 text-sm text-muted">
            <Lock className="size-4 shrink-0" aria-hidden="true" />
            Le rôle Administrateur possède toutes les permissions : elles ne peuvent pas être modifiées.
          </p>
        )}

        {!granted && !error && <p className="text-sm text-muted">Chargement...</p>}

        {granted &&
          groups.map(([group, { label, permissions }]) => {
            const grantedCount = permissions.filter((permission) => granted.has(permission.name)).length;
            const allGranted = grantedCount === permissions.length;

            return (
              <fieldset key={group} className="rounded-md border border-border p-4">
                <legend className="px-2 text-sm font-semibold text-foreground">{label}</legend>

                <div className="mb-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLocked || busy}
                    onClick={() => setGroup(permissions, !allGranted)}
                  >
                    {allGranted ? `Tout retirer (${label})` : `Tout attribuer (${label})`}
                  </Button>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {permissions.map((permission) => (
                    <li key={permission.id}>
                      <Checkbox
                        checked={isLocked || granted.has(permission.name)}
                        disabled={isLocked || busy}
                        onChange={(event) => toggle(permission, event.target.checked)}
                        label={
                          <span>
                            <span className="font-mono text-xs">{permission.name}</span>
                            {permission.description && <span className="block text-xs text-muted">{permission.description}</span>}
                          </span>
                        }
                      />
                    </li>
                  ))}
                </ul>
              </fieldset>
            );
          })}
      </CardContent>
    </Card>
  );
}
