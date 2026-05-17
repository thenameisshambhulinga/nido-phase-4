import { useState, useCallback, useEffect, useMemo } from "react";
import {
  X,
  User,
  Building2,
  Globe,
  Monitor,
  Palette,
  Bell,
  Eye,
  Shield,
  ChevronRight,
  Check,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";
import { useI18n } from "@/i18n/I18nProvider";
import {
  usePreferences,
  HomeStyle,
  LandingPage,
} from "@/store/preferencesStore";
import { useToast } from "@/hooks/use-toast";

interface EnterpriseSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "light", label: "Light Mode", icon: "☀️" },
  { value: "dark", label: "Dark Mode", icon: "🌙" },
  { value: "comfort", label: "Eye Comfort", icon: "😌" },
];

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)", flag: "🇺🇸" },
  { value: "en-IN", label: "English (India)", flag: "🇮🇳" },
  { value: "fr-FR", label: "French", flag: "🇫🇷" },
  { value: "es-MX", label: "Spanish", flag: "🇲🇽" },
  { value: "de-DE", label: "German", flag: "🇩🇪" },
];

const LANDING_PAGE_OPTIONS: { value: LandingPage; label: string }[] = [
  { value: "home", label: "Home Dashboard" },
  { value: "shop", label: "Shop / Catalogue" },
  { value: "global-search", label: "Global Search" },
  { value: "orders", label: "Orders" },
  { value: "invoices", label: "Invoices" },
  { value: "tickets", label: "Ticket Tracking" },
  { value: "dashboard", label: "Main Dashboard" },
];

const HOME_STYLE_OPTIONS: { value: HomeStyle; label: string }[] = [
  { value: "snapshot", label: "Snapshot View" },
  { value: "simple-nav", label: "Simple Navigation" },
  { value: "compact", label: "Compact View" },
  { value: "executive", label: "Executive View" },
];

const REPORT_SIZE_OPTIONS = [10, 15, 20, 25, 50, 100];

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

