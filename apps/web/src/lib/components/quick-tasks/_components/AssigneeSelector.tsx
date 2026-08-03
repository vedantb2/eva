"use client";

import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@eva/ui";
import { IconUserPlus, IconCheck } from "@tabler/icons-react";
import { getUserInitials, UserInitials } from "@eva/shared";
import { Facehash } from "facehash";
import type { FunctionReturnType } from "convex/server";
import type { api, Id } from "@eva/backend";
import { getUserDisplayName } from "@/lib/components/tasks/_components/task-detail-constants";

type User = FunctionReturnType<typeof api.users.listAll>[number];

export function AssigneeSelector({
  users,
  assignedTo,
  setAssignedTo,
}: {
  users: User[] | undefined;
  assignedTo: Id<"users"> | undefined;
  setAssignedTo: (id: Id<"users"> | undefined) => void;
}) {
  const assignedUser = assignedTo
    ? users?.find((u) => u._id === assignedTo)
    : undefined;

  const reviewers = (users ?? []).filter((u) => u.role === "dev");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 font-normal text-muted-foreground hover:text-foreground"
        >
          {assignedUser ? (
            <>
              <UserInitials user={assignedUser} size="sm" hideLastSeen />
              <span data-pii className="text-foreground">
                {getUserDisplayName(assignedUser)}
              </span>
            </>
          ) : (
            <>
              <IconUserPlus size={14} />
              <span>Code Reviewer</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="unassigned"
                onSelect={() => setAssignedTo(undefined)}
              >
                <IconUserPlus size={14} className="text-muted-foreground" />
                Unassigned
                {!assignedTo && <IconCheck size={14} className="ml-auto" />}
              </CommandItem>
              {reviewers.map((user) => (
                <CommandItem
                  key={user._id}
                  value={getUserDisplayName(user)}
                  onSelect={() => setAssignedTo(user._id)}
                >
                  <Facehash
                    size={16}
                    name={getUserInitials(user)}
                    enableBlink
                  />
                  <span data-pii>{getUserDisplayName(user)}</span>
                  {assignedTo === user._id && (
                    <IconCheck size={14} className="ml-auto" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
