"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import {
  IconUsers,
  IconSearch,
  IconMail,
  IconDots,
  IconShieldCheck,
  IconUserPlus,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
} from "@tabler/icons-react";

const USERS = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@acme.io",
    role: "owner",
    status: "active",
    joined: "2024-09-12",
    avatar: "",
  },
  {
    id: 2,
    name: "Marcus Rivera",
    email: "marcus.r@acme.io",
    role: "admin",
    status: "active",
    joined: "2024-10-03",
    avatar: "",
  },
  {
    id: 3,
    name: "Priya Sharma",
    email: "priya.sharma@acme.io",
    role: "member",
    status: "active",
    joined: "2024-11-18",
    avatar: "",
  },
  {
    id: 4,
    name: "James Okafor",
    email: "james.o@acme.io",
    role: "member",
    status: "active",
    joined: "2025-01-07",
    avatar: "",
  },
  {
    id: 5,
    name: "Lena Müller",
    email: "lena.m@acme.io",
    role: "member",
    status: "inactive",
    joined: "2024-12-22",
    avatar: "",
  },
  {
    id: 6,
    name: "David Kim",
    email: "david.kim@acme.io",
    role: "admin",
    status: "active",
    joined: "2025-01-15",
    avatar: "",
  },
  {
    id: 7,
    name: "Amara Diallo",
    email: "amara.d@acme.io",
    role: "member",
    status: "active",
    joined: "2025-02-01",
    avatar: "",
  },
  {
    id: 8,
    name: "Noah Petersen",
    email: "noah.p@acme.io",
    role: "member",
    status: "invited",
    joined: "2025-03-05",
    avatar: "",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getRoleBadgeVariant(role: string) {
  if (role === "owner") return "default" as const;
  if (role === "admin") return "warning" as const;
  return "secondary" as const;
}

function getStatusBadgeVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "invited") return "default" as const;
  return "outline" as const;
}

export default function VariationA() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const filtered = USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "all") return matchSearch;
    return matchSearch && u.status === activeTab;
  });

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <IconUsers size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                Users
              </h1>
              <p className="text-sm text-muted-foreground">
                {USERS.length} members across your workspace
              </p>
            </div>
          </div>
          <Button size="sm" className="motion-base">
            <IconUserPlus size={16} />
            Invite User
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v);
                  setPage(0);
                }}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  <TabsTrigger value="invited">Invited</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-full sm:w-64">
                <IconSearch
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {paged.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40 md:px-6"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconMail size={12} />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <IconCalendar size={12} />
                    <span>
                      {new Date(user.joined).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    <IconShieldCheck size={12} className="mr-1" />
                    {user.role}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(user.status)}>
                    {user.status}
                  </Badge>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                    aria-label={`Actions for ${user.name}`}
                  >
                    <IconDots size={16} />
                  </button>
                </div>
              ))}
              {paged.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <IconSearch size={24} className="mb-2 opacity-50" />
                  <p className="text-sm">No users found</p>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 md:px-6">
                <p className="text-xs text-muted-foreground">
                  Showing {page * pageSize + 1}–
                  {Math.min((page + 1) * pageSize, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                    aria-label="Previous page"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                    aria-label="Next page"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
