import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "@/components/ui/Pagination";

const meta = { current_page: 2, last_page: 5, per_page: 10, total: 42 };

describe("Pagination", () => {
  it("offers the page sizes, the page position and the number of items browsed so far", () => {
    render(<Pagination meta={meta} onPageChange={vi.fn()} onPerPageChange={vi.fn()} />);

    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual(["5", "10", "15", "20", "25", "30", "50", "100"]);
    expect(screen.getByLabelText("Elements par page")).toHaveValue("10");
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    expect(screen.getByText("20 / 42")).toBeInTheDocument();
  });

  it("caps the browsed count at the total on the last page", () => {
    render(<Pagination meta={{ ...meta, current_page: 5 }} onPageChange={vi.fn()} onPerPageChange={vi.fn()} />);

    expect(screen.getByText("42 / 42")).toBeInTheDocument();
  });

  it("moves between pages and disables the buttons at both ends", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination meta={meta} onPageChange={onPageChange} onPerPageChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);

    await user.click(screen.getByRole("button", { name: "Page precedente" }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    rerender(<Pagination meta={{ ...meta, current_page: 1 }} onPageChange={onPageChange} onPerPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Page precedente" })).toBeDisabled();

    rerender(<Pagination meta={{ ...meta, current_page: 5 }} onPageChange={onPageChange} onPerPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Page suivante" })).toBeDisabled();
  });

  it("reports the chosen page size", async () => {
    const user = userEvent.setup();
    const onPerPageChange = vi.fn();
    render(<Pagination meta={meta} onPageChange={vi.fn()} onPerPageChange={onPerPageChange} />);

    await user.selectOptions(screen.getByLabelText("Elements par page"), "50");

    expect(onPerPageChange).toHaveBeenCalledWith(50);
  });

  it("stays visible on a single page so the page size can still be changed", () => {
    render(
      <Pagination
        meta={{ current_page: 1, last_page: 1, per_page: 100, total: 3 }}
        onPageChange={vi.fn()}
        onPerPageChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Elements par page")).toHaveValue("100");
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("goes back to the last page when the current page no longer exists", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        meta={{ current_page: 4, last_page: 3, per_page: 10, total: 25 }}
        onPageChange={onPageChange}
        onPerPageChange={vi.fn()}
      />,
    );

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
