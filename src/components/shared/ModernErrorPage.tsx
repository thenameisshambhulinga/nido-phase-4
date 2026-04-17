import { useEffect, useMemo, useState, type ElementType } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CloudOff,
  Home,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorVariant = "runtime" | "offline" | "server" | "not-found";

type ModernErrorPageProps = {
  variant?: ErrorVariant;
  title: string;
  description: string;
  detail?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  showHomeAction?: boolean;
};

const VARIANT_CONFIG: Record<
  ErrorVariant,
  {
    eyebrow: string;
    Icon: ElementType;
    accent: string;
    glow: string;
  }
> = {
  runtime: {
    eyebrow: "Something interrupted the flow",
    Icon: ShieldAlert,
    accent: "from-slate-900 via-slate-700 to-slate-500",
    glow: "shadow-[0_24px_80px_rgba(15,23,42,0.18)]",
  },
  offline: {
    eyebrow: "Connection lost",
    Icon: WifiOff,
    accent: "from-cyan-700 via-sky-600 to-blue-600",
    glow: "shadow-[0_24px_80px_rgba(14,165,233,0.22)]",
  },
  server: {
    eyebrow: "Server interruption",
    Icon: CloudOff,
    accent: "from-rose-700 via-red-600 to-orange-500",
    glow: "shadow-[0_24px_80px_rgba(244,63,94,0.18)]",
  },
  "not-found": {
    eyebrow: "Route not found",
    Icon: AlertTriangle,
    accent: "from-amber-700 via-orange-600 to-rose-500",
    glow: "shadow-[0_24px_80px_rgba(249,115,22,0.18)]",
  },
};

export default function ModernErrorPage({
  variant = "runtime",
  title,
  description,
  detail,
  primaryActionLabel = "Try again",
  secondaryActionLabel = "Go back",
  onPrimaryAction,
  onSecondaryAction,
  showHomeAction = true,
}: ModernErrorPageProps) {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const config = VARIANT_CONFIG[variant];
  const Icon = config.Icon;
  const isOffline = variant === "offline" || !online;

  const background = useMemo(
    () =>
      cn(
        "relative min-h-screen overflow-hidden bg-slate-950 text-white",
        isOffline &&
          "bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900",
      ),
    [isOffline],
  );

  return (
    <div className={background}>
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <Card
          className={cn(
            "w-full max-w-3xl border-white/10 bg-white/95 text-slate-900 backdrop-blur-xl",
            config.glow,
          )}
        >
          <CardContent className="space-y-8 p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                  {config.eyebrow}
                </div>
                <div className="space-y-2">
                  <h1 className="max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    {description}
                  </p>
                  {detail && (
                    <p className="max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {detail}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-white",
                  config.accent,
                )}
              >
                <Icon className="h-11 w-11" />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  State
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {variant === "offline"
                    ? "Offline"
                    : variant === "server"
                      ? "Server error"
                      : variant === "not-found"
                        ? "Missing route"
                        : "Runtime error"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Connection
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {isOffline ? "No internet detected" : "Online"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Recovery
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  Retry or return to a stable page
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={onPrimaryAction}
                className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
                {primaryActionLabel}
              </Button>
              <Button
                variant="outline"
                onClick={onSecondaryAction}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {secondaryActionLabel}
              </Button>
              {showHomeAction && (
                <Button
                  variant="secondary"
                  onClick={() => (window.location.href = "/home")}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
