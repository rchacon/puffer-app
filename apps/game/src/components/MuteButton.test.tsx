import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MuteButton } from "./MuteButton";

describe("MuteButton", () => {
  it("offers to mute while music is on", () => {
    render(<MuteButton muted={false} onToggle={() => {}} />);
    const button = screen.getByRole("button", { name: "Mute music" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("offers to unmute while muted", () => {
    render(<MuteButton muted onToggle={() => {}} />);
    const button = screen.getByRole("button", { name: "Unmute music" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<MuteButton muted={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
