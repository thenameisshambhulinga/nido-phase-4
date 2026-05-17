import { useState } from "react";
import {
  Bell,
  Check,
  Eye,
  Globe,
  LayoutGrid,
  Monitor,
  Palette,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/I18nProvider";
import { useTheme } from "@/contexts/ThemeContext";
import { usePreferences } from "@/store/preferencesStore";
import { toast } from "@/hooks/use-toast";

const LANG_OPTS = [
  { code: "en-US", label: "English - United States", flag: "US" },
  { code: "fr-FR", label: "French - France", flag: "FR" },
  { code: "es-MX", label: "Spanish - Mexico", flag: "MX" },
  { code: "de-DE", label: "German - Germany", flag: "DE" },
  { code: "en-AU", label: "English - Australia", flag: "AU" },
  { code: "en-CA", label: "English - Canada", flag: "CA" },
  { code: "en-IN", label: "English - India", flag: "IN" },
  { code: "en-IE", label: "English - Ireland", flag: "IE" },
  { code: "en-SG", label: "English - Singapore", flag: "SG" },
  { code: "en-ZA", label: "English - South Africa", flag: "ZA" },
];

const LANDING_OPTS = [
  { value: "home", label: "Home Dashboard" },
  { value: "global-search", label: "Global Search" },
  { value: "shop", label: "Shop for Devices" },
  { value: "tickets", label: "ServiceDesk - Ticket List" },
  { value: "dashboard", label: "Main Dashboard" },
];

const STYLE_OPTS = [
  { value: "simple-nav", label: "Simple Navigation" },
  { value: "snapshot", label: "Snapshot View" },
  { value: "compact", label: "Compact View" },
  { value: "executive", label: "Executive View" },
];

const SIZE_OPTS = [10, 15, 20, 25, 50, 100];

const THEME_OPTS = [
  { value: "light", label: "Light Mode" },
  { value: "dark", label: "Dark Mode" },
  { value: "comfort", label: "Eye Comfort" },
];

function SettingsCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border/40 bg-muted/30 px-4 py-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function EnterpriseSettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { language, setLanguage } = useI18n();
  const prefs = usePreferences();
  const { theme, setTheme } = useTheme();
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences are active now.",
    });
    setShowSaved(true);
    window.setTimeout(() => setShowSaved(false), 1800);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(100%-1rem,980px)] max-w-[980px] overflow-hidden rounded-3xl border border-border/60 p-0 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)]">
        <DialogHeader className="border-b border-border/60 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Preferences & Settings
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Customize your workspace experience
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[min(72vh,760px)] bg-slate-50/70">
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <SettingsCard icon={Globe} title="ACCOUNT">
                <SettingRow
                  label="Display Language"
                  description="Changes apply instantly across all UI"
                >
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-9 w-56 bg-background text-sm border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANG_OPTS.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.flag} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
              </SettingsCard>

              <SettingsCard icon={Palette} title="DISPLAY">
                <SettingRow label="Theme">
                  <Select
                    value={theme}
                    onValueChange={(value) => setTheme(value as any)}
                  >
                    <SelectTrigger className="h-9 w-40 bg-background text-sm border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_OPTS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow
                  label="Compact Mode"
                  description="Reduce spacing and density"
                >
                  <Switch
                    checked={prefs.compactMode}
                    onCheckedChange={prefs.setCompactMode}
                  />
                </SettingRow>
              </SettingsCard>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <SettingsCard icon={LayoutGrid} title="NAVIGATION">
                <SettingRow
                  label="Default Landing Page"
                  description="Where you go after login"
                >
                  <Select
                    value={prefs.landingPage}
                    onValueChange={(value) =>
                      prefs.setLandingPage(value as any)
                    }
                  >
                    <SelectTrigger className="h-9 w-48 bg-background text-sm border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANDING_OPTS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow
                  label="Home Page Style"
                  description="Choose your dashboard layout"
                >
                  <Select
                    value={prefs.homeStyle}
                    onValueChange={(value) => prefs.setHomeStyle(value as any)}
                  >
                    <SelectTrigger className="h-9 w-44 bg-background text-sm border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_OPTS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow
                  label="Report Page Size"
                  description="Rows per page in all tables"
                >
                  <Select
                    value={String(prefs.reportPageSize)}
                    onValueChange={(value) =>
                      prefs.setReportPageSize(parseInt(value, 10))
                    }
                  >
                    <SelectTrigger className="h-9 w-24 bg-background text-sm border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_OPTS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size} rows
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>
              </SettingsCard>

              <SettingsCard icon={Eye} title="ACCESSIBILITY">
                <SettingRow
                  label="Reduce Motion"
                  description="Disable animations"
                >
                  <Switch
                    checked={prefs.reduceMotion}
                    onCheckedChange={prefs.setReduceMotion}
                  />
                </SettingRow>
                <SettingRow
                  label="High Contrast"
                  description="Increase contrast for readability"
                >
                  <Switch
                    checked={prefs.highContrast}
                    onCheckedChange={prefs.setHighContrast}
                  />
                </SettingRow>
              </SettingsCard>

              <SettingsCard icon={Bell} title="NOTIFICATIONS">
                <SettingRow
                  label="Push Notifications"
                  description="Receive in-app alerts"
                >
                  <Switch
                    checked={prefs.notificationsEnabled}
                    onCheckedChange={prefs.setNotificationsEnabled}
                  />
                </SettingRow>
                <SettingRow
                  label="Daily Email Digest"
                  description="Summary of daily activity"
                >
                  <Switch
                    checked={prefs.emailDigest}
                    onCheckedChange={prefs.setEmailDigest}
                  />
                </SettingRow>
                <SettingRow
                  label="Sound Effects"
                  description="Play sounds for actions"
                >
                  <Switch
                    checked={prefs.soundEffects}
                    onCheckedChange={prefs.setSoundEffects}
                  />
                </SettingRow>
              </SettingsCard>
            </div>

            <div className="rounded-lg border border-border/40 bg-white p-3 shadow-sm">
              <p className="text-center text-xs text-muted-foreground">
                All preferences are saved automatically and persist across
                sessions.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 border-t border-border/60 bg-white/95 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Changes apply immediately across all pages
            </p>
            <Button onClick={handleSave} className="gap-2 shadow-sm">
              {showSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
