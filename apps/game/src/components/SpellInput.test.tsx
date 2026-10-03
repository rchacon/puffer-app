import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SpellInput } from "./SpellInput";

function getInput() {
  return screen.getByLabelText(/spell the word/i);
}

describe("SpellInput", () => {
  it("disables Check until every tile is filled, then submits the typed word", () => {
    const onSubmit = vi.fn();
    render(<SpellInput target="cat" phase="playing" onSubmit={onSubmit} />);
    const check = screen.getByRole("button", { name: /check/i });
    expect(check).toBeDisabled();

    fireEvent.change(getInput(), { target: { value: "ca" } });
    expect(check).toBeDisabled();

    fireEvent.change(getInput(), { target: { value: "cat" } });
    expect(check).not.toBeDisabled();

    fireEvent.click(check);
    expect(onSubmit).toHaveBeenCalledWith("cat");
  });

  it("submits on Enter once full, not before", () => {
    const onSubmit = vi.fn();
    render(<SpellInput target="cat" phase="playing" onSubmit={onSubmit} />);
    fireEvent.change(getInput(), { target: { value: "ca" } });
    fireEvent.keyDown(getInput(), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(getInput(), { target: { value: "cat" } });
    fireEvent.keyDown(getInput(), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("cat");
  });

  it("strips non-letter characters instead of counting them as filled tiles", () => {
    render(<SpellInput target="cat" phase="playing" onSubmit={vi.fn()} />);
    // One digit among three characters -- filtered down to 2 real letters,
    // one short of "cat"'s length, so Check should still be disabled.
    fireEvent.change(getInput(), { target: { value: "c4t" } });
    expect(screen.getByRole("button", { name: /check/i })).toBeDisabled();
  });

  it("colors tiles correct/wrong during reveal and shows the correct spelling on a miss", () => {
    const { rerender } = render(
      <SpellInput target="cat" phase="playing" onSubmit={vi.fn()} />,
    );
    fireEvent.change(getInput(), { target: { value: "cot" } });
    rerender(<SpellInput target="cat" phase="reveal" onSubmit={vi.fn()} />);

    const tiles = document.querySelectorAll(".spellinput__tile");
    expect(tiles[0]).toHaveClass("spellinput__tile--correct");
    expect(tiles[1]).toHaveClass("spellinput__tile--wrong");
    expect(tiles[2]).toHaveClass("spellinput__tile--correct");
    expect(screen.getByText("CAT")).toBeInTheDocument();
  });

  it("doesn't show the correct spelling when the attempt matched", () => {
    const { rerender } = render(
      <SpellInput target="cat" phase="playing" onSubmit={vi.fn()} />,
    );
    fireEvent.change(getInput(), { target: { value: "cat" } });
    rerender(<SpellInput target="cat" phase="reveal" onSubmit={vi.fn()} />);
    expect(screen.queryByText("CAT")).not.toBeInTheDocument();
  });

  it("disables the input and Check once phase leaves 'playing'", () => {
    render(<SpellInput target="cat" phase="reveal" onSubmit={vi.fn()} />);
    expect(getInput()).toBeDisabled();
    expect(screen.getByRole("button", { name: /check/i })).toBeDisabled();
  });

  it("shows a tap hint until the first letter is typed", () => {
    render(<SpellInput target="cat" phase="playing" onSubmit={vi.fn()} />);
    expect(screen.getByText(/tap a tile to type/i)).toBeInTheDocument();

    fireEvent.change(getInput(), { target: { value: "c" } });
    expect(screen.queryByText(/tap a tile to type/i)).not.toBeInTheDocument();
  });

  it("focuses the input when the hint itself is tapped, not just the tiles", () => {
    render(<SpellInput target="cat" phase="playing" onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText(/tap a tile to type/i));
    expect(getInput()).toHaveFocus();
  });
});
