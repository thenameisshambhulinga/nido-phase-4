import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Search,
  Sparkles,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";

interface Attachment {
  id: string;
  file: File;
  preview: string;
  type: "pdf" | "image";
  name: string;
  size: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { searchAll } = useData();
  const [homeSearch, setHomeSearch] = useState("");
  const [debouncedHomeSearch, setDebouncedHomeSearch] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (homeSearch.trim() || attachments.length > 0) {
      // Build search query with attachment IDs
      const params = new URLSearchParams();
      if (homeSearch.trim()) {
        params.set("search", homeSearch.trim());
      }
      if (attachments.length > 0) {
        params.set("attachments", attachments.map((a) => a.id).join(","));
      }
      navigate(`/shop?${params.toString()}`);
      return;
    }

    navigate("/shop");
  };

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        const isImage = file.type.startsWith("image/");
        const isPDF = file.type === "application/pdf";

        if (!isImage && !isPDF) return;

        const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setAttachments((prev) => [
              ...prev,
              {
                id,
                file,
                preview: e.target?.result as string,
                type: "image",
                name: file.name,
                size: file.size,
              },
            ]);
          };
          reader.readAsDataURL(file);
        } else {
          setAttachments((prev) => [
            ...prev,
            {
              id,
              file,
              preview: "",
              type: "pdf",
              name: file.name,
              size: file.size,
            },
          ]);
        }
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const hasContent = homeSearch.trim() || attachments.length > 0;

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_42%),linear-gradient(180deg,_#f8fafc,_#eef4ff_62%,_#f8fafc)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-8rem] top-[-4rem] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <section
        className={cn(
          "relative mx-auto min-h-[calc(100vh-8rem)] max-w-5xl px-4 py-16 sm:px-6 lg:px-8",
        )}
      >
        <div className="relative z-10 w-full space-y-10">
          <div className="space-y-5 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200 shadow-[0_20px_60px_-48px_rgba(34,211,238,0.35)] backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              NIDO-TECH
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mx-auto max-w-4xl text-[clamp(2.4rem,5vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-slate-900 sm:text-[clamp(3rem,5vw,5.25rem)]"
            >
              Elevate Your Procurement with{" "}
              <span className="relative inline-flex text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500 drop-shadow-[0_16px_45px_rgba(56,189,248,0.18)]">
                NIDO-TECH
                <span className="absolute -right-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-cyan-300/40 blur-xl" />
              </span>
            </motion.h1>
            <div className="relative mx-auto h-1 w-28 overflow-hidden rounded-full bg-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 opacity-70 blur-sm" />
            </div>
          </div>

          <form
            className="mx-auto w-full max-w-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div className="group relative">
              <div className="absolute inset-0 rounded-[32px] border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-[0_40px_100px_-70px_rgba(56,189,248,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:shadow-[0_50px_120px_-80px_rgba(79,70,229,0.22)]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Search className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    value={homeSearch}
                    onChange={(event) => setHomeSearch(event.target.value)}
                    placeholder="Search products, clients, orders..."
                    className="h-12 w-full flex-1 border-0 bg-transparent text-base text-slate-50 placeholder:text-slate-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "shrink-0 rounded-2xl p-2 transition-all duration-200",
                      attachments.length > 0
                        ? "bg-cyan-500/10 text-cyan-200"
                        : "text-slate-500 hover:bg-white/10 hover:text-slate-100",
                    )}
                    title="Attach PDF or Image"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-2xl shadow-[0_20px_60px_-40px_rgba(14,165,233,0.45)] transition-all duration-200",
                      hasContent
                        ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600",
                    )}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="border-t border-white/10 bg-slate-950/85 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
                        >
                          {attachment.type === "pdf" ? (
                            <FileText className="h-3.5 w-3.5 text-rose-400" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5 text-emerald-300" />
                          )}
                          <span className="max-w-[120px] truncate">
                            {attachment.name}
                          </span>
                          <span className="text-slate-400">
                            ({formatFileSize(attachment.size)})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="rounded-full p-0.5 text-slate-400 hover:bg-white/10 hover:text-slate-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
