import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "@/components/ui/SearchInput";

describe("SearchInput", () => {
  it("uses the rounded-full shape mandated by the design system", () => {
    render(<SearchInput value="" onChange={vi.fn()} />);

    expect(screen.getByRole("searchbox")).toHaveClass("rounded-full");
  });

  it("reports each keystroke to onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchInput value="" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "Kone");

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).toHaveBeenLastCalledWith("e");
  });

  it("shows a clear button only once there is a value, and clears it on click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(<SearchInput value="" onChange={onChange} />);
    expect(screen.queryByRole("button", { name: /effacer/i })).not.toBeInTheDocument();

    rerender(<SearchInput value="Kone" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /effacer/i }));

    expect(onChange).toHaveBeenCalledWith("");
  });
});
