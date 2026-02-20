"use client";

import { useState } from "react";
import {
  IconLayoutDashboard,
  IconChartBar,
  IconKey,
  IconUsers,
  IconGitPullRequest,
  IconChecklist,
  IconActivity,
  IconClock,
  IconAlertTriangle,
  IconCircleCheck,
  IconServer,
  IconRefresh,
  IconSettings,
  IconBell,
  IconSearch,
  IconChevronRight,
  IconArrowUpRight,
  IconShield,
  IconTerminal2,
  IconCloud,
  IconPlayerPlay,
  IconEye,
  IconTrendingUp,
  IconBolt,
  IconX,
} from "@tabler/icons-react";

const STAT_CARDS = [
  {
    label: "PRs Shipped",
    value: 47,
    trend: "+12% this week",
    icon: IconGitPullRequest,
    accent: "bg-primary/10 text-primary",
  },
  {
    label: "Active Users",
    value: 18,
    trend: "3 new today",
    icon: IconUsers,
    accent: "bg-success/10 text-success",
  },
  {
    label: "Tasks Done",
    value: 156,
    trend: "+28% vs last week",
    icon: IconChecklist,
    accent: "bg-warning/10 text-warning",
  },
  {
    label: "Avg Latency",
    value: "42ms",
    trend: "15% faster",
    icon: IconBolt,
    accent: "bg-primary/10 text-primary",
  },
];

const LIVE_FEED = [
  {
    user: "Sarah Chen",
    action: "Merged PR #312",
    branch: "feature/auth-redesign",
    time: "Just now",
    type: "merge",
  },
  {
    user: "Marcus Johnson",
    action: "Started sandbox",
    branch: "fix/memory-leak",
    time: "2 min ago",
    type: "sandbox",
  },
  {
    user: "Priya Patel",
    action: "Deployed to staging",
    branch: "main",
    time: "5 min ago",
    type: "deploy",
  },
  {
    user: "Alex Rivera",
    action: "Created task",
    branch: "Refactor API layer",
    time: "11 min ago",
    type: "task",
  },
  {
    user: "Jordan Lee",
    action: "Completed review",
    branch: "PR #308",
    time: "18 min ago",
    type: "review",
  },
  {
    user: "Mia Thompson",
    action: "Resolved incident",
    branch: "High CPU alert",
    time: "25 min ago",
    type: "alert",
  },
];

const ENVIRONMENTS = [
  {
    name: "Production",
    status: "healthy",
    version: "v2.14.3",
    deployedAt: "Feb 19, 11:42 AM",
    icon: IconCloud,
  },
  {
    name: "Staging",
    status: "deploying",
    version: "v2.15.0-rc1",
    deployedAt: "Deploying...",
    icon: IconServer,
  },
  {
    name: "Development",
    status: "healthy",
    version: "v2.15.0-dev",
    deployedAt: "Feb 20, 9:15 AM",
    icon: IconTerminal2,
  },
];

