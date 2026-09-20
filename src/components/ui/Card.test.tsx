import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("uses the rounded-md corners and a distinct top border mandated by the design system", () => {
    render(<Card data-testid="card">Contenu</Card>);

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("rounded-md");
    expect(card).toHaveClass("border-t-4");
  });

  it("colors the top border according to the requested accent", () => {
    render(
      <Card data-testid="card" accent="discipline">
        Contenu
      </Card>,
    );

    expect(screen.getByTestId("card")).toHaveClass("border-t-accent-discipline");
  });

  it("falls back to a neutral accent when none is provided", () => {
    render(<Card data-testid="card">Contenu</Card>);

    expect(screen.getByTestId("card")).toHaveClass("border-t-border");
  });
});
