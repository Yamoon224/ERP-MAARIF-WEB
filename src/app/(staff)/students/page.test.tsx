import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentsPage from "@/app/(staff)/students/page";

describe("StudentsPage", () => {
  it("lists students returned by the API", async () => {
    render(<StudentsPage />);

    expect(await screen.findByText("Fatoumata Camara")).toBeInTheDocument();
    expect(screen.getByText("Moussa Diallo")).toBeInTheDocument();
  });

  it("filters the list as the user types in the search field", async () => {
    const user = userEvent.setup();
    render(<StudentsPage />);

    await screen.findByText("Fatoumata Camara");

    await user.type(screen.getByRole("searchbox"), "Moussa");

    await waitFor(() => expect(screen.queryByText("Fatoumata Camara")).not.toBeInTheDocument());
    expect(screen.getByText("Moussa Diallo")).toBeInTheDocument();
  });

  it("shows an empty state when no student matches the search", async () => {
    const user = userEvent.setup();
    render(<StudentsPage />);

    await screen.findByText("Fatoumata Camara");

    await user.type(screen.getByRole("searchbox"), "Zzzzz");

    expect(await screen.findByText("Aucun eleve trouve.")).toBeInTheDocument();
  });
  it("opens each student's file from a blue-to-white button carrying a graduation cap", async () => {
    render(<StudentsPage />);

    const buttons = await screen.findAllByRole("link", { name: "Dossier scolaire" });

    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toHaveAttribute("href", expect.stringMatching(/^\/students\/.+/));
      expect(button).toHaveClass("bg-brand-fade");
      expect(button.querySelector("svg.lucide-graduation-cap")).not.toBeNull();
    }
  });

  it("lets the user sort the list by a column header", async () => {
    const user = userEvent.setup();
    render(<StudentsPage />);
    await screen.findByText("Fatoumata Camara");

    await user.click(screen.getByRole("button", { name: "Nom" }));
    const ascending = screen.getAllByRole("row").slice(1).map((row) => row.textContent);
    await user.click(screen.getByRole("button", { name: "Nom" }));
    const descending = screen.getAllByRole("row").slice(1).map((row) => row.textContent);

    expect(ascending[0]).toContain("Fatoumata Camara");
    expect(descending[0]).toContain("Moussa Diallo");
  });
});
