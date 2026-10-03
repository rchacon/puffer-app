import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModeToggle } from "./ModeToggle";

describe("ModeToggle", () => {
  it("shows Easy checked by default", () => {
    render(<ModeToggle mode="easy" onChange={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "Easy" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Hard" })).not.toBeChecked();
  });

  it("shows Hard checked when mode is hard", () => {
    render(<ModeToggle mode="hard" onChange={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "Hard" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Easy" })).not.toBeChecked();
  });

  it("calls onChange('hard') when the Hard pill is clicked", () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="easy" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Hard" }));
    expect(onChange).toHaveBeenCalledWith("hard");
  });
});
