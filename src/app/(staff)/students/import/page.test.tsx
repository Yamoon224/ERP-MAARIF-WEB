import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentImportPage from "@/app/(staff)/students/import/page";
import { server } from "@/test/msw/server";

const API_URL = "http://localhost:8000/api";

function file(content = "prenom,nom\nJean,Kouassi\n") {
  return new File([content], "eleves.csv", { type: "text/csv" });
}

async function chooseFile(user: ReturnType<typeof userEvent.setup>) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file());
}

describe("StudentImportPage", () => {
  it("accepts CSV, Excel and SQL exports", () => {
    render(<StudentImportPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe(".csv,.txt,.xlsx,.xls,.sql");
  });

  it("downloads a fillable CSV template", async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:mock");
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const user = userEvent.setup();
    render(<StudentImportPage />);
    await user.click(screen.getByRole("button", { name: "CSV" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toContain("text/csv");
    expect(await blob.text()).toContain("prenom,nom,sexe");

    click.mockRestore();
    vi.unstubAllGlobals();
  });

  it("analyzes the file first, without importing anything", async () => {
    let dryRun: string | null = null;
    server.use(
      http.post(`${API_URL}/students/import`, async ({ request }) => {
        const body = await request.formData();
        dryRun = body.get("dry_run") as string;
        return HttpResponse.json({
          data: {
            total: 2,
            valid: 1,
            invalid: 1,
            dry_run: true,
            errors: [{ row: 3, messages: ["Le tuteur est obligatoire."] }],
            students: [],
          },
        });
      }),
    );
    const user = userEvent.setup();
    render(<StudentImportPage />);

    await chooseFile(user);
    await user.click(screen.getByRole("button", { name: /Analyser le fichier/ }));

    expect(await screen.findByText("Aperçu de l'import")).toBeInTheDocument();
    expect(screen.getByText("Le tuteur est obligatoire.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmer l'import de 1 élève/ })).toBeInTheDocument();
    expect(dryRun).toBe("1");
  });

  it("confirms the import and shows the credentials to hand out", async () => {
    server.use(
      http.post(`${API_URL}/students/import`, async ({ request }) => {
        const body = await request.formData();
        const dryRun = body.get("dry_run") === "1";

        return HttpResponse.json({
          data: dryRun
            ? { total: 1, valid: 1, invalid: 0, dry_run: true, errors: [], students: [] }
            : {
                total: 1,
                valid: 1,
                invalid: 0,
                dry_run: false,
                errors: [],
                students: [{ matricule: "M-0001", name: "Jean Kouassi", initial_password: "aB3xK9" }],
              },
        });
      }),
    );
    const user = userEvent.setup();
    render(<StudentImportPage />);

    await chooseFile(user);
    await user.click(screen.getByRole("button", { name: /Analyser le fichier/ }));
    await user.click(await screen.findByRole("button", { name: /Confirmer l'import de 1 élève/ }));

    expect(await screen.findByText("Import terminé")).toBeInTheDocument();
    expect(screen.getByText("M-0001")).toBeInTheDocument();
    expect(screen.getByText("aB3xK9")).toBeInTheDocument();
  });

  it("shows the API error when the file cannot be analyzed", async () => {
    server.use(
      http.post(`${API_URL}/students/import`, () =>
        HttpResponse.json({ message: "Ce fichier n'est pas reconnu.", error_code: "import_invalid_file", context: {} }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    render(<StudentImportPage />);

    await chooseFile(user);
    await user.click(screen.getByRole("button", { name: /Analyser le fichier/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ce fichier n'est pas reconnu.");
  });
});
