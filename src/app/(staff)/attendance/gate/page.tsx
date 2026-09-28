"use client";

import { useEffect, useState } from "react";
import { Crosshair, Download, RefreshCw } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getGatePosterBlob,
  getGateQrBlob,
  getGateSettings,
  regenerateGateToken,
  updateGateSettings,
} from "@/lib/api/attendance";
import { getErrorMessage } from "@/lib/api/error";
import type { GateSettings } from "@/lib/api/types";
import { downloadBlob } from "@/lib/export/tableExport";
import { useT } from "@/lib/i18n/store";

/**
 * Pointage géolocalisé au portail (cahier des charges — pointage par QR
 * code, option 1) : coordonnées et rayon de tolérance de l'établissement, et
 * export du QR à imprimer et afficher au portail.
 */
export default function GateSettingsPage() {
  const { t } = useT();
  const [settings, setSettings] = useState<GateSettings | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");
  const [enabled, setEnabled] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function applySettings(loaded: GateSettings) {
    setSettings(loaded);
    setLatitude(loaded.latitude?.toString() ?? "");
    setLongitude(loaded.longitude?.toString() ?? "");
    setRadius(String(loaded.radius_meters));
    setEnabled(loaded.is_enabled);
  }

  async function reloadQr() {
    const blob = await getGateQrBlob();
    setQrUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(blob);
    });
  }

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getGateSettings(), getGateQrBlob()])
      .then(([loaded, blob]) => {
        applySettings(loaded);
        setQrUrl(URL.createObjectURL(blob));
      })
      .catch((failure) => setError(getErrorMessage(failure, t("Impossible de charger le réglage du portail."))))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useCurrentPosition() {
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
      },
      () => setError(t("Impossible de récupérer votre position. Autorisez la localisation dans votre navigateur.")),
    );
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateGateSettings({
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius_meters: Number(radius),
        is_enabled: enabled,
      });
      applySettings(updated);
      setNotice(t("Réglage enregistré."));
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible d'enregistrer le réglage.")));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!window.confirm(t("Régénérer le code invalide l'affiche déjà imprimée : il faudra la réimprimer. Continuer ?"))) return;

    setIsRegenerating(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await regenerateGateToken();
      applySettings(updated);
      await reloadQr();
      setNotice(t("QR régénéré : téléchargez et affichez la nouvelle affiche."));
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible de régénérer le code.")));
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleDownloadPoster() {
    try {
      downloadBlob(await getGatePosterBlob(), "affiche-pointage-portail.pdf");
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible de télécharger l'affiche.")));
    }
  }

  return (
    <div>
      <PageHeader
        title={t("Portail QR")}
        description={t("Pointage géolocalisé : réglez les coordonnées du portail et imprimez l'affiche à scanner.")}
      />

      {isLoading ? (
        <p className="text-sm text-muted">{t("Chargement...")}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card accent="attendance">
            <CardHeader>
              <CardTitle>Coordonnées et rayon de tolérance</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="gate-lat">Latitude</Label>
                    <Input id="gate-lat" type="number" step="any" required value={latitude} onChange={(event) => setLatitude(event.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="gate-lng">Longitude</Label>
                    <Input id="gate-lng" type="number" step="any" required value={longitude} onChange={(event) => setLongitude(event.target.value)} />
                  </div>
                </div>

                <Button type="button" variant="secondary" size="sm" onClick={useCurrentPosition}>
                  <Crosshair className="size-4" /> {t("Utiliser ma position actuelle")}
                </Button>

                <div>
                  <Label htmlFor="gate-radius">Rayon de tolérance (mètres)</Label>
                  <Input id="gate-radius" type="number" min={10} max={1000} required value={radius} onChange={(event) => setRadius(event.target.value)} />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 rounded border-border" />
                  {t("Activer le pointage par QR au portail")}
                </label>

                {error && <Alert>{error}</Alert>}
                {notice && <p className="text-sm text-success">{notice}</p>}

                <Button type="submit" loading={isSaving}>
                  {t("Enregistrer")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card accent="attendance">
            <CardHeader>
              <CardTitle>Affiche à imprimer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {qrUrl && <img src={qrUrl} alt={t("QR code de pointage du portail")} className="size-56 rounded-md border border-border" />}
              {settings && !settings.is_enabled && (
                <p className="text-center text-xs text-warning">
                  {t("Le pointage est désactivé : ce QR ne fonctionnera pas tant qu'il n'est pas activé.")}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="secondary" onClick={handleDownloadPoster}>
                  <Download className="size-4" /> {t("Télécharger l'affiche (PDF)")}
                </Button>
                <Button type="button" variant="danger" loading={isRegenerating} onClick={handleRegenerate}>
                  <RefreshCw className="size-4" /> {t("Régénérer le code")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
