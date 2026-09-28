"use client";

import { useRef, useState } from "react";
import { Pause, Play, ScanLine } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { QrScanner } from "@/components/attendance/QrScanner";
import { scanStudentCard } from "@/lib/api/attendance";
import { getErrorMessage } from "@/lib/api/error";
import type { AttendanceRecord } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
import { formatDateTime } from "@/lib/utils/format";

interface ScanEntry {
  key: string;
  name: string;
  matricule: string;
  time: string;
  error?: string;
}

/**
 * Pointage par carte scolaire (cahier des charges — pointage par QR code,
 * option 2) : le surveillant scanne le QR de la carte de l'élève à son
 * arrivée au portail, ce qui suffit à le pointer présent pour aujourd'hui.
 */
export default function ScanCardPage() {
  const { t } = useT();
  const [active, setActive] = useState(true);
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const busyRef = useRef(false);
  const lastScanRef = useRef<{ token: string; at: number } | null>(null);

  async function handleScan(token: string) {
    // La caméra redécode le même code à chaque image tant qu'il est visible :
    // on ignore les répétitions du même jeton dans les quelques secondes qui suivent.
    const now = Date.now();
    if (busyRef.current) return;
    if (lastScanRef.current && lastScanRef.current.token === token && now - lastScanRef.current.at < 4000) return;

    lastScanRef.current = { token, at: now };
    busyRef.current = true;

    try {
      const record: AttendanceRecord = await scanStudentCard(token);
      setEntries((current) => [
        { key: `${record.id}-${now}`, name: record.student.name, matricule: record.student.matricule, time: formatDateTime(new Date().toISOString()) },
        ...current,
      ]);
    } catch (failure) {
      setEntries((current) => [
        {
          key: `error-${now}`,
          name: t("Carte non reconnue"),
          matricule: "—",
          time: formatDateTime(new Date().toISOString()),
          error: getErrorMessage(failure, t("Cette carte ne correspond à aucun élève actif.")),
        },
        ...current,
      ]);
    } finally {
      busyRef.current = false;
    }
  }

  return (
    <div>
      <PageHeader
        title={t("Scanner une carte")}
        description={t("Pointez l'arrivée d'un élève en scannant le QR de sa carte scolaire.")}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card accent="attendance">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="size-4" aria-hidden="true" /> {t("Caméra")}
            </CardTitle>
            <Button type="button" size="sm" variant="secondary" onClick={() => setActive((value) => !value)}>
              {active ? (
                <>
                  <Pause className="size-4" /> {t("Mettre en pause")}
                </>
              ) : (
                <>
                  <Play className="size-4" /> {t("Reprendre")}
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {active ? (
              <QrScanner active={active} onScan={handleScan} />
            ) : (
              <p className="py-10 text-center text-sm text-muted">{t("Caméra en pause.")}</p>
            )}
          </CardContent>
        </Card>

        <Card accent="attendance">
          <CardHeader>
            <CardTitle>Derniers pointages</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted">{t("Les élèves pointés apparaîtront ici au fur et à mesure du scan.")}</p>
            ) : (
              <ul className="space-y-3">
                {entries.map((entry) => (
                  <li key={entry.key} className="flex items-center justify-between gap-3 border-b border-border pb-2.5 text-sm last:border-0">
                    <span>
                      <span className="font-medium text-foreground">{entry.name}</span>
                      {entry.matricule !== "—" && <span className="ml-2 font-mono text-xs text-muted">{entry.matricule}</span>}
                      {entry.error && <Alert className="mt-1">{entry.error}</Alert>}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted">{entry.time}</span>
                      <Badge tone={entry.error ? "danger" : "success"}>{entry.error ? t("Échec") : t("Présent")}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
