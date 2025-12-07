import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("applies primary variant styles by default", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-blue-600", "text-white");
  });

  it("applies secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-gray-200", "text-gray-900");
  });

  it("applies danger variant styles", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-red-600", "text-white");
  });

  it("applies small size styles", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-sm", "px-3", "py-1.5");
  });

  it("applies medium size styles by default", () => {
    render(<Button>Medium</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-base", "px-4", "py-2");
  });

  it("applies large size styles", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-lg", "px-6", "py-3");
  });

  it("applies custom className alongside base styles", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class", "bg-blue-600");
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");

    // Attempt to click (should not trigger handler)
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("passes through additional button props", () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );
    const button = screen.getByTestId("submit-btn");
    expect(button).toHaveAttribute("type", "submit");
  });
});
