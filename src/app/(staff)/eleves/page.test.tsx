import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentsPage from "@/app/(staff)/eleves/page";

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
});
