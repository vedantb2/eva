"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface PageTitleContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(
  undefined,
);

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [pageTitle, setPageTitleState] = useState("");

  const setPageTitle = (title: string) => {
    setPageTitleState(title);
  };

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error("usePageTitle must be used within a PageTitleProvider");
  }
  return context;
}

/**
 * Publish this route's title to the mobile top bar, which `Sidebar` reads from
 * this context. `PageWrapper` does it for the routes built on it; a page using
 * `PageHeader` from @eva/ui instead owns its own header markup, so it has to
 * publish the title itself — this exists so it is one line rather than a
 * copy-pasted effect in every such page.
 */
export function useRoutePageTitle(title: string) {
  const { setPageTitle } = usePageTitle();
  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle("");
  }, [title, setPageTitle]);
}
