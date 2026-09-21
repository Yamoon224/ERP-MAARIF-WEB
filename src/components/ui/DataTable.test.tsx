import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { exportPdf, exportSql, exportXlsx, printTable } from "@/lib/export/tableExport";

// Les fichiers eux-mêmes (jsPDF, Excel, téléchargement) relèvent du navigateur : on vérifie ce que le tableau leur transmet.
vi.mock("@/lib/export/tableExport", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/export/tableExport")>();

  return {
    ...actual,
    exportPdf: vi.fn().mockResolvedValue(undefined),
    exportXlsx: vi.fn().mockResolvedValue(undefined),
    exportSql: vi.fn(),
    printTable: vi.fn(),
  };
});

interface Row {
  id: string;
  name: string;
  amount: number;
}

const rows: Row[] = [
  { id: "1", name: "Fatoumata", amount: 1250000 },
  { id: "2", name: "Ibrahima", amount: 90000 },
  { id: "3", name: "Aïssatou", amount: 400000 },
];

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Nom", render: (row) => row.name },
  { key: "amount", header: "Montant", render: (row) => `${row.amount.toLocaleString("fr-FR")} FG`, value: (row) => row.amount },
  { key: "actions", header: "", render: (row) => <a href={`/rows/${row.id}`}>Voir</a> },
];

/** Noms affichés dans la première colonne, dans l'ordre des lignes. */
function displayedNames(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent ?? "");
}

