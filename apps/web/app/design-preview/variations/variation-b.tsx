"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@conductor/ui";
import {
  IconUsers,
  IconSearch,
  IconMail,
  IconShieldCheck,
  IconUserPlus,
  IconBrandGithub,
  IconCalendar,
  IconStar,
  IconX,
  IconMapPin,
  IconCode,
} from "@tabler/icons-react";

const USERS = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@acme.io",
    role: "owner",
    status: "active",
    joined: "2024-09-12",
    location: "San Francisco, CA",
    github: "sarahchen",
    projects: 12,
    avatar: "",
  },
  {
    id: 2,
    name: "Marcus Rivera",
    email: "marcus.r@acme.io",
    role: "admin",
    status: "active",
    joined: "2024-10-03",
    location: "Austin, TX",
    github: "marcusdev",
    projects: 8,
    avatar: "",
  },
  {
    id: 3,
    name: "Priya Sharma",
    email: "priya.sharma@acme.io",
    role: "member",
    status: "active",
    joined: "2024-11-18",
    location: "Bangalore, IN",
    github: "priyasharma",
    projects: 15,
    avatar: "",
  },
  {
    id: 4,
    name: "James Okafor",
    email: "james.o@acme.io",
    role: "member",
    status: "active",
    joined: "2025-01-07",
    location: "London, UK",
    github: "jamesokafor",
    projects: 6,
    avatar: "",
  },
  {
    id: 5,
    name: "Lena Müller",
    email: "lena.m@acme.io",
    role: "member",
    status: "inactive",
    joined: "2024-12-22",
    location: "Berlin, DE",
    github: "lenamuller",
    projects: 3,
    avatar: "",
  },
  {
    id: 6,
    name: "David Kim",
    email: "david.kim@acme.io",
    role: "admin",
    status: "active",
    joined: "2025-01-15",
    location: "Seoul, KR",
    github: "davidkim",
    projects: 10,
    avatar: "",
  },
  {
    id: 7,
    name: "Amara Diallo",
    email: "amara.d@acme.io",
    role: "member",
    status: "active",
    joined: "2025-02-01",
    location: "Dakar, SN",
    github: "amaradev",
    projects: 4,
    avatar: "",
  },
  {
    id: 8,
    name: "Noah Petersen",
    email: "noah.p@acme.io",
    role: "member",
    status: "invited",
    joined: "2025-03-05",
    location: "Copenhagen, DK",
    github: "noahp",
    projects: 0,
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

function getStatusColor(status: string) {
  if (status === "active") return "bg-success";
  if (status === "invited") return "bg-primary";
  return "bg-muted-foreground/40";
}

export default function VariationB() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<
    (typeof USERS)[number] | null
  >(null);
  const [starred, setStarred] = useState<Set<number>>(new Set([1, 3]));

  const filtered = USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.location.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleStar = (id: number) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-sm">
                <IconUsers size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
                  Team Directory
                </h1>
                <p className="text-sm text-muted-foreground">
                  {USERS.filter((u) => u.status === "active").length} active of{" "}
                  {USERS.length} total members
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <IconSearch
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search name, email, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button size="sm" className="motion-base">
              <IconUserPlus size={16} />
              Invite
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((user) => (
            <Dialog
              key={user.id}
              open={selectedUser?.id === user.id}
              onOpenChange={(open) => setSelectedUser(open ? user : null)}
            >
              <DialogTrigger asChild>
                <Card className="group cursor-pointer transition-all duration-[var(--motion-base)] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-sm font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${getStatusColor(user.status)}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(user.id);
                        }}
                        className="rounded-md p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                        aria-label={
                          starred.has(user.id)
                            ? `Unstar ${user.name}`
                            : `Star ${user.name}`
                        }
                      >
                        <IconStar
                          size={16}
                          className={
                            starred.has(user.id)
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/50"
                          }
                        />
                      </button>
                    </div>
                    <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                      {user.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        <IconShieldCheck size={10} className="mr-1" />
                        {user.role}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconMapPin size={12} />
                        {user.location.split(",")[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconCode size={12} />
                        {user.projects} projects
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-sm font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Email
                      </p>
                      <div className="flex items-center gap-1.5">
                        <IconMail size={14} className="text-primary" />
                        <p className="text-sm font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        GitHub
                      </p>
                      <div className="flex items-center gap-1.5">
                        <IconBrandGithub
                          size={14}
                          className="text-foreground"
                        />
                        <p className="text-sm font-medium">@{user.github}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Location
                      </p>
                      <div className="flex items-center gap-1.5">
                        <IconMapPin size={14} className="text-primary" />
                        <p className="text-sm font-medium">{user.location}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Joined
                      </p>
                      <div className="flex items-center gap-1.5">
                        <IconCalendar size={14} className="text-primary" />
                        <p className="text-sm font-medium">
                          {new Date(user.joined).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      <IconShieldCheck size={10} className="mr-1" />
                      {user.role}
                    </Badge>
                    <Badge
                      variant={
                        user.status === "active"
                          ? "success"
                          : user.status === "invited"
                            ? "default"
                            : "outline"
                      }
                    >
                      {user.status}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {user.projects} active projects
                    </span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <IconSearch size={28} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No users matched your search</p>
            <p className="mt-1 text-xs">
              Try a different name, email, or location
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSearch("")}
            >
              <IconX size={14} />
              Clear search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
