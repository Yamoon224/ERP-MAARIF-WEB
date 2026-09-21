import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Ouvrir</button>
      <Modal
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Nouvel utilisateur"
        description="Une description"
      >
        <label>
          Nom <input />
        </label>
        <button>Valider</button>
      </Modal>
    </div>
  );
}

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(<Harness />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a labelled, described modal dialog", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Ouvrir" }));

    const dialog = screen.getByRole("dialog", { name: "Nouvel utilisateur" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Une description");
  });

  it("moves the focus to the first field, and gives it back to the opening button on close", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Ouvrir" });

    await user.click(opener);
    expect(screen.getByLabelText("Nom")).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("closes from the cross and from the backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    await user.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    // Le fond est le seul élément aria-hidden qui accepte un clic.
    await user.click(document.querySelector('.fixed.inset-0.bg-black\\/50') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("keeps the focus inside while tabbing", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Ouvrir" }));

    // Champ -> Valider -> (Fermer est avant le champ) : on boucle sans jamais sortir de la fenêtre.
    for (let step = 0; step < 6; step += 1) {
      await user.tab();
      expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
    }

    for (let step = 0; step < 6; step += 1) {
      await user.tab({ shift: true });
      expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("blocks the page from scrolling behind it, and restores it on close", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });
});
