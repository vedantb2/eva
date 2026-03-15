import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { SandboxTabBar } from "../SandboxTabBar";

const tabsCallbacks = vi.hoisted(() => ({
  onValueChange: (_v: string) => {},
}));

vi.mock("@conductor/ui", () => ({
  Tabs: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => {
    tabsCallbacks.onValueChange = onValueChange;
    return (
      <div data-testid="tabs" data-active-tab={value}>
        {children}
      </div>
    );
  },
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({
    value,
    children,
    className,
  }: {
    value: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      data-testid={`tab-${value}`}
      data-state={
        className?.includes("data-[state=active]") ? undefined : undefined
      }
      onClick={() => tabsCallbacks.onValueChange(value)}
    >
      {children}
    </button>
  ),
}));

describe("SandboxTabBar", () => {
  it("renders all four tabs", () => {
    render(<SandboxTabBar activeTab="preview" onTabChange={() => {}} />);
    expect(screen.getByTestId("tab-preview")).toBeInTheDocument();
    expect(screen.getByTestId("tab-desktop")).toBeInTheDocument();
    expect(screen.getByTestId("tab-editor")).toBeInTheDocument();
    expect(screen.getByTestId("tab-terminal")).toBeInTheDocument();
  });

  it("renders the correct tab labels", () => {
    render(<SandboxTabBar activeTab="preview" onTabChange={() => {}} />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Computer")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Terminal")).toBeInTheDocument();
  });

  it("passes the active tab value to the Tabs container", () => {
    render(<SandboxTabBar activeTab="editor" onTabChange={() => {}} />);
    expect(screen.getByTestId("tabs")).toHaveAttribute(
      "data-active-tab",
      "editor",
    );
  });

  it("calls onTabChange with 'preview' when the Preview tab is clicked", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<SandboxTabBar activeTab="terminal" onTabChange={onTabChange} />);
    await user.click(screen.getByTestId("tab-preview"));
    expect(onTabChange).toHaveBeenCalledWith("preview");
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  it("calls onTabChange with 'terminal' when the Terminal tab is clicked", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<SandboxTabBar activeTab="preview" onTabChange={onTabChange} />);
    await user.click(screen.getByTestId("tab-terminal"));
    expect(onTabChange).toHaveBeenCalledWith("terminal");
  });

  it("calls onTabChange with 'desktop' when the Computer tab is clicked", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<SandboxTabBar activeTab="preview" onTabChange={onTabChange} />);
    await user.click(screen.getByTestId("tab-desktop"));
    expect(onTabChange).toHaveBeenCalledWith("desktop");
  });

  it("calls onTabChange with 'editor' when the Editor tab is clicked", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<SandboxTabBar activeTab="preview" onTabChange={onTabChange} />);
    await user.click(screen.getByTestId("tab-editor"));
    expect(onTabChange).toHaveBeenCalledWith("editor");
  });

  it("updates the active tab when re-rendered with a new activeTab prop", () => {
    const { rerender } = render(
      <SandboxTabBar activeTab="preview" onTabChange={() => {}} />,
    );
    expect(screen.getByTestId("tabs")).toHaveAttribute(
      "data-active-tab",
      "preview",
    );

    rerender(<SandboxTabBar activeTab="terminal" onTabChange={() => {}} />);
    expect(screen.getByTestId("tabs")).toHaveAttribute(
      "data-active-tab",
      "terminal",
    );
  });
});
