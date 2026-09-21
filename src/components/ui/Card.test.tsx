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

  it("draws the blue accents as a gradient bar instead of a solid border", () => {
    render(
      <Card data-testid="card" accent="primary">
        Contenu
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("border-t-transparent");
    expect(card).toHaveClass("before:bg-brand");
    expect(card).not.toHaveClass("border-t-primary");
  });

  it("falls back to a neutral accent when none is provided", () => {
    render(<Card data-testid="card">Contenu</Card>);

    expect(screen.getByTestId("card")).toHaveClass("border-t-border");
  });
});
