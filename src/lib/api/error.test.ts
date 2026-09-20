import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getErrorMessage } from "@/lib/api/error";

function buildAxiosError(message: string) {
  return new AxiosError("Request failed", "400", undefined, undefined, {
    status: 422,
    statusText: "Unprocessable Content",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data: { message, error_code: "validation_failed" },
  });
}

describe("getErrorMessage", () => {
  it("extracts the message carried by the API's error payload", () => {
    expect(getErrorMessage(buildAxiosError("Identifiants invalides."))).toBe("Identifiants invalides.");
  });

  it("falls back to a generic message for a non-Axios error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("Une erreur est survenue. Veuillez reessayer.");
  });

  it("honours a caller-supplied fallback message", () => {
    expect(getErrorMessage(new Error("boom"), "Mot de passe incorrect.")).toBe("Mot de passe incorrect.");
  });
});
