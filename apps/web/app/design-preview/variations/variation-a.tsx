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
  IconArrowDownRight,
  IconDots,
  IconShield,
} from "@tabler/icons-react";

const NAV_ITEMS = [
  { label: "Overview", icon: IconLayoutDashboard, active: true },
  { label: "Stats", icon: IconChartBar, active: false },
  { label: "Env Variables", icon: IconKey, active: false },
  { label: "Users", icon: IconUsers, active: false },
  { label: "Security", icon: IconShield, active: false },
];

const RECENT_ACTIVITY = [
  {
    user: "Sarah Chen",
    action: "deployed branch",
    target: "feature/auth-redesign",
    time: "3 min ago",
    icon: IconGitPullRequest,
  },
  {
    user: "Marcus Johnson",
    action: "updated env variable",
    target: "CLERK_SECRET_KEY",
    time: "12 min ago",
    icon: IconKey,
  },
  {
    user: "Priya Patel",
    action: "completed task",
    target: "Migrate user schema",
    time: "28 min ago",
    icon: IconChecklist,
  },
  {
    user: "Alex Rivera",
    action: "triggered workflow",
    target: "Build & Deploy Pipeline",
    time: "1 hr ago",
    icon: IconActivity,
  },
  {
    user: "Jordan Lee",
    action: "resolved alert",
    target: "High memory usage",
    time: "2 hr ago",
    icon: IconAlertTriangle,
  },
];

const SYSTEM_SERVICES = [
  {
    name: "Convex Backend",
    status: "healthy",
    uptime: "99.98%",
    latency: "42ms",
  },
  {
    name: "GitHub Integration",
    status: "healthy",
    uptime: "99.95%",
    latency: "118ms",
  },
  {
    name: "Daytona Sandboxes",
    status: "degraded",
    uptime: "98.71%",
    latency: "340ms",
  },
  {
    name: "Clerk Authentication",
    status: "healthy",
    uptime: "100%",
    latency: "65ms",
  },
];

export default function VariationA() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-border/70 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <IconLayoutDashboard
              size={16}
              className="text-primary-foreground"
            />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Admin Panel
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`motion-base flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeNav === item.label
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border/70 px-3 py-3">
          <button
            onClick={() => {}}
            className="motion-base flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IconSettings size={16} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto scrollbar">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-card/60 px-6 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">
              Dashboard Overview
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <IconSearch
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="motion-base h-8 w-52 rounded-lg border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="motion-base relative flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconBell size={15} />
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                3
              </span>
            </button>
            <button
              onClick={() => {}}
              className="motion-base flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconRefresh size={15} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "PRs Shipped",
                value: "47",
                change: "+12%",
                up: true,
                icon: IconGitPullRequest,
              },
              {
                label: "Active Users",
                value: "18",
                change: "+3",
                up: true,
                icon: IconUsers,
              },
              {
                label: "Tasks Completed",
                value: "156",
                change: "+28%",
                up: true,
                icon: IconChecklist,
              },
              {
                label: "Avg Response",
                value: "1.2s",
                change: "-15%",
                up: false,
                icon: IconClock,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="motion-emphasized group rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="motion-base flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground group-hover:bg-accent group-hover:text-primary">
                    <stat.icon size={18} />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      stat.up ? "text-success" : "text-primary"
                    }`}
                  >
                    {stat.up ? (
                      <IconArrowUpRight size={12} />
                    ) : (
                      <IconArrowDownRight size={12} />
                    )}
                    {stat.change}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="lg:col-span-2 rounded-xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <IconActivity size={16} className="text-primary" />
                  Recent Activity
                </h2>
                <button className="motion-base flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1.5 py-0.5">
                  View all
                  <IconChevronRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-border/40">
                {RECENT_ACTIVITY.map((activity, i) => (
                  <div
                    key={i}
                    className="motion-base flex items-center gap-3 px-5 py-3 hover:bg-muted/30"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <activity.icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">
                          {activity.action}
                        </span>{" "}
                        <span className="font-medium text-primary">
                          {activity.target}
                        </span>
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="rounded-xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <IconServer size={16} className="text-primary" />
                  System Status
                </h2>
                <button className="motion-base flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <IconDots size={14} />
                </button>
              </div>
              <div className="divide-y divide-border/40">
                {SYSTEM_SERVICES.map((service) => (
                  <div
                    key={service.name}
                    className="motion-base flex items-center justify-between px-5 py-3 hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          service.status === "healthy"
                            ? "bg-success"
                            : "bg-warning"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {service.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.latency} avg
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">
                        {service.uptime}
                      </p>
                      <p className="text-xs text-muted-foreground">uptime</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/60 px-5 py-3">
                <div className="flex items-center gap-2">
                  <IconCircleCheck size={14} className="text-success" />
                  <span className="text-xs text-muted-foreground">
                    All core systems operational
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
              <IconSettings size={16} className="text-primary" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Manage Users",
                  icon: IconUsers,
                  desc: "View and edit user permissions",
                },
                {
                  label: "View Logs",
                  icon: IconActivity,
                  desc: "Check system event logs",
                },
                {
                  label: "Rotate Tokens",
                  icon: IconRefresh,
                  desc: "Refresh OAuth credentials",
                },
                {
                  label: "Security Audit",
                  icon: IconShield,
                  desc: "Run security checks",
                },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => {}}
                  className="motion-base group flex flex-col items-start gap-2 rounded-lg border border-border/50 bg-background p-4 text-left hover:border-primary/30 hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                >
                  <div className="motion-base flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                    <action.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {action.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
