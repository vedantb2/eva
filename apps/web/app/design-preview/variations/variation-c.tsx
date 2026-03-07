"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@conductor/ui";
import {
  IconUsers,
  IconSearch,
  IconMail,
  IconShieldCheck,
  IconUserPlus,
  IconChevronDown,
  IconChevronUp,
  IconArrowsSort,
  IconFilter,
  IconCheck,
  IconCopy,
} from "@tabler/icons-react";

const USERS = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@acme.io",
    role: "owner",
    status: "active",
    joined: "2024-09-12",
    lastActive: "2 hours ago",
  },
  {
    id: 2,
    name: "Marcus Rivera",
    email: "marcus.r@acme.io",
    role: "admin",
    status: "active",
    joined: "2024-10-03",
    lastActive: "5 minutes ago",
  },
  {
    id: 3,
    name: "Priya Sharma",
    email: "priya.sharma@acme.io",
    role: "member",
    status: "active",
    joined: "2024-11-18",
    lastActive: "1 day ago",
  },
  {
    id: 4,
    name: "James Okafor",
    email: "james.o@acme.io",
    role: "member",
    status: "active",
    joined: "2025-01-07",
    lastActive: "3 hours ago",
  },
  {
    id: 5,
    name: "Lena Müller",
    email: "lena.m@acme.io",
    role: "member",
    status: "inactive",
    joined: "2024-12-22",
    lastActive: "2 weeks ago",
  },
  {
    id: 6,
    name: "David Kim",
    email: "david.kim@acme.io",
    role: "admin",
    status: "active",
    joined: "2025-01-15",
    lastActive: "30 minutes ago",
  },
  {
    id: 7,
    name: "Amara Diallo",
    email: "amara.d@acme.io",
    role: "member",
    status: "active",
    joined: "2025-02-01",
    lastActive: "4 hours ago",
  },
  {
    id: 8,
    name: "Noah Petersen",
    email: "noah.p@acme.io",
    role: "member",
    status: "invited",
    joined: "2025-03-05",
    lastActive: "Never",
  },
  {
    id: 9,
    name: "Elena Volkov",
    email: "elena.v@acme.io",
    role: "member",
    status: "active",
    joined: "2025-02-14",
    lastActive: "1 hour ago",
  },
  {
    id: 10,
    name: "Carlos Mendez",
    email: "carlos.m@acme.io",
    role: "member",
    status: "active",
    joined: "2025-02-20",
    lastActive: "12 minutes ago",
  },
];

type SortField = "name" | "role" | "joined" | "status";
type SortDir = "asc" | "desc";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getStatusColor(status: string) {
  if (status === "active") return "bg-success";
  if (status === "invited") return "bg-primary";
  return "bg-muted-foreground/40";
}

const ROLE_FILTERS = ["all", "owner", "admin", "member"] as const;

export default function VariationC() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "joined") {
      return (
        (new Date(a.joined).getTime() - new Date(b.joined).getTime()) * dir
      );
    }
    return a[sortField].localeCompare(b[sortField]) * dir;
  });

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((u) => u.id)));
    }
  };

  const copyEmail = (user: (typeof USERS)[number]) => {
    navigator.clipboard.writeText(user.email);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <IconArrowsSort size={12} className="text-muted-foreground/50" />;
    return sortDir === "asc" ? (
      <IconChevronUp size={12} className="text-primary" />
    ) : (
      <IconChevronDown size={12} className="text-primary" />
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconUsers size={18} className="text-primary" />
            <h1 className="text-base font-semibold tracking-[-0.02em] text-foreground">
              Users
            </h1>
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {filtered.length}
            </Badge>
          </div>
          <Button size="sm" className="motion-base h-8 text-xs">
            <IconUserPlus size={14} />
            Invite
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Filter users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="flex items-center rounded-lg border border-border/75 bg-secondary/85 shadow-xs">
            {ROLE_FILTERS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                  roleFilter === role
                    ? "bg-background/95 text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <IconFilter
                  size={11}
                  className={roleFilter === role ? "text-primary" : ""}
                />
                {role === "all"
                  ? "All"
                  : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/8 px-3 py-2 text-xs">
            <span className="font-medium text-primary">
              {selected.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        <div className="rounded-lg border border-border/70 bg-card/86 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/40">
                <th className="w-10 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="flex h-4 w-4 items-center justify-center rounded border border-border/80 bg-background transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                    aria-label="Select all users"
                  >
                    {selected.size === filtered.length &&
                      filtered.length > 0 && (
                        <IconCheck size={10} className="text-primary" />
                      )}
                  </button>
                </th>
                {(
                  [
                    ["name", "User"],
                    ["role", "Role"],
                    ["status", "Status"],
                    ["joined", "Joined"],
                  ] as [SortField, string][]
                ).map(([field, label]) => (
                  <th key={field} className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSort(field)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 rounded"
                    >
                      {label}
                      <SortIcon field={field} />
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">
                  Last Active
                </th>
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b border-border/40 transition-colors hover:bg-accent/30 ${
                    selected.has(user.id) ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleSelect(user.id)}
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                        selected.has(user.id)
                          ? "border-primary bg-primary/12"
                          : "border-border/80 bg-background hover:border-primary"
                      }`}
                      aria-label={`Select ${user.name}`}
                    >
                      {selected.has(user.id) && (
                        <IconCheck size={10} className="text-primary" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-[10px] font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-[1.5px] border-card ${getStatusColor(user.status)}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">
                          {user.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={
                        user.role === "owner"
                          ? "default"
                          : user.role === "admin"
                            ? "warning"
                            : "secondary"
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      <IconShieldCheck size={10} className="mr-0.5" />
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        user.status === "active"
                          ? "text-success"
                          : user.status === "invited"
                            ? "text-primary"
                            : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getStatusColor(user.status)}`}
                      />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">
                    {new Date(user.joined).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">
                    {user.lastActive}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => copyEmail(user)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                      aria-label={`Copy email for ${user.name}`}
                    >
                      {copiedId === user.id ? (
                        <IconCheck size={13} className="text-success" />
                      ) : (
                        <IconCopy size={13} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <IconSearch size={16} className="mr-2 opacity-50" />
              No users match current filters
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {filtered.length} of {USERS.length} users shown
        </p>
      </div>
    </div>
  );
}
