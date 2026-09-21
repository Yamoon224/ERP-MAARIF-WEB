import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DonutChart } from "@/components/ui/charts/DonutChart";
import type { Slice } from "@/components/ui/charts/chartUtils";

const SLICES: Slice[] = [
  { key: "chalk", label: "Fournitures scolaires", value: 750_000, color: "var(--series-1)" },
  { key: "books", label: "Registres et imprimés", value: 250_000, color: "var(--series-2)" },
];

const money = (value: number) => `${value} FG`;

describe("DonutChart", () => {
  it("lists every part with its value and its share, in neutral text", () => {
    render(<DonutChart ariaLabel="Dépenses par catégorie" slices={SLICES} formatValue={money} />);

    const legend = screen.getByRole("list", { name: "Légende" });
    const chalk = within(legend).getByText("Fournitures scolaires").closest("li") as HTMLElement;
    expect(chalk).toHaveTextContent(money(750_000));
    expect(chalk).toHaveTextContent("75 %");
    expect(within(legend).getByText("Registres et imprimés").closest("li")).toHaveTextContent("25 %");
  });

  it("shows the total at the center, then the hovered part", () => {
    render(<DonutChart ariaLabel="Dépenses par catégorie" slices={SLICES} formatValue={money} totalLabel="dépensés" />);

    expect(screen.getByText(money(1_000_000))).toBeInTheDocument();
    expect(screen.getByText("dépensés")).toBeInTheDocument();

    fireEvent.pointerEnter(screen.getByText("Registres et imprimés").closest("li") as HTMLElement);

    // Le centre annonce la part survolée ; sa valeur est aussi dans la légende.
    expect(screen.getAllByText(money(250_000))).toHaveLength(2);
    expect(screen.queryByText("dépensés")).not.toBeInTheDocument();
  });

  it("uses a compact figure at the center when asked, the legend keeps the full amount", () => {
    render(<DonutChart ariaLabel="Dépenses" slices={SLICES} formatValue={money} formatCenter={(value) => `${value / 1000} k`} />);

    expect(screen.getByText("1000 k")).toBeInTheDocument();
    expect(screen.getByText(money(750_000))).toBeInTheDocument();
  });

  it("draws one arc per part, separated by a gap", () => {
    const { container } = render(<DonutChart ariaLabel="Dépenses" slices={SLICES} formatValue={money} />);

    // Un cercle de fond (piste) + un arc par part.
    const circles = container.querySelectorAll("svg circle");
    expect(circles).toHaveLength(3);
    const dash = circles[1].getAttribute("stroke-dasharray") ?? "";
    const circumference = 2 * Math.PI * 44;
    expect(Number(dash.split(" ")[0])).toBeCloseTo(circumference * 0.75 - 1.5, 1);
  });

  it("says so when there is nothing to show", () => {
    render(<DonutChart ariaLabel="Dépenses" slices={[]} formatValue={money} emptyMessage="Aucune dépense sur la période." />);

    expect(screen.getByText("Aucune dépense sur la période.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
