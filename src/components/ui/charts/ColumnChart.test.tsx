import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ColumnChart, type ColumnDatum, type ColumnSeries } from "@/components/ui/charts/ColumnChart";

const SERIES: ColumnSeries[] = [
  { key: "collected", label: "Encaissements", color: "var(--series-1)" },
  { key: "spent", label: "Dépenses", color: "var(--series-2)" },
];

const DATA: ColumnDatum[] = [
  { label: "oct.", fullLabel: "octobre 2025", values: { collected: 1_000_000, spent: 250_000 } },
  { label: "nov.", fullLabel: "novembre 2025", values: { collected: 400_000, spent: 0 } },
];

const money = (value: number) => `${value} FG`;

describe("ColumnChart", () => {
  it("shows a legend as soon as there are two series", () => {
    render(<ColumnChart ariaLabel="Encaissements et dépenses" series={SERIES} data={DATA} formatValue={money} />);

    const legend = screen.getByRole("list", { name: "Légende" });
    expect(within(legend).getByText("Encaissements")).toBeInTheDocument();
    expect(within(legend).getByText("Dépenses")).toBeInTheDocument();
  });

  it("needs no legend box for a single series", () => {
    render(<ColumnChart ariaLabel="Effectif" series={[SERIES[0]]} data={DATA} formatValue={money} />);

    expect(screen.queryByRole("list", { name: "Légende" })).not.toBeInTheDocument();
  });

  it("draws round axis ticks up to a clean maximum", () => {
    render(<ColumnChart ariaLabel="Encaissements et dépenses" series={SERIES} data={DATA} formatValue={money} />);

    // 1 000 000 est déjà un maximum rond : l'axe va de 0 à 1 M par quarts.
    expect(screen.getByText("1 M")).toBeInTheDocument();
    expect(screen.getByText("500 k")).toBeInTheDocument();
  });

  it("shows the details of a group on hover", () => {
    const { container } = render(<ColumnChart ariaLabel="Encaissements et dépenses" series={SERIES} data={DATA} formatValue={money} />);

    expect(screen.queryAllByText("octobre 2025", { selector: "p" })).toHaveLength(0);

    const groups = container.querySelectorAll("[role='img'] .flex.h-full");
    fireEvent.pointerEnter(groups[0]);

    const tooltip = screen.getByText("octobre 2025", { selector: "p" }).parentElement as HTMLElement;
    expect(within(tooltip).getByText("Encaissements")).toBeInTheDocument();
    expect(within(tooltip).getByText(money(1_000_000))).toBeInTheDocument();
    expect(within(tooltip).getByText(money(250_000))).toBeInTheDocument();
  });

  it("keeps every value readable in a table", () => {
    render(<ColumnChart ariaLabel="Encaissements et dépenses" series={SERIES} data={DATA} formatValue={money} />);

    const table = screen.getByRole("table", { name: "Encaissements et dépenses", hidden: true });
    const november = within(table).getByRole("row", { name: /novembre 2025/, hidden: true });
    expect(within(november).getByText(money(400_000))).toBeInTheDocument();
    expect(within(november).getByText(money(0))).toBeInTheDocument();
  });

  it("uses whole numbers for headcounts", () => {
    render(
      <ColumnChart
        ariaLabel="Effectif par classe"
        integer
        series={[{ key: "students", label: "Élèves", color: "var(--series-1)" }]}
        data={[{ label: "6eme A", values: { students: 3 } }]}
        formatValue={(count) => `${count} élèves`}
      />,
    );

    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.queryByText("0,5")).not.toBeInTheDocument();
  });
});
