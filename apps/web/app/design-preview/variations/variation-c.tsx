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
  IconSearch,
  IconChevronDown,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconCopy,
  IconPencil,
  IconTrash,
  IconPlus,
  IconShield,
  IconTerminal2,
  IconCloud,
  IconX,
  IconCheck,
  IconFilter,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";

type AdminTab = "overview" | "variables" | "users" | "security";

const ENV_VARS = [
  {
    key: "CLAUDE_CODE_OAUTH_TOKEN_1",
    category: "claude_oauth" as const,
    description: "Primary account",
    updatedAt: "Feb 19, 2026",
  },
  {
    key: "CLAUDE_CODE_OAUTH_TOKEN_2",
    category: "claude_oauth" as const,
    description: "Secondary account",
    updatedAt: "Feb 18, 2026",
  },
  {
    key: "CLERK_SECRET_KEY",
    category: "infrastructure" as const,
    description: "Auth provider",
    updatedAt: "Feb 15, 2026",
  },
  {
    key: "NEXT_PUBLIC_CONVEX_URL",
    category: "infrastructure" as const,
    description: "Backend endpoint",
    updatedAt: "Feb 10, 2026",
  },
  {
    key: "DAYTONA_API_KEY",
    category: "infrastructure" as const,
    description: "Sandbox provider",
    updatedAt: "Feb 8, 2026",
  },
  {
    key: "RESEND_API_KEY",
    category: "infrastructure" as const,
    description: "Email service",
    updatedAt: "Feb 5, 2026",
  },
];

const TEAM_MEMBERS = [
  {
    name: "Sarah Chen",
    email: "sarah@conductor.dev",
    role: "admin",
    lastActive: "2 min ago",
    sessions: 34,
  },
  {
    name: "Marcus Johnson",
    email: "marcus@conductor.dev",
    role: "dev",
    lastActive: "12 min ago",
    sessions: 28,
  },
  {
    name: "Priya Patel",
    email: "priya@conductor.dev",
    role: "dev",
    lastActive: "1 hr ago",
    sessions: 45,
  },
  {
    name: "Alex Rivera",
    email: "alex@conductor.dev",
    role: "dev",
    lastActive: "3 hr ago",
    sessions: 19,
  },
  {
    name: "Jordan Lee",
    email: "jordan@conductor.dev",
    role: "business",
    lastActive: "5 hr ago",
    sessions: 12,
  },
];

const AUDIT_LOG = [
  {
    action: "Token rotated",
    target: "CLAUDE_CODE_OAUTH_TOKEN_1",
    user: "System",
    time: "10:42 AM",
  },
  {
    action: "Variable updated",
    target: "CLERK_SECRET_KEY",
    user: "Sarah Chen",
    time: "10:15 AM",
  },
  {
    action: "User invited",
    target: "jordan@conductor.dev",
    user: "Marcus Johnson",
    time: "9:48 AM",
  },
  {
    action: "Deploy triggered",
    target: "Production v2.14.3",
    user: "Priya Patel",
    time: "9:30 AM",
  },
  {
    action: "Permission changed",
    target: "Alex Rivera → admin",
    user: "Sarah Chen",
    time: "9:12 AM",
  },
  {
    action: "Sandbox deleted",
    target: "sandbox-7f2a",
    user: "System",
    time: "8:55 AM",
  },
];

