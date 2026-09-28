import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScanCardPage from "@/app/(staff)/attendance/scan/page";
import { scanStudentCard } from "@/lib/api/attendance";

vi.mock("@/lib/api/attendance", () => ({ scanStudentCard: vi.fn() }));

vi.mock("@/components/attendance/QrScanner", () => ({
  QrScanner: ({ onScan }: { onScan: (decodedText: string) => void }) => (
    <button type="button" onClick={() => onScan("jeton-carte-1")}>
      Simuler un scan
    </button>
  ),
}));

const mockScanStudentCard = vi.mocked(scanStudentCard);

describe("ScanCardPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks the scanned student present and lists it", async () => {
    const user = userEvent.setup();
    mockScanStudentCard.mockResolvedValue({
      id: "a1",
      student: { id: "s1", name: "Fatou Diop", matricule: "MAA-1" },
      date: "2026-09-28",
      status: "present",
      justified: false,
      reason: null,
      source: "card_scan",
      checked_in_at: "2026-09-28T08:00:00Z",
    });

    render(<ScanCardPage />);
    await user.click(screen.getByRole("button", { name: "Simuler un scan" }));

    expect(await screen.findByText("Fatou Diop")).toBeInTheDocument();
    expect(screen.getByText("MAA-1")).toBeInTheDocument();
    expect(screen.getByText("Présent")).toBeInTheDocument();
    expect(mockScanStudentCard).toHaveBeenCalledWith("jeton-carte-1");
  });

  it("shows an unknown card without stopping the scanner", async () => {
    const user = userEvent.setup();
    mockScanStudentCard.mockRejectedValue({
      response: { data: { message: "Cette carte ne correspond a aucun eleve actif." } },
      isAxiosError: true,
    });

    render(<ScanCardPage />);
    await user.click(screen.getByRole("button", { name: "Simuler un scan" }));

    expect(await screen.findByText("Carte non reconnue")).toBeInTheDocument();
    expect(screen.getByText("Échec")).toBeInTheDocument();
    // Le scanner reste affiché : le surveillant peut enchaîner sur l'élève suivant.
    expect(screen.getByRole("button", { name: "Simuler un scan" })).toBeInTheDocument();
  });

  it("ignores an immediate repeat of the same card", async () => {
    const user = userEvent.setup();
    mockScanStudentCard.mockResolvedValue({
      id: "a1",
      student: { id: "s1", name: "Fatou Diop", matricule: "MAA-1" },
      date: "2026-09-28",
      status: "present",
      justified: false,
      reason: null,
      source: "card_scan",
      checked_in_at: "2026-09-28T08:00:00Z",
    });

    render(<ScanCardPage />);
    await user.click(screen.getByRole("button", { name: "Simuler un scan" }));
    await waitFor(() => expect(mockScanStudentCard).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("button", { name: "Simuler un scan" }));

    expect(mockScanStudentCard).toHaveBeenCalledTimes(1);
  });

  it("pauses and resumes the camera", async () => {
    const user = userEvent.setup();
    render(<ScanCardPage />);

    expect(screen.getByRole("button", { name: "Simuler un scan" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Mettre en pause/ }));

    expect(screen.queryByRole("button", { name: "Simuler un scan" })).not.toBeInTheDocument();
    expect(screen.getByText("Caméra en pause.")).toBeInTheDocument();
  });
});
