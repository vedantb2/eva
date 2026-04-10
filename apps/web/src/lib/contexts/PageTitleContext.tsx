"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface PageTitleContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(
  undefined,
);

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [pageTitle, setPageTitleState] = useState("");

  const setPageTitle = useCallback((title: string) => {
    setPageTitleState(title);
  }, []);

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
