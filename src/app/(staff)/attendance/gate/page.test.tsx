import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GateSettingsPage from "@/app/(staff)/attendance/gate/page";
import {
  getGatePosterBlob,
  getGateQrBlob,
  getGateSettings,
  regenerateGateToken,
  updateGateSettings,
} from "@/lib/api/attendance";
import { downloadBlob } from "@/lib/export/tableExport";

vi.mock("@/lib/api/attendance", () => ({
  getGateSettings: vi.fn(),
  updateGateSettings: vi.fn(),
  regenerateGateToken: vi.fn(),
  getGateQrBlob: vi.fn(),
  getGatePosterBlob: vi.fn(),
}));

vi.mock("@/lib/export/tableExport", () => ({ downloadBlob: vi.fn() }));

const mockGetGateSettings = vi.mocked(getGateSettings);
const mockUpdateGateSettings = vi.mocked(updateGateSettings);
const mockRegenerateGateToken = vi.mocked(regenerateGateToken);
const mockGetGateQrBlob = vi.mocked(getGateQrBlob);
const mockGetGatePosterBlob = vi.mocked(getGatePosterBlob);

const baseSettings = {
  latitude: 14.6937,
  longitude: -17.4441,
  radius_meters: 100,
  is_enabled: true,
  gate_token: "jeton-1",
  updated_at: "2026-09-28T08:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetGateSettings.mockResolvedValue(baseSettings);
  mockGetGateQrBlob.mockResolvedValue(new Blob(["png"]));
  URL.createObjectURL = vi.fn().mockReturnValue("blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("GateSettingsPage", () => {
  it("loads and displays the current setting", async () => {
    render(<GateSettingsPage />);

    expect(await screen.findByLabelText("Latitude")).toHaveValue(14.6937);
    expect(screen.getByLabelText("Longitude")).toHaveValue(-17.4441);
    expect(screen.getByLabelText("Rayon de tolérance (mètres)")).toHaveValue(100);
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByAltText("QR code de pointage du portail")).toHaveAttribute("src", "blob:preview");
  });

  it("saves the updated setting", async () => {
    const user = userEvent.setup();
    mockUpdateGateSettings.mockResolvedValue({ ...baseSettings, radius_meters: 150 });
    render(<GateSettingsPage />);

    const radius = await screen.findByLabelText("Rayon de tolérance (mètres)");
    await user.clear(radius);
    await user.type(radius, "150");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() =>
      expect(mockUpdateGateSettings).toHaveBeenCalledWith({ latitude: 14.6937, longitude: -17.4441, radius_meters: 150, is_enabled: true }),
    );
    expect(await screen.findByText("Réglage enregistré.")).toBeInTheDocument();
  });

  it("asks for confirmation before regenerating the token, and reloads the QR", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockRegenerateGateToken.mockResolvedValue({ ...baseSettings, gate_token: "jeton-2" });

    render(<GateSettingsPage />);
    await user.click(await screen.findByRole("button", { name: /Régénérer le code/ }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(mockRegenerateGateToken).toHaveBeenCalled());
    expect(await screen.findByText(/QR régénéré/)).toBeInTheDocument();
  });

  it("does not regenerate the token when the confirmation is declined", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<GateSettingsPage />);
    await user.click(await screen.findByRole("button", { name: /Régénérer le code/ }));

    expect(mockRegenerateGateToken).not.toHaveBeenCalled();
  });

  it("downloads the poster", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["%PDF"]);
    mockGetGatePosterBlob.mockResolvedValue(blob);

    render(<GateSettingsPage />);
    await user.click(await screen.findByRole("button", { name: /Télécharger l'affiche/ }));

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, "affiche-pointage-portail.pdf"));
  });

  it("warns when the gate is disabled", async () => {
    mockGetGateSettings.mockResolvedValue({ ...baseSettings, is_enabled: false });

    render(<GateSettingsPage />);

    expect(await screen.findByText(/ce QR ne fonctionnera pas/)).toBeInTheDocument();
  });
});
