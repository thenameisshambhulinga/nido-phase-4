import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
  PackageSearch,
  Search,
  User2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useData, type GlobalSearchResult } from "@/contexts/DataContext";

const GROUP_ORDER: GlobalSearchResult["group"][] = [
  "Users",
  "Orders",
  "Vendors",
  "Clients",
  "Invoices",
];

const GROUP_META: Record<
  GlobalSearchResult["group"],
  { label: string; icon: typeof Users }
> = {
  Users: { label: "Users", icon: Users },
  Orders: { label: "Orders", icon: ClipboardList },
  Vendors: { label: "Vendors", icon: Building2 },
  Clients: { label: "Clients", icon: User2 },
  Invoices: { label: "Invoices", icon: FileText },
};

function highlightText(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return text;
  }

  const normalizedText = text.toLowerCase();
  const startIndex = normalizedText.indexOf(normalizedQuery);
  if (startIndex === -1) {
    return text;
  }

  const endIndex = startIndex + normalizedQuery.length;
  return (
    <>
      {text.slice(0, startIndex)}
      <mark className="rounded bg-amber-200/80 px-0.5 text-slate-950">
        {text.slice(startIndex, endIndex)}
      </mark>
      {text.slice(endIndex)}
    </>
  );
}

export function GlobalSearch() {
  const { searchAll } = useData();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query]);

  const results = useMemo(
    () => searchAll(debouncedQuery),
    [searchAll, debouncedQuery],
  );

  const groupedResults = useMemo(() => {
    const buckets: Record<GlobalSearchResult["group"], GlobalSearchResult[]> = {
      Users: [],
      Orders: [],
      Vendors: [],
      Clients: [],
      Invoices: [],
    };

    results.forEach((result) => {
      buckets[result.group].push(result);
    });

    return buckets;
  }, [results]);

  const flatResults = useMemo(
    () => GROUP_ORDER.flatMap((group) => groupedResults[group]),
    [groupedResults],
  );

  useEffect(() => {
    if (activeIndex >= flatResults.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, flatResults.length]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleNavigate = (result: GlobalSearchResult) => {
    setQuery(result.title);
    setIsOpen(false);
    navigate(result.path);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!flatResults.length && event.key !== "Escape") return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % flatResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current - 1 < 0 ? flatResults.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && flatResults[activeIndex]) {
      event.preventDefault();
      handleNavigate(flatResults[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showPanel = isOpen && debouncedQuery.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search users, orders, vendors, clients, invoices"
          className="h-12 border-slate-200 bg-slate-50/90 pl-11 pr-10 text-sm shadow-sm transition focus:border-cyan-500 focus:bg-white focus-visible:ring-cyan-500"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setActiveIndex(0);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Global Search
              </p>
              <p className="text-sm text-slate-600">
                {flatResults.length
                  ? `${flatResults.length} matches found`
                  : "No matches found"}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full bg-cyan-50 text-cyan-800"
            >
              Live
            </Badge>
          </div>

          <ScrollArea className="max-h-[28rem]">
            <div className="p-2">
              {flatResults.length ? (
                GROUP_ORDER.map((group) => {
                  const items = groupedResults[group];
                  if (!items.length) return null;
                  const GroupIcon = GROUP_META[group].icon;

                  return (
                    <div key={group} className="mb-2 last:mb-0">
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <GroupIcon className="h-3.5 w-3.5" />
                        <span>{GROUP_META[group].label}</span>
                      </div>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const resultIndex = flatResults.findIndex(
                            (candidate) =>
                              candidate.group === item.group &&
                              candidate.id === item.id,
                          );
                          const isActive = resultIndex === activeIndex;
                          return (
                            <button
                              key={`${item.group}-${item.id}`}
                              type="button"
                              onMouseEnter={() => setActiveIndex(resultIndex)}
                              onClick={() => handleNavigate(item)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition",
                                isActive
                                  ? "bg-cyan-50 ring-1 ring-cyan-200"
                                  : "hover:bg-slate-50",
                              )}
                            >
                              <div
                                className={cn(
                                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                  isActive
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-100 text-slate-600",
                                )}
                              >
                                <GroupIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate font-medium text-slate-900">
                                    {highlightText(item.title, debouncedQuery)}
                                  </p>
                                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                                </div>
                                <p className="mt-0.5 truncate text-sm text-slate-500">
                                  {highlightText(item.subtitle, debouncedQuery)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Badge
                                    variant="outline"
                                    className="rounded-full border-slate-200 text-slate-600"
                                  >
                                    {item.badge}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full bg-slate-100 text-slate-600"
                                  >
                                    {item.path}
                                  </Badge>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-slate-500">
                  <PackageSearch className="h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-700">
                    No matching records
                  </p>
                  <p className="text-xs text-slate-500">
                    Try a client name, order number, vendor, invoice, or role.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );
}

export default GlobalSearch;
