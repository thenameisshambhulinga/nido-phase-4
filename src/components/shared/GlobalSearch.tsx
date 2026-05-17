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
  "Products",
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
  Products: { label: "Products", icon: PackageSearch },
  Vendors: { label: "Vendors", icon: Building2 },
  Clients: { label: "Clients", icon: User2 },
  Invoices: { label: "Invoices", icon: FileText },
};

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function fuzzyMatch(
  text: string,
  query: string,
): { matched: boolean; score: number } {
  const t = text.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  if (!t || !q) return { matched: false, score: 0 };
  if (t === q) return { matched: true, score: 100 };
  if (t.startsWith(q)) return { matched: true, score: 85 };
  if (t.includes(q)) return { matched: true, score: 60 };
  const dist = levenshtein(t, q);
  const maxLen = Math.max(t.length, q.length);
  if (dist <= 1) return { matched: true, score: 70 };
  if (dist <= 2) return { matched: true, score: 50 };
  if (dist <= Math.ceil(maxLen * 0.3)) return { matched: true, score: 30 };
  return { matched: false, score: 0 };
}

function highlightText(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return text;
  }

  // Try exact match first
  const normalizedText = text.toLowerCase();
  const startIndex = normalizedText.indexOf(normalizedQuery);
  if (startIndex !== -1) {
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

  // Fuzzy highlight — find best substring match
  let bestIdx = -1;
  let bestLen = 0;
  for (let i = 0; i <= text.length - normalizedQuery.length; i++) {
    const substr = text.slice(i, i + normalizedQuery.length);
    const { matched } = fuzzyMatch(substr, normalizedQuery);
    if (matched && substr.length > bestLen) {
      bestIdx = i;
      bestLen = substr.length;
    }
  }
  if (bestIdx !== -1) {
    return (
      <>
        {text.slice(0, bestIdx)}
        <mark className="rounded bg-amber-200/80 px-0.5 text-slate-950">
          {text.slice(bestIdx, bestIdx + bestLen)}
        </mark>
        {text.slice(bestIdx + bestLen)}
      </>
    );
  }

  return text;
}

const STORAGE_KEY = "nido_recent_searches";
const MAX_RECENT = 8;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  const prev = getRecentSearches().filter((s) => s !== q);
  const next = [q, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function removeRecentSearch(query: string) {
  const next = getRecentSearches().filter((s) => s !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function GlobalSearch() {
  const { searchAll } = useData();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    getRecentSearches(),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const base = searchAll(debouncedQuery);
    // Boost scores for fuzzy matches
    return base.map((result) => {
      const fuzzy = fuzzyMatch(result.title, debouncedQuery);
      const fuzzySub = fuzzyMatch(result.subtitle, debouncedQuery);
      const bestFuzzy = Math.max(fuzzy.score, fuzzySub.score);
      return {
        ...result,
        score: Math.max(result.score, bestFuzzy),
      };
    });
  }, [searchAll, debouncedQuery]);

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
    saveRecentSearch(result.title);
    setRecentSearches(getRecentSearches());
    setQuery(result.title);
    setIsOpen(false);
    navigate(result.path);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!flatResults.length && event.key !== "ArrowDown") return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(
        (current) => (current + 1) % Math.max(flatResults.length, 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current - 1 < 0 ? Math.max(flatResults.length - 1, 0) : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && flatResults[activeIndex]) {
      event.preventDefault();
      handleNavigate(flatResults[activeIndex]);
      return;
    }
  };

  const showPanel = isOpen && query.trim().length > 0;
  const showRecent =
    isOpen && query.trim().length === 0 && recentSearches.length > 0;

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
          placeholder="Search users, orders, vendors, clients, invoices..."
          className="h-10 border-slate-200 bg-slate-50/90 pl-10 pr-9 text-sm shadow-sm transition focus:border-cyan-500 focus:bg-white focus-visible:ring-cyan-500"
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
                <>
                  {GROUP_ORDER.map((group) => {
                    const items = groupedResults[group];
                    if (!items.length) return null;
                    const GroupIcon = GROUP_META[group].icon;
                    return (
                      <div key={group} className="mb-2 last:mb-0">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <GroupIcon className="h-3.5 w-3.5" />
                          <span>{GROUP_META[group].label}</span>
                          <Badge
                            variant="outline"
                            className="ml-auto text-[10px] px-1.5"
                          >
                            {items.length}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {items.slice(0, 5).map((item) => {
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
                                      {highlightText(item.title, query)}
                                    </p>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                                  </div>
                                  <p className="mt-0.5 truncate text-sm text-slate-500">
                                    {highlightText(item.subtitle, query)}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-slate-200 text-slate-600"
                                    >
                                      {item.badge}
                                    </Badge>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {flatResults.length > 5 && (
                    <button
                      type="button"
                      className="w-full py-2.5 text-center text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                      onClick={() => {
                        saveRecentSearch(query);
                        setRecentSearches(getRecentSearches());
                        setIsOpen(false);
                        navigate(`/search?q=${encodeURIComponent(query)}`);
                      }}
                    >
                      View all {flatResults.length} results →
                    </button>
                  )}
                </>
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
      ) : showRecent ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Recent Searches
            </p>
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-2">
              {recentSearches.map((q) => (
                <div
                  key={q}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => {
                    setQuery(q);
                    setDebouncedQuery(q);
                  }}
                >
                  <span className="text-sm text-slate-700">{q}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(q);
                      setRecentSearches(getRecentSearches());
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );
}

export default GlobalSearch;
