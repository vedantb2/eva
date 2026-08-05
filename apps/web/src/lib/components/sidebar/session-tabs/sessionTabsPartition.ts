import {
  isSessionSidebarActive,
  type SessionPrState,
} from "@/routes/_repo/$owner/$repo/sessions/_utils/sessionReadOnly";

export interface SessionTabLike {
  archived?: boolean;
  prState?: SessionPrState;
}

/**
 * Active tabs = not manually archived.
 * Archived menu = manually archived only (PR merge/close does not move a tab).
 */
export function partitionSessionsForChromeTabs<
  TActive extends SessionTabLike,
  TArchived extends SessionTabLike,
>(
  nonArchived: TActive[],
  archived: TArchived[],
): { active: TActive[]; archivedMenu: Array<TActive | TArchived> } {
  return {
    active: nonArchived.filter(isSessionSidebarActive),
    archivedMenu: [...archived],
  };
}