describe("DataTable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders one row per item", () => {
    render(<DataTable columns={columns} rows={rows.slice(0, 2)} rowKey={(row) => row.id} />);

    expect(screen.getByText("Fatoumata")).toBeInTheDocument();
    expect(screen.getByText("Ibrahima")).toBeInTheDocument();
  });

  it("shows a loading state instead of rows while loading", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} isLoading />);

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("shows a custom empty message once loading has finished with no rows", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} emptyMessage="Aucun eleve trouve." />);

    expect(screen.getByText("Aucun eleve trouve.")).toBeInTheDocument();
  });

  describe("appearance", () => {
    it("draws the header with the blue-to-white gradient, and stripes and highlights the rows", () => {
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

      const [headerRow, firstRow] = screen.getAllByRole("row");
      expect(headerRow).toHaveClass("bg-brand-fade");
      expect(firstRow).toHaveClass("even:bg-primary/5", "hover:bg-primary/10");
    });
  });

  describe("sorting", () => {
    it("gives every titled column a sort control, and none to the untitled actions column", () => {
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

      expect(screen.getByRole("button", { name: "Nom" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Montant" })).toBeInTheDocument();
      expect(within(screen.getAllByRole("columnheader")[2]).queryByRole("button")).not.toBeInTheDocument();
    });

    it("sorts ascending, then descending, then switches the sort off", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);
      const nameHeader = screen.getByRole("columnheader", { name: /Nom/ });

      expect(displayedNames()).toEqual(["Fatoumata", "Ibrahima", "Aïssatou"]);
      expect(nameHeader).toHaveAttribute("aria-sort", "none");

      await user.click(screen.getByRole("button", { name: "Nom" }));
      expect(displayedNames()).toEqual(["Aïssatou", "Fatoumata", "Ibrahima"]);
      expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

      await user.click(screen.getByRole("button", { name: "Nom" }));
      expect(displayedNames()).toEqual(["Ibrahima", "Fatoumata", "Aïssatou"]);
      expect(nameHeader).toHaveAttribute("aria-sort", "descending");

      await user.click(screen.getByRole("button", { name: "Nom" }));
      expect(displayedNames()).toEqual(["Fatoumata", "Ibrahima", "Aïssatou"]);
      expect(nameHeader).toHaveAttribute("aria-sort", "none");
    });

    it("sorts a column on its raw value rather than on the text shown", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

      await user.click(screen.getByRole("button", { name: "Montant" }));

      // Au texte, « 1 250 000 FG » passerait avant « 400 000 FG » ; à la valeur, c'est l'inverse.
      expect(displayedNames()).toEqual(["Ibrahima", "Aïssatou", "Fatoumata"]);
    });

    it("keeps a single active sort column at a time", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

      await user.click(screen.getByRole("button", { name: "Nom" }));
      await user.click(screen.getByRole("button", { name: "Montant" }));

      expect(screen.getByRole("columnheader", { name: /Nom/ })).toHaveAttribute("aria-sort", "none");
      expect(screen.getByRole("columnheader", { name: /Montant/ })).toHaveAttribute("aria-sort", "ascending");
    });

    it("lets a column opt out of sorting", () => {
      const noSort: DataTableColumn<Row>[] = [{ key: "name", header: "Nom", sortable: false, render: (row) => row.name }];
      render(<DataTable columns={noSort} rows={rows} rowKey={(row) => row.id} />);

      expect(screen.queryByRole("button", { name: "Nom" })).not.toBeInTheDocument();
    });
  });

  describe("export", () => {
    it("offers PDF, Excel, print and SQL", () => {
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

      for (const label of ["PDF", "Excel", "Imprimer", "SQL"]) {
        expect(screen.getByRole("button", { name: label })).toBeEnabled();
      }
    });

    it("disables the export while there is nothing to export", () => {
      render(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} />);

      expect(screen.getByRole("button", { name: "PDF" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "SQL" })).toBeDisabled();
    });

    it("can hide the export bar", () => {
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} exportable={false} />);

      expect(screen.queryByRole("button", { name: "PDF" })).not.toBeInTheDocument();
    });

    it("exports the titled columns only, in the order displayed", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} exportName="Élèves inscrits" />);

      await user.click(screen.getByRole("button", { name: "Montant" }));
      await user.click(screen.getByRole("button", { name: "PDF" }));

      await waitFor(() => expect(exportPdf).toHaveBeenCalledTimes(1));
      expect(exportPdf).toHaveBeenCalledWith(
        {
          title: "Élèves inscrits",
          headers: ["Nom", "Montant"],
          rows: [
            ["Ibrahima", 90000],
            ["Aïssatou", 400000],
            ["Fatoumata", 1250000],
          ],
        },
        "eleves-inscrits",
      );
    });

    it("sends the same data to Excel, print and SQL", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} exportName="Élèves inscrits" />);

      await user.click(screen.getByRole("button", { name: "Excel" }));
      await waitFor(() => expect(exportXlsx).toHaveBeenCalledTimes(1));
      expect(vi.mocked(exportXlsx).mock.calls[0][1]).toBe("eleves-inscrits");

      await user.click(screen.getByRole("button", { name: "Imprimer" }));
      await waitFor(() => expect(printTable).toHaveBeenCalledTimes(1));
      expect(vi.mocked(printTable).mock.calls[0][0].headers).toEqual(["Nom", "Montant"]);

      await user.click(screen.getByRole("button", { name: "SQL" }));
      await waitFor(() => expect(exportSql).toHaveBeenCalledTimes(1));
      expect(vi.mocked(exportSql).mock.calls[0].slice(1)).toEqual(["eleves-inscrits", "eleves_inscrits"]);
    });

    it("exports every row of the data set when it can load them all, sorted like the screen", async () => {
      const user = userEvent.setup();
      const everyRow: Row[] = [...rows, { id: "4", name: "Boubacar", amount: 5 }];
      const exportAll = vi.fn().mockResolvedValue(everyRow);
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} exportAll={exportAll} />);

      await user.click(screen.getByRole("button", { name: "Nom" }));
      await user.click(screen.getByRole("button", { name: "Excel" }));

      await waitFor(() => expect(exportXlsx).toHaveBeenCalledTimes(1));
      expect(exportAll).toHaveBeenCalledTimes(1);
      expect(vi.mocked(exportXlsx).mock.calls[0][0].rows.map((row) => row[0])).toEqual(["Aïssatou", "Boubacar", "Fatoumata", "Ibrahima"]);
    });

    it("reports a failed export instead of failing silently", async () => {
      const user = userEvent.setup();
      vi.mocked(exportPdf).mockRejectedValueOnce(new Error("boom"));
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

      await user.click(screen.getByRole("button", { name: "PDF" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("L'export a échoué");
      expect(screen.getByRole("button", { name: "PDF" })).toBeEnabled();
    });
  });
});
