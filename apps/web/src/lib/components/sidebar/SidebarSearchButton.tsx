"use client";

import { Button } from "@conductor/ui";
import { IconSearch } from "@tabler/icons-react";
import { useSearch } from "@/lib/contexts/SearchContext";

export function SidebarSearchButton() {
  const { openSearch } = useSearch();
  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-muted-foreground hover:text-sidebar-foreground"
      title="Search"
      onClick={openSearch}
    >
      <IconSearch size={16} />
    </Button>
  );
}
