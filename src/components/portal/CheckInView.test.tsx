import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckInView } from "@/components/portal/CheckInView";
import { checkInAtGate } from "@/lib/api/attendance";

vi.mock("@/lib/api/attendance", () => ({ checkInAtGate: vi.fn() }));

vi.mock("@/components/attendance/QrScanner", () => ({
  QrScanner: ({ onScan }: { onScan: (decodedText: string) => void }) => (
    <button type="button" onClick={() => onScan("http://localhost:3000/portal/checkin?token=jeton-portail")}>
      Simuler un scan
    </button>
  ),
}));

const mockCheckInAtGate = vi.mocked(checkInAtGate);
const mockGetCurrentPosition = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: mockGetCurrentPosition },
  });
});

describe("CheckInView", () => {
  it("checks in automatically when the page opens with a token in the URL", async () => {
    mockGetCurrentPosition.mockImplementation((success) => success({ coords: { latitude: 14.6937, longitude: -17.4441 } }));
    mockCheckInAtGate.mockResolvedValue({
      id: "a1",
      student: { id: "s1", name: "Fatou Diop", matricule: "MAA-1" },
      date: "2026-09-28",
      status: "present",
      justified: false,
      reason: null,
      source: "self_service",
      checked_in_at: "2026-09-28T08:00:00Z",
    });

    render(<CheckInView initialToken="jeton-portail" />);

    await waitFor(() => expect(mockCheckInAtGate).toHaveBeenCalledWith({ token: "jeton-portail", latitude: 14.6937, longitude: -17.4441 }));
    expect(await screen.findByText("Votre présence a été enregistrée.")).toBeInTheDocument();
  });

  it("lets the student scan the gate poster from the portal itself when no token is in the URL", async () => {
    const user = userEvent.setup();
    mockGetCurrentPosition.mockImplementation((success) => success({ coords: { latitude: 14.6937, longitude: -17.4441 } }));
    mockCheckInAtGate.mockResolvedValue({
      id: "a1",
      student: { id: "s1", name: "Fatou Diop", matricule: "MAA-1" },
      date: "2026-09-28",
      status: "present",
      justified: false,
      reason: null,
      source: "self_service",
      checked_in_at: "2026-09-28T08:00:00Z",
    });

    render(<CheckInView initialToken="" />);
    await user.click(screen.getByRole("button", { name: "Simuler un scan" }));

    await waitFor(() => expect(mockCheckInAtGate).toHaveBeenCalledWith({ token: "jeton-portail", latitude: 14.6937, longitude: -17.4441 }));
    expect(await screen.findByText("Votre présence a été enregistrée.")).toBeInTheDocument();
  });

  it("shows the server's refusal and lets the student try again", async () => {
    const user = userEvent.setup();
    mockGetCurrentPosition.mockImplementation((success) => success({ coords: { latitude: 14.7, longitude: -17.5 } }));
    mockCheckInAtGate.mockRejectedValue({
      response: { data: { message: "Vous etes a 500 m du portail : rapprochez-vous pour pointer votre arrivee." } },
      isAxiosError: true,
    });

    render(<CheckInView initialToken="jeton-portail" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("rapprochez-vous");
    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(screen.getByRole("button", { name: "Simuler un scan" })).toBeInTheDocument();
  });

  it("tells the student to allow geolocation when the browser refuses", async () => {
    mockGetCurrentPosition.mockImplementation((_success, error) => error());

    render(<CheckInView initialToken="jeton-portail" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Autorisez la localisation");
  });
});