export default function VariationB() {
  const [selectedTab, setSelectedTab] = useState<
    "feed" | "environments" | "alerts"
  >("feed");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationCount] = useState(5);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "merge":
        return IconGitPullRequest;
      case "sandbox":
        return IconTerminal2;
      case "deploy":
        return IconCloud;
      case "task":
        return IconChecklist;
      case "review":
        return IconEye;
      case "alert":
        return IconAlertTriangle;
      default:
        return IconActivity;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Command Palette Overlay */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <IconSearch size={16} className="text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="motion-base flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <IconX size={14} />
              </button>
            </div>
            <div className="p-2">
              {[
                { label: "Deploy to production", icon: IconCloud },
                { label: "Rotate OAuth tokens", icon: IconRefresh },
                { label: "View system logs", icon: IconActivity },
                { label: "Manage user permissions", icon: IconUsers },
              ].map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => setCommandPaletteOpen(false)}
                  className="motion-base flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <cmd.icon size={16} className="text-muted-foreground" />
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <IconLayoutDashboard
                size={18}
                className="text-primary-foreground"
              />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">
                Admin Console
              </h1>
              <p className="text-xs text-muted-foreground">
                conductor / vedantb2
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="motion-base flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconSearch size={13} />
              <span>Search...</span>
              <kbd className="ml-4 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                /
              </kbd>
            </button>
            <button
              onClick={() => {}}
              className="motion-base relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconBell size={16} />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {notificationCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {}}
              className="motion-base flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconSettings size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Hero Status Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-sm font-medium text-success">
                  All Systems Operational
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Good morning, Admin
              </h2>
              <p className="text-sm text-muted-foreground">
                Last deployment 38 minutes ago. 3 active sandboxes running. Next
                scheduled maintenance: March 5.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {}}
                className="motion-base flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <IconPlayerPlay size={14} />
                Deploy Now
              </button>
              <button
                onClick={() => {}}
                className="motion-base flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <IconChartBar size={14} />
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards - Large with sparkline placeholders */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map((stat) => (
            <div
              key={stat.label}
              className="motion-emphasized group relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.accent}`}
                >
                  <stat.icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-success">
                  <IconTrendingUp size={12} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {stat.trend}
              </p>
              {/* Decorative sparkline bar */}
              <div className="mt-3 flex items-end gap-0.5 h-6">
                {[40, 55, 35, 65, 50, 70, 60, 80, 75, 90, 85, 95].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="motion-base flex-1 rounded-sm bg-primary/15 group-hover:bg-primary/25"
                      style={{ height: `${h}%` }}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tabbed Content */}
        <div className="rounded-xl border border-border/70 bg-card">
          <div className="flex items-center gap-1 border-b border-border/60 px-4">
            {(["feed", "environments", "alerts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`motion-base flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                  selectedTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "feed" && <IconActivity size={14} />}
                {tab === "environments" && <IconCloud size={14} />}
                {tab === "alerts" && <IconAlertTriangle size={14} />}
                {tab === "feed" ? "Live Feed" : tab}
              </button>
            ))}
            <div className="ml-auto pr-2 py-2">
              <button
                onClick={() => {}}
                className="motion-base flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <IconRefresh size={12} />
                Refresh
              </button>
            </div>
          </div>

          {selectedTab === "feed" && (
            <div className="divide-y divide-border/40">
              {LIVE_FEED.map((item, i) => {
                const TypeIcon = getTypeIcon(item.type);
                return (
                  <div
                    key={i}
                    className="motion-base flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <TypeIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{item.user}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.action} &middot;{" "}
                        <span className="text-primary">{item.branch}</span>
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {item.time}
                    </span>
                    <button className="motion-base flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <IconChevronRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {selectedTab === "environments" && (
            <div className="p-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {ENVIRONMENTS.map((env) => (
                <div
                  key={env.name}
                  className="motion-emphasized group rounded-xl border border-border/60 bg-background p-4 hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <env.icon size={16} className="text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        {env.name}
                      </span>
                    </div>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        env.status === "healthy"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${env.status === "healthy" ? "bg-success" : "bg-warning"}`}
                      />
                      {env.status}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-mono text-foreground">
                        {env.version}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Last Deploy</span>
                      <span className="text-foreground">{env.deployedAt}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {}}
                    className="motion-base mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-card py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <IconEye size={12} />
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedTab === "alerts" && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success mb-3">
                <IconCircleCheck size={24} />
              </div>
              <p className="text-sm font-medium text-foreground">
                No active alerts
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All systems are running within normal parameters
              </p>
            </div>
          )}
        </div>

        {/* Bottom Row - Security & Quick Links */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
              <IconShield size={16} className="text-primary" />
              Security Overview
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "OAuth Token Health",
                  value: "8 / 10 active",
                  status: "healthy",
                },
                {
                  label: "Failed Auth Attempts",
                  value: "2 in 24h",
                  status: "healthy",
                },
                {
                  label: "SSL Certificate",
                  value: "Expires Apr 15, 2026",
                  status: "healthy",
                },
                {
                  label: "Rate Limit Status",
                  value: "1 account throttled",
                  status: "warning",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="motion-base flex items-center justify-between rounded-lg bg-background px-4 py-2.5 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${item.status === "healthy" ? "bg-success" : "bg-warning"}`}
                    />
                    <span className="text-sm text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
              <IconClock size={16} className="text-primary" />
              Recent Deployments
            </h3>
            <div className="space-y-3">
              {[
                {
                  branch: "main",
                  commit: "705f605",
                  author: "Sarah Chen",
                  time: "38 min ago",
                  status: "success",
                },
                {
                  branch: "staging",
                  commit: "6c5633f",
                  author: "Marcus Johnson",
                  time: "2 hr ago",
                  status: "success",
                },
                {
                  branch: "main",
                  commit: "42b666e",
                  author: "Priya Patel",
                  time: "5 hr ago",
                  status: "success",
                },
                {
                  branch: "staging",
                  commit: "e80a253",
                  author: "Alex Rivera",
                  time: "8 hr ago",
                  status: "failed",
                },
              ].map((deploy, i) => (
                <div
                  key={i}
                  className="motion-base flex items-center justify-between rounded-lg bg-background px-4 py-2.5 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${deploy.status === "success" ? "bg-success" : "bg-destructive"}`}
                    />
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-mono text-xs text-primary">
                          {deploy.commit}
                        </span>
                        <span className="mx-1.5 text-muted-foreground">
                          &rarr;
                        </span>
                        <span className="font-medium">{deploy.branch}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {deploy.author}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {deploy.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
