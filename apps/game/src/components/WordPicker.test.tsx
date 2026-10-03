import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WordPicker } from "./WordPicker";

const WORDS = ["a", "it", "cat", "dog", "run", "fish", "ship"];

function renderPicker(selected = WORDS) {
  const onChange = vi.fn();
  render(<WordPicker allWords={WORDS} selected={selected} onChange={onChange} />);
  return { onChange };
}

describe("WordPicker", () => {
  it("shows the selected / total count and expands on click", () => {
    renderPicker();
    const summary = screen.getByRole("button", { name: /choose words/i });
    expect(summary).toHaveTextContent("7 / 7");
    expect(screen.queryByText("3 letters")).not.toBeInTheDocument();
    fireEvent.click(summary);
    expect(screen.getByText("3 letters")).toBeInTheDocument();
  });

  it("starts expanded when the selection is below the minimum", () => {
    renderPicker(["cat"]);
    expect(screen.getByText("3 letters")).toBeInTheDocument();
  });

  it("re-opens if the selection later drops below the minimum", () => {
    const { rerender } = render(
      <WordPicker allWords={WORDS} selected={WORDS} onChange={vi.fn()} />,
    );
    expect(screen.queryByText("3 letters")).not.toBeInTheDocument();
    rerender(
      <WordPicker allWords={WORDS} selected={["cat"]} onChange={vi.fn()} />,
    );
    expect(screen.getByText("3 letters")).toBeInTheDocument();
  });

  it("clears everything via None", () => {
    const { onChange } = renderPicker();
    fireEvent.click(screen.getByRole("button", { name: /choose words/i }));
    fireEvent.click(screen.getByRole("button", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("toggles a whole group and keeps bank order", () => {
    // 3 selected -> starts collapsed; nothing in the 3-letter group yet.
    const { onChange } = renderPicker(["a", "it", "fish"]);
    fireEvent.click(screen.getByRole("button", { name: /choose words/i }));
    const group = screen
      .getByText("3 letters")
      .closest<HTMLElement>(".wordpicker__group")!;
    fireEvent.click(within(group).getByRole("checkbox", { name: "3 letters" }));
    expect(onChange).toHaveBeenCalledWith(["a", "it", "cat", "dog", "run", "fish"]);
  });
});
