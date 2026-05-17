import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { searchAll } = useData();
  const [homeSearch, setHomeSearch] = useState("");
  const [debouncedHomeSearch, setDebouncedHomeSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedHomeSearch(homeSearch);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [homeSearch]);

  const quickResult = useMemo(() => {
    const term = debouncedHomeSearch.trim();
    if (!term) return null;
    return searchAll(term)[0] || null;
  }, [debouncedHomeSearch, searchAll]);

  const handleSubmit = () => {
    if (quickResult?.path) {
      navigate(quickResult.path);
      return;
    }

    if (homeSearch.trim()) {
      navigate(`/shop?search=${encodeURIComponent(homeSearch.trim())}`);
      return;
    }

    navigate("/shop");
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_42%),linear-gradient(180deg,_#f8fafc,_#eef4ff_62%,_#f8fafc)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-8rem] top-[-4rem] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <section
        className={cn(
          "relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center px-4 py-16 sm:px-6 lg:px-8",
        )}
      >
        <div className="w-full space-y-10">
          <div className="space-y-5 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              NIDO-TECH
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Elevate Your Procurement with NIDO-TECH
            </h1>
          </div>

          <form
            className="mx-auto w-full max-w-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div className="group relative rounded-[28px] border border-slate-200 bg-white/90 p-2 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.3)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex items-center gap-3 rounded-[22px] bg-slate-50 px-4 py-3">
                <Search className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  value={homeSearch}
                  onChange={(event) => setHomeSearch(event.target.value)}
                  placeholder="Search products, clients, orders..."
                  className="h-11 flex-1 border-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
