import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QrScanner } from "@/components/attendance/QrScanner";

const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn().mockResolvedValue(undefined);
const mockClear = vi.fn();

vi.mock("html5-qrcode", () => ({
  Html5Qrcode: class {
    start = mockStart;
    stop = mockStop;
    clear = mockClear;
  },
}));

describe("QrScanner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts the camera and reports a decoded code", async () => {
    const onScan = vi.fn();
    render(<QrScanner active onScan={onScan} />);

    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));

    const successCallback = mockStart.mock.calls[0][2] as (decodedText: string) => void;
    successCallback("jeton-scanne");

    expect(onScan).toHaveBeenCalledWith("jeton-scanne");
  });

  it("does not start the camera while inactive", async () => {
    render(<QrScanner active={false} onScan={vi.fn()} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("stops the camera on unmount", async () => {
    const { unmount } = render(<QrScanner active onScan={vi.fn()} />);
    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));

    unmount();

    await waitFor(() => expect(mockStop).toHaveBeenCalledTimes(1));
    expect(mockClear).toHaveBeenCalledTimes(1);
  });
});
