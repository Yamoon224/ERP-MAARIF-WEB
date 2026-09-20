import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

interface Row {
  id: string;
  name: string;
}

const columns: DataTableColumn<Row>[] = [{ key: "name", header: "Nom", render: (row) => row.name }];

describe("DataTable", () => {
  it("renders one row per item", () => {
    const rows: Row[] = [{ id: "1", name: "Fatoumata" }, { id: "2", name: "Ibrahima" }];

    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

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
});
