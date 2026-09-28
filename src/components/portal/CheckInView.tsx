"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MapPin, ScanLine } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { QrScanner } from "@/components/attendance/QrScanner";
import { checkInAtGate } from "@/lib/api/attendance";
import { getErrorMessage } from "@/lib/api/error";

type Phase = "scan" | "locating" | "checking" | "success" | "error";

/** Le QR affiché au portail encode une URL : `.../portal/checkin?token=...`. Un jeton scanné hors URL reste utilisable tel quel. */
function extractToken(decodedText: string): string {
  try {
    return new URL(decodedText).searchParams.get("token") ?? decodedText;
  } catch {
    return decodedText;
  }
}

/**
 * Pointage géolocalisé au portail (cahier des charges - pointage par QR
 * code, option 1). Deux façons d'y arriver : l'appareil photo natif du
 * téléphone ouvre directement cette page avec `?token=...` en scannant
 * l'affiche, ou l'élève/parent scanne depuis le scanner intégré ci-dessous.
 */
export function CheckInView({ initialToken }: { initialToken: string }) {
  const [phase, setPhase] = useState<Phase>(initialToken ? "locating" : "scan");
  const [message, setMessage] = useState<string | null>(null);

  const runCheckIn = useCallback((token: string) => {
    setPhase("locating");
    setMessage(null);

    if (!("geolocation" in navigator)) {
      setPhase("error");
      setMessage("Votre navigateur ne permet pas la géolocalisation, nécessaire pour pointer votre arrivée.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPhase("checking");
        checkInAtGate({ token, latitude: position.coords.latitude, longitude: position.coords.longitude })
          .then(() => setPhase("success"))
          .catch((failure) => {
            setPhase("error");
            setMessage(getErrorMessage(failure, "Impossible d'enregistrer votre pointage."));
          });
      },
      () => {
        setPhase("error");
        setMessage("Autorisez la localisation dans votre navigateur pour pointer votre arrivée.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    if (initialToken) runCheckIn(initialToken);
    // Uniquement au chargement de la page avec un jeton dans l'URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card accent="attendance" className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Pointer mon arrivée</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        {phase === "scan" && (
          <>
            <p className="text-sm text-muted">Scannez le QR code affiché au portail de l&apos;établissement.</p>
            <QrScanner active onScan={(decoded) => runCheckIn(extractToken(decoded))} />
          </>
        )}

        {phase === "locating" && (
          <>
            <MapPin className="size-10 animate-pulse text-primary" aria-hidden="true" />
            <p className="text-sm text-muted">Localisation en cours... autorisez l&apos;accès à votre position si votre navigateur le demande.</p>
          </>
        )}

        {phase === "checking" && (
          <>
            <ScanLine className="size-10 animate-pulse text-primary" aria-hidden="true" />
            <p className="text-sm text-muted">Vérification de votre présence au portail...</p>
          </>
        )}

        {phase === "success" && (
          <>
            <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Votre présence a été enregistrée.</p>
          </>
        )}

        {phase === "error" && (
          <>
            {message && <Alert>{message}</Alert>}
            <Button type="button" onClick={() => setPhase("scan")}>
              Réessayer
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
