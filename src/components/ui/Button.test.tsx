import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders its label and reacts to clicks", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Enregistrer</Button>);

    const button = screen.getByRole("button", { name: "Enregistrer" });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses the rounded-full shape mandated by the design system", () => {
    render(<Button>Valider</Button>);

    expect(screen.getByRole("button", { name: "Valider" })).toHaveClass("rounded-full");
  });

  it("is disabled and inert while loading", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button loading onClick={onClick}>
        Envoi...
      </Button>,
    );

    const button = screen.getByRole("button", { name: /Envoi/ });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("respects an explicit disabled prop", () => {
    render(<Button disabled>Indisponible</Button>);

    expect(screen.getByRole("button", { name: "Indisponible" })).toBeDisabled();
  });
});
