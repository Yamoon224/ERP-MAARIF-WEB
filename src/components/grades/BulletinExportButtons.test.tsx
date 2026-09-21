import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulletinExportButtons } from "@/components/grades/BulletinExportButtons";
import { downloadBlob } from "@/lib/export/tableExport";

vi.mock("@/lib/export/tableExport", () => ({ downloadBlob: vi.fn() }));

describe("BulletinExportButtons", () => {
  beforeEach(() => vi.clearAllMocks());

  it("downloads the PDF under the given file name", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["%PDF"]);
    const load = vi.fn().mockResolvedValue(blob);
    render(<BulletinExportButtons fileName="bulletin-maa-1" load={load} />);

    await user.click(screen.getByRole("button", { name: "Bulletin PDF" }));

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, "bulletin-maa-1.pdf"));
    expect(load).toHaveBeenCalledWith("pdf");
  });

  it("downloads the Excel file under the given file name", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["PK"]);
    const load = vi.fn().mockResolvedValue(blob);
    render(<BulletinExportButtons fileName="bulletin-maa-1" load={load} />);

    await user.click(screen.getByRole("button", { name: "Bulletin Excel" }));

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, "bulletin-maa-1.xlsx"));
    expect(load).toHaveBeenCalledWith("xlsx");
  });

  it("tells the user when the export fails, and lets them try again", async () => {
    const user = userEvent.setup();
    const load = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValueOnce(new Blob(["%PDF"]));
    render(<BulletinExportButtons fileName="bulletin" load={load} />);

    await user.click(screen.getByRole("button", { name: "Bulletin PDF" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("n'a pas pu être exporté");
    expect(downloadBlob).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Bulletin PDF" }));
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays disabled while there is no bulletin to export", () => {
    render(<BulletinExportButtons fileName="bulletin" load={vi.fn()} disabled />);

    expect(screen.getByRole("button", { name: "Bulletin PDF" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bulletin Excel" })).toBeDisabled();
  });
});
