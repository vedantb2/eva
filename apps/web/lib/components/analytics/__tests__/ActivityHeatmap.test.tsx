import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ActivityHeatmap } from "../ActivityHeatmap";

vi.mock("@conductor/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="tooltip-trigger">{children}</div>,
}));

const FIXED_DATE = new Date("2025-06-15T12:00:00Z");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("ActivityHeatmap", () => {
  it("renders 0 count in title when no data is provided", () => {
    render(<ActivityHeatmap data={[]} />);
    expect(
      screen.getByText(/0 tasks completed in the last year/i),
    ).toBeInTheDocument();
  });

  it("renders the correct total task count in the title", () => {
    const data = [
      { date: "2025-06-01", count: 3 },
      { date: "2025-05-20", count: 2 },
    ];
    render(<ActivityHeatmap data={data} />);
    expect(
      screen.getByText(/5 tasks completed in the last year/i),
    ).toBeInTheDocument();
  });

  it("renders a tooltip saying '1 task' (singular) for a day with count 1", () => {
    const data = [{ date: "2025-06-10", count: 1 }];
    render(<ActivityHeatmap data={data} />);
    expect(screen.getByText("1 task")).toBeInTheDocument();
  });

  it("renders tooltips saying 'tasks' (plural) for counts other than 1", () => {
    const data = [
      { date: "2025-06-10", count: 4 },
      { date: "2025-06-09", count: 0 },
    ];
    render(<ActivityHeatmap data={data} />);
    expect(screen.getByText("4 tasks")).toBeInTheDocument();
  });

  it("renders the 'Less' and 'More' legend labels", () => {
    render(<ActivityHeatmap data={[]} />);
    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("renders day labels for Mon, Wed, Fri", () => {
    render(<ActivityHeatmap data={[]} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
  });

  it("renders at least one month label", () => {
    render(<ActivityHeatmap data={[]} />);
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const rendered = monthLabels.filter(
      (m) => screen.queryAllByText(m).length > 0,
    );
    expect(rendered.length).toBeGreaterThan(0);
  });

  it("ignores data entries outside the displayed date range", () => {
    const data = [
      { date: "2020-01-01", count: 999 },
      { date: "2025-06-14", count: 2 },
    ];
    render(<ActivityHeatmap data={data} />);
    expect(
      screen.getByText(/2 tasks completed in the last year/i),
    ).toBeInTheDocument();
  });

  it("handles multiple entries on the same date by using the last one", () => {
    const data = [
      { date: "2025-06-10", count: 2 },
      { date: "2025-06-10", count: 5 },
    ];
    render(<ActivityHeatmap data={data} />);
    expect(
      screen.getByText(/5 tasks completed in the last year/i),
    ).toBeInTheDocument();
  });

  it("renders tooltip text with the formatted date", () => {
    const data = [{ date: "2025-06-10", count: 3 }];
    render(<ActivityHeatmap data={data} />);
    expect(screen.getByText(/Jun 10, 2025/)).toBeInTheDocument();
  });
});