export default function EnterpriseSettingsPanel({
  open,
  onClose,
}: EnterpriseSettingsPanelProps) {
  const { t } = useI18n();
  const { theme: themeCtx, setTheme } = useTheme();
  const { language: i18nLanguage, setLanguage } = useI18n();
  const {
    landingPage,
    setLandingPage,
    homeStyle,
    setHomeStyle,
    reportPageSize,
    setReportPageSize,
    compactMode,
    setCompactMode,
    reduceMotion,
    setReduceMotion,
    highContrast,
    setHighContrast,
    notificationsEnabled,
    setNotificationsEnabled,
    emailDigest,
    setEmailDigest,
    soundEffects,
    setSoundEffects,
  } = usePreferences();

  const { toast } = useToast();

  const [draft, setDraft] = useState<{
    language: string;
    landingPage: LandingPage;
    homeStyle: HomeStyle;
    reportPageSize: number;
    theme: ThemeMode;
    compactMode: boolean;
    reduceMotion: boolean;
    highContrast: boolean;
    notificationsEnabled: boolean;
    emailDigest: boolean;
    soundEffects: boolean;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const draftReady = useMemo(() => !!draft, [draft]);

  const ensureDraftFromCurrent = useCallback(() => {
    setDraft({
      language: i18nLanguage,
      landingPage,
      homeStyle,
      reportPageSize,
      theme: themeCtx,
      compactMode,
      reduceMotion,
      highContrast,
      notificationsEnabled,
      emailDigest,
      soundEffects,
    });
  }, [
    i18nLanguage,
    landingPage,
    homeStyle,
    reportPageSize,
    themeCtx,
    compactMode,
    reduceMotion,
    highContrast,
    notificationsEnabled,
    emailDigest,
    soundEffects,
  ]);

  useEffect(() => {
    if (!open) return;
    ensureDraftFromCurrent();
  }, [open, ensureDraftFromCurrent]);

  const commit = useCallback(async () => {
    if (!draft) return;

    setIsSaving(true);
    try {
      // Language first (so any visible labels reflect immediately)
      setLanguage(draft.language);

      setLandingPage(draft.landingPage);
      setHomeStyle(draft.homeStyle);
      setReportPageSize(draft.reportPageSize);

      setTheme(draft.theme);
      setCompactMode(draft.compactMode);
      setReduceMotion(draft.reduceMotion);
      setHighContrast(draft.highContrast);

      setNotificationsEnabled(draft.notificationsEnabled);
      setEmailDigest(draft.emailDigest);
      setSoundEffects(draft.soundEffects);

      toast({
        title: t("common.save") || "Saved",
        description: "Settings updated successfully.",
      });
      setTimeout(() => onClose(), 500);
    } finally {
      setIsSaving(false);
    }
  }, [
    draft,
    setLanguage,
    setLandingPage,
    setHomeStyle,
    setReportPageSize,
    setTheme,
    setCompactMode,
    setReduceMotion,
    setHighContrast,
    setNotificationsEnabled,
    setEmailDigest,
    setSoundEffects,
    toast,
    onClose,
    t,
  ]);

  const updateDraft = useCallback(
    <K extends keyof NonNullable<typeof draft>>(
      key: K,
      value: NonNullable<typeof draft>[K],
    ) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-full max-w-[1000px] max-h-[85vh] p-0 overflow-hidden rounded-[16px] bg-transparent">
        {/* Premium centered container */}
        <div className="relative h-full overflow-hidden rounded-[16px] border border-border/70 bg-white/70 backdrop-blur-2xl shadow-[0_35px_120px_-70px_rgba(37,99,235,0.35)]">
          <DialogHeader className="relative border-b border-border/40 bg-gradient-to-r from-blue-50 via-white/60 to-cyan-50 p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    {t("settings.appearance")}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.preferences") || "Premium preferences"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="grid h-full grid-cols-1 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="space-y-5 p-6">
                {/* ACCOUNT */}
                <div className="space-y-2">
                  <SectionHeader icon={User} title={t("common.account")} />
                  <div className="rounded-xl border bg-card/70 p-3 space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-sm h-10"
                      onClick={() => onClose()}
                    >
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" /> {t("common.profile")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-sm h-10"
                      onClick={() => onClose()}
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />{" "}
                        {t("common.organizations")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* DISPLAY */}
                <div className="space-y-2">
                  <SectionHeader
                    icon={Globe}
                    title={t("settings.languageLocale")}
                  />
                  <div className="rounded-xl border bg-card/70 p-4 space-y-3">
                    <SettingRow label={t("settings.displayLanguage")}>
                      <Select
                        value={draft?.language ?? i18nLanguage}
                        onValueChange={(v) => updateDraft("language", v)}
                      >
                        <SelectTrigger className="w-52 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              <span className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </div>
                </div>

                <Separator />

                {/* NAVIGATION */}
                <div className="space-y-2">
                  <SectionHeader
                    icon={Monitor}
                    title={t("settings.navigation")}
                  />
                  <div className="rounded-xl border bg-card/70 p-4 space-y-3">
                    <SettingRow label={t("settings.defaultLanding")}>
                      <Select
                        value={draft?.landingPage ?? landingPage}
                        onValueChange={(v) =>
                          updateDraft("landingPage", v as LandingPage)
                        }
                      >
                        <SelectTrigger className="w-52 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANDING_PAGE_OPTIONS.map((page) => (
                            <SelectItem key={page.value} value={page.value}>
                              {page.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <SettingRow label={t("settings.homePageStyle")}>
                      <Select
                        value={draft?.homeStyle ?? homeStyle}
                        onValueChange={(v) =>
                          updateDraft("homeStyle", v as HomeStyle)
                        }
                      >
                        <SelectTrigger className="w-52 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOME_STYLE_OPTIONS.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <SettingRow label={t("settings.reportPageSize")}>
                      <Select
                        value={String(draft?.reportPageSize ?? reportPageSize)}
                        onValueChange={(v) =>
                          updateDraft("reportPageSize", parseInt(v, 10))
                        }
                      >
                        <SelectTrigger className="w-24 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REPORT_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </div>
                </div>

                <Separator />

                {/* APPEARANCE */}
                <div className="space-y-2">
                  <SectionHeader
                    icon={Palette}
                    title={t("settings.appearance")}
                  />
                  <div className="rounded-xl border bg-card/70 p-4 space-y-3">
                    <SettingRow label={t("settings.compactMode")}>
                      <Switch
                        checked={draft?.compactMode ?? compactMode}
                        onCheckedChange={(v) => updateDraft("compactMode", v)}
                      />
                    </SettingRow>

                    <SettingRow label={t("settings.appearance")}>
                      <Select
                        value={draft?.theme ?? themeCtx}
                        onValueChange={(v) =>
                          updateDraft("theme", v as ThemeMode)
                        }
                      >
                        <SelectTrigger className="w-40 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THEME_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </div>
                </div>

                <Separator />

                {/* ACCESSIBILITY */}
                <div className="space-y-2">
                  <SectionHeader
                    icon={Eye}
                    title={t("settings.accessibility")}
                  />
                  <div className="rounded-xl border bg-card/70 p-4 space-y-3">
                    <SettingRow label={t("settings.reduceMotion")}>
                      <Switch
                        checked={draft?.reduceMotion ?? reduceMotion}
                        onCheckedChange={(v) => updateDraft("reduceMotion", v)}
                      />
                    </SettingRow>
                    <SettingRow label={t("settings.highContrast")}>
                      <Switch
                        checked={draft?.highContrast ?? highContrast}
                        onCheckedChange={(v) => updateDraft("highContrast", v)}
                      />
                    </SettingRow>
                  </div>
                </div>

                <Separator />

                {/* NOTIFICATIONS */}
                <div className="space-y-2">
                  <SectionHeader
                    icon={Bell}
                    title={t("common.notifications")}
                  />
                  <div className="rounded-xl border bg-card/70 p-4 space-y-3">
                    <SettingRow label={t("settings.pushNotifications")}>
                      <Switch
                        checked={
                          draft?.notificationsEnabled ?? notificationsEnabled
                        }
                        onCheckedChange={(v) =>
                          updateDraft("notificationsEnabled", v)
                        }
                      />
                    </SettingRow>
                    <SettingRow label={t("settings.emailDigest")}>
                      <Switch
                        checked={draft?.emailDigest ?? emailDigest}
                        onCheckedChange={(v) => updateDraft("emailDigest", v)}
                      />
                    </SettingRow>
                    <SettingRow label={t("settings.soundEffects")}>
                      <Switch
                        checked={draft?.soundEffects ?? soundEffects}
                        onCheckedChange={(v) => updateDraft("soundEffects", v)}
                      />
                    </SettingRow>
                  </div>
                </div>

                <Separator />

                {/* SECURITY */}
                <div className="space-y-2">
                  <SectionHeader icon={Shield} title={t("settings.security")} />
                  <div className="rounded-xl border bg-card/70 p-4 space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm h-10"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Security & Password
                      </span>
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="h-6" />
              </div>
            </ScrollArea>

            {/* Sticky save area (bottom-right premium) */}
            <div className="border-t border-border/40 bg-white/70 backdrop-blur-md p-4">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-xl"
                >
                  {t("common.cancel")}
                </Button>

                <Button
                  onClick={commit}
                  disabled={!draftReady || isSaving}
                  className="rounded-xl bg-blue-600 px-5 text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : t("settings.save")}
                    <span className="sr-only">{t("settings.save")}</span>
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Corner checkmark when saved (short lived) */}
      </DialogContent>
    </Dialog>
  );
}
