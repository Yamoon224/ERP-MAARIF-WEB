"use client";

import { useEffect, useId, useRef } from "react";

interface QrScannerProps {
  /** Appelé à chaque code décodé (peut être appelé plusieurs fois pour le même code tant que la caméra le voit). */
  onScan: (decodedText: string) => void;
  /** Démarre ou arrête la caméra. */
  active: boolean;
  className?: string;
}

/**
 * Lecteur de QR code par caméra, utilisé pour le scan d'une carte élève
 * (personnel) et le scan du QR du portail (portail parent/élève). Encapsule
 * `html5-qrcode`, dont l'API est impérative (start/stop sur un élément DOM),
 * mal adaptée à un rendu React direct.
 */
export function QrScanner({ onScan, active, className }: QrScannerProps) {
  const elementId = `qr-scanner-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;

    let stopped = false;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (stopped) return;

      scanner = new Html5Qrcode(elementId);
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText) => onScanRef.current(decodedText),
          () => {},
        )
        .catch(() => {});
    });

    return () => {
      stopped = true;
      scanner
        ?.stop()
        .then(() => scanner?.clear())
        .catch(() => {});
    };
  }, [active, elementId]);

  return <div id={elementId} className={className ?? "mx-auto w-full max-w-xs overflow-hidden rounded-lg"} />;
}
