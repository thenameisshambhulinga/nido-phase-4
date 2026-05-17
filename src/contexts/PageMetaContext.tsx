import React, { createContext, useContext, useState, ReactNode } from "react";

type Breadcrumb = { label: string; href?: string };

interface PageMeta {
  title?: string;
  breadcrumbs?: Breadcrumb[];
}

interface PageMetaContextValue {
  meta: PageMeta;
  setMeta: (m: PageMeta) => void;
}

const PageMetaContext = createContext<PageMetaContextValue | undefined>(
  undefined,
);

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>({
    title: undefined,
    breadcrumbs: [],
  });
  return (
    <PageMetaContext.Provider value={{ meta, setMeta }}>
      {children}
    </PageMetaContext.Provider>
  );
}

export function usePageMeta() {
  const ctx = useContext(PageMetaContext);
  if (!ctx) throw new Error("usePageMeta must be used within PageMetaProvider");
  return ctx;
}