export default function VariationC() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "services",
  );
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [envFilter, setEnvFilter] = useState<
    "all" | "claude_oauth" | "infrastructure"
  >("all");
  const [sortField, setSortField] = useState<"key" | "updatedAt">("key");
  const [sortAsc, setSortAsc] = useState(true);
  const [addingVar, setAddingVar] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyKey = (key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  };

  const toggleSort = (field: "key" | "updatedAt") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredVars = ENV_VARS.filter(
    (v) => envFilter === "all" || v.category === envFilter,
  )
    .filter(
      (v) =>
        !searchQuery ||
        v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const cmp =
        sortField === "key"
          ? a.key.localeCompare(b.key)
          : a.updatedAt.localeCompare(b.updatedAt);
      return sortAsc ? cmp : -cmp;
    });

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const tabs: {
    id: AdminTab;
    label: string;
    icon: typeof IconLayoutDashboard;
  }[] = [
    { id: "overview", label: "Overview", icon: IconLayoutDashboard },
    { id: "variables", label: "Variables", icon: IconKey },
    { id: "users", label: "Users", icon: IconUsers },
    { id: "security", label: "Security", icon: IconShield },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Compact Left Rail */}
      <aside className="flex w-12 flex-col items-center border-r border-border bg-card/60 py-3 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={`motion-base flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === tab.id
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon size={16} />
          </button>
        ))}
        <div className="mt-auto">
          <button
            onClick={() => {}}
            title="Settings"
            className="motion-base flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IconSettings size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto scrollbar">
        {/* Compact Header */}
        <div className="sticky top-0 z-10 flex h-10 items-center justify-between border-b border-border/70 bg-card/60 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-medium text-foreground capitalize">
              {activeTab}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <IconSearch
                size={12}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="motion-base h-6 w-36 rounded border border-input bg-background pl-6 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:w-48 focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <button
              onClick={() => {}}
              className="motion-base flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconRefresh size={12} />
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="p-4 space-y-3">
            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  label: "PRs",
                  value: "47",
                  icon: IconGitPullRequest,
                  delta: "+5",
                },
                { label: "Users", value: "18", icon: IconUsers, delta: "+3" },
                {
                  label: "Tasks",
                  value: "156",
                  icon: IconChecklist,
                  delta: "+12",
                },
                {
                  label: "Latency",
                  value: "42ms",
                  icon: IconClock,
                  delta: "-8ms",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/80 px-3 py-2"
                >
                  <s.icon
                    size={14}
                    className="flex-shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-foreground">
                        {s.value}
                      </span>
                      <span className="text-[10px] font-medium text-success">
                        {s.delta}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {s.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-1">
              {/* Services Section */}
              <button
                onClick={() => toggleSection("services")}
                className="motion-base flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {expandedSection === "services" ? (
                  <IconChevronDown size={12} />
                ) : (
                  <IconChevronRight size={12} />
                )}
                <IconServer size={13} className="text-primary" />
                Services
                <span className="ml-auto flex items-center gap-1 text-[10px] font-normal text-success">
                  <IconCircleCheck size={10} />
                  All healthy
                </span>
              </button>
              {expandedSection === "services" && (
                <div className="ml-5 space-y-0.5">
                  {[
                    {
                      name: "Convex",
                      status: "healthy",
                      latency: "42ms",
                      uptime: "99.98%",
                    },
                    {
                      name: "GitHub API",
                      status: "healthy",
                      latency: "118ms",
                      uptime: "99.95%",
                    },
                    {
                      name: "Daytona",
                      status: "degraded",
                      latency: "340ms",
                      uptime: "98.71%",
                    },
                    {
                      name: "Clerk Auth",
                      status: "healthy",
                      latency: "65ms",
                      uptime: "100%",
                    },
                    {
                      name: "Resend Email",
                      status: "healthy",
                      latency: "89ms",
                      uptime: "99.99%",
                    },
                  ].map((svc) => (
                    <div
                      key={svc.name}
                      className="motion-base flex items-center gap-3 rounded px-3 py-1.5 text-xs hover:bg-muted/30"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${svc.status === "healthy" ? "bg-success" : "bg-warning"}`}
                      />
                      <span className="w-20 font-medium text-foreground">
                        {svc.name}
                      </span>
                      <span className="w-14 font-mono text-muted-foreground">
                        {svc.latency}
                      </span>
                      <span className="text-muted-foreground">
                        {svc.uptime}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity Section */}
              <button
                onClick={() => toggleSection("activity")}
                className="motion-base flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {expandedSection === "activity" ? (
                  <IconChevronDown size={12} />
                ) : (
                  <IconChevronRight size={12} />
                )}
                <IconActivity size={13} className="text-primary" />
                Audit Log
                <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                  Today
                </span>
              </button>
              {expandedSection === "activity" && (
                <div className="ml-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="px-3 py-1.5 font-medium">Time</th>
                        <th className="px-3 py-1.5 font-medium">Action</th>
                        <th className="px-3 py-1.5 font-medium">Target</th>
                        <th className="px-3 py-1.5 font-medium">User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AUDIT_LOG.map((log, i) => (
                        <tr key={i} className="motion-base hover:bg-muted/30">
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">
                            {log.time}
                          </td>
                          <td className="px-3 py-1.5 text-foreground">
                            {log.action}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-primary">
                            {log.target}
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {log.user}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Deployments Section */}
              <button
                onClick={() => toggleSection("deployments")}
                className="motion-base flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {expandedSection === "deployments" ? (
                  <IconChevronDown size={12} />
                ) : (
                  <IconChevronRight size={12} />
                )}
                <IconCloud size={13} className="text-primary" />
                Deployments
                <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                  4 today
                </span>
              </button>
              {expandedSection === "deployments" && (
                <div className="ml-5 space-y-0.5">
                  {[
                    {
                      commit: "705f605",
                      branch: "main",
                      author: "Sarah",
                      time: "38m ago",
                      ok: true,
                    },
                    {
                      commit: "6c5633f",
                      branch: "main",
                      author: "Marcus",
                      time: "2h ago",
                      ok: true,
                    },
                    {
                      commit: "42b666e",
                      branch: "staging",
                      author: "Priya",
                      time: "5h ago",
                      ok: true,
                    },
                    {
                      commit: "e80a253",
                      branch: "staging",
                      author: "Alex",
                      time: "8h ago",
                      ok: false,
                    },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className="motion-base flex items-center gap-3 rounded px-3 py-1.5 text-xs hover:bg-muted/30"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${d.ok ? "bg-success" : "bg-destructive"}`}
                      />
                      <span className="w-16 font-mono text-primary">
                        {d.commit}
                      </span>
                      <span className="w-14 text-foreground">{d.branch}</span>
                      <span className="w-14 text-muted-foreground">
                        {d.author}
                      </span>
                      <span className="text-muted-foreground">{d.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Variables Tab */}
        {activeTab === "variables" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-input overflow-hidden">
                  {(["all", "claude_oauth", "infrastructure"] as const).map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setEnvFilter(f)}
                        className={`motion-base px-3 py-1 text-[11px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                          envFilter === f
                            ? "bg-accent text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <IconFilter size={10} className="inline mr-1" />
                        {f === "all"
                          ? "All"
                          : f === "claude_oauth"
                            ? "OAuth"
                            : "Infra"}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <button
                onClick={() => setAddingVar(!addingVar)}
                className="motion-base flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <IconPlus size={12} />
                Add
              </button>
            </div>

            {addingVar && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-accent/30 px-3 py-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="KEY_NAME"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="h-6 w-40 rounded border border-input bg-background px-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <input
                  type="text"
                  placeholder="value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="h-6 flex-1 rounded border border-input bg-background px-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button
                  onClick={() => {
                    setAddingVar(false);
                    setNewKey("");
                    setNewValue("");
                  }}
                  className="motion-base flex h-6 w-6 items-center justify-center rounded text-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <IconCheck size={12} />
                </button>
                <button
                  onClick={() => {
                    setAddingVar(false);
                    setNewKey("");
                    setNewValue("");
                  }}
                  className="motion-base flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <IconX size={12} />
                </button>
              </div>
            )}

            <div className="rounded-lg border border-border/70 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left">
                    <th className="px-3 py-2">
                      <button
                        onClick={() => toggleSort("key")}
                        className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        <IconKey size={10} />
                        Key
                        {sortField === "key" &&
                          (sortAsc ? (
                            <IconArrowUp size={9} />
                          ) : (
                            <IconArrowDown size={9} />
                          ))}
                      </button>
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="px-3 py-2">
                      <button
                        onClick={() => toggleSort("updatedAt")}
                        className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        <IconClock size={10} />
                        Updated
                        {sortField === "updatedAt" &&
                          (sortAsc ? (
                            <IconArrowUp size={9} />
                          ) : (
                            <IconArrowDown size={9} />
                          ))}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Value
                    </th>
                    <th className="w-24 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredVars.map((v) => (
                    <tr
                      key={v.key}
                      className="motion-base border-b border-border/40 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-3 py-2 font-mono text-foreground">
                        {v.key}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            v.category === "claude_oauth"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {v.category === "claude_oauth" ? "OAuth" : "Infra"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {v.description}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {v.updatedAt}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {revealedKeys.has(v.key)
                          ? "sk-ant-...x7f2"
                          : "••••••••"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => toggleReveal(v.key)}
                            className="motion-base flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            title={revealedKeys.has(v.key) ? "Hide" : "Reveal"}
                          >
                            {revealedKeys.has(v.key) ? (
                              <IconEyeOff size={10} />
                            ) : (
                              <IconEye size={10} />
                            )}
                          </button>
                          <button
                            onClick={() => copyKey(v.key)}
                            className="motion-base flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            title="Copy"
                          >
                            {copiedKey === v.key ? (
                              <IconCheck size={10} className="text-primary" />
                            ) : (
                              <IconCopy size={10} />
                            )}
                          </button>
                          <button
                            onClick={() => {}}
                            className="motion-base flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            title="Edit"
                          >
                            <IconPencil size={10} />
                          </button>
                          <button
                            onClick={() => {}}
                            className="motion-base flex h-5 w-5 items-center justify-center rounded text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            title="Delete"
                          >
                            <IconTrash size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {filteredVars.length} variable
              {filteredVars.length !== 1 ? "s" : ""} shown &middot; OAuth tokens
              are rotated between accounts
            </p>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {TEAM_MEMBERS.length} team members
              </span>
              <button
                onClick={() => {}}
                className="motion-base flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                <IconPlus size={12} />
                Invite
              </button>
            </div>
            <div className="rounded-lg border border-border/70 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left">
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconUsers size={10} /> Name
                      </div>
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconTerminal2 size={10} /> Sessions
                      </div>
                    </th>
                    <th className="px-3 py-2 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconClock size={10} /> Last Active
                      </div>
                    </th>
                    <th className="w-16 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {TEAM_MEMBERS.map((m) => (
                    <tr
                      key={m.email}
                      className="motion-base border-b border-border/40 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-3 py-2">
                        <div>
                          <span className="font-medium text-foreground">
                            {m.name}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {m.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            m.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : m.role === "dev"
                                ? "bg-secondary text-muted-foreground"
                                : "bg-warning/10 text-warning"
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-foreground">
                        {m.sessions}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {m.lastActive}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => {}}
                          className="motion-base flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <IconPencil size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                {
                  label: "OAuth Accounts",
                  value: "8/10",
                  status: "ok",
                  icon: IconKey,
                },
                {
                  label: "Failed Logins",
                  value: "2",
                  status: "ok",
                  icon: IconAlertTriangle,
                },
                {
                  label: "SSL Expires",
                  value: "Apr 15",
                  status: "ok",
                  icon: IconShield,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2"
                >
                  <s.icon
                    size={13}
                    className="flex-shrink-0 text-muted-foreground"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      {s.value}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                  <IconCircleCheck size={10} className="ml-auto text-success" />
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/70 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
                <IconActivity size={12} className="text-primary" />
                <span className="text-[11px] font-semibold text-foreground">
                  Security Audit Log
                </span>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {AUDIT_LOG.map((log, i) => (
                    <tr
                      key={i}
                      className="motion-base border-b border-border/40 last:border-0 hover:bg-muted/20"
                    >
                      <td className="w-16 px-3 py-1.5 font-mono text-muted-foreground">
                        {log.time}
                      </td>
                      <td className="px-3 py-1.5 text-foreground">
                        {log.action}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-primary">
                        {log.target}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {log.user}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
