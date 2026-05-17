import { useState, useCallback } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Building2,
  Globe,
  LayoutDashboard,
  Monitor,
  FileText,
  Palette,
  Bell,
  Eye,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Keyboard,
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";

interface EnterprisePrefs {
  locale: string;
  landingPage: string;
  homePageStyle: string;
  reportPageSize: number;
  theme: ThemeMode;
  compactMode: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  notificationsEnabled: boolean;
  emailDigest: boolean;
  soundEffects: boolean;
}

const DEFAULT_PREFS: EnterprisePrefs = {
  locale: "en-US",
  landingPage: "home",
  homePageStyle: "snapshot",
  reportPageSize: 25,
  theme: "light",
  compactMode: false,
  reduceMotion: false,
  highContrast: false,
  notificationsEnabled: true,
  emailDigest: true,
  soundEffects: false,
};

const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-IN", label: "English (India)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "es-ES", label: "Spanish" },
  { value: "pt-BR", label: "Portuguese" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
];

const LANDING_PAGES = [
  { value: "home", label: "Home Dashboard" },
  { value: "shop", label: "Shop / Catalogue" },
  { value: "global-search", label: "Global Search" },
  { value: "orders", label: "Orders" },
  { value: "invoices", label: "Invoices" },
  { value: "tickets", label: "Ticket Tracking" },
  { value: "dashboard", label: "Main Dashboard" },
];

const HOME_STYLES = [
  { value: "snapshot", label: "Snapshot View" },
  { value: "simple-nav", label: "Simple Navigation" },
  { value: "compact", label: "Compact View" },
  { value: "executive", label: "Executive View" },
];

const REPORT_SIZES = [10, 15, 20, 25, 50, 100];

const THEMES_OPT: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light Mode" },
  { value: "dark", label: "Dark Mode" },
  { value: "comfort", label: "Eye Comfort Mode" },
];

const STORAGE_KEY = "enterprise_prefs";

function loadPrefs(): EnterprisePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}

function savePrefs(prefs: EnterprisePrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

function SectionBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3">
        {children}
      </div>
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
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function EnterpriseProfilePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const { theme: themeCtx, setTheme } = useTheme();
  const { setLanguage } = useI18n();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<EnterprisePrefs>(() => {
    const loaded = loadPrefs();
    return { ...loaded, theme: themeCtx };
  });

  const updatePref = useCallback(
    <K extends keyof EnterprisePrefs>(key: K, value: EnterprisePrefs[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        savePrefs(next);
        if (key === "theme") setTheme(value as ThemeMode);
        if (key === "locale") setLanguage(value as string);
        return next;
      });
    },
    [setTheme],
  );

  const handleLogout = () => {
    logout();
    onClose();
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} direction="right">
      <DrawerContent className="inset-y-0 right-0 top-0 max-w-md w-full border-l rounded-none">
        <DrawerHeader className="border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DrawerTitle className="text-base font-bold">
                  {user?.name || "User Profile"}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground">
                  {user?.email || "No email"}
                </DrawerDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <ScrollArea className="h-[calc(100vh-88px)]">
          <div className="space-y-5 px-6 py-5">

            {/* Account */}
            <SectionBlock icon={User} title="Account">
              <Button variant="ghost" className="w-full justify-between text-sm" onClick={() => { navigate("/users/me"); onClose(); }}>
                <span className="flex items-center gap-2"><User className="h-4 w-4" /> My Profile</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" className="w-full justify-between text-sm" onClick={() => { navigate("/organizations"); onClose(); }}>
                <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Organizations</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" className="w-full justify-between text-sm" onClick={() => { navigate("/configuration"); onClose(); }}>
                <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Account Settings</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </SectionBlock>

            <Separator />

            {/* Language */}
            <SectionBlock icon={Globe} title="Language & Locale">
              <SettingRow label="Display Language" description="Set your preferred language">
                <Select value={prefs.locale} onValueChange={(v) => updatePref("locale", v)}>
                  <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </SettingRow>
            </SectionBlock>

            <Separator />

            {/* Navigation */}
            <SectionBlock icon={Monitor} title="Navigation">
              <SettingRow label="Default Landing Page" description="Where you go after login">
                <Select value={prefs.landingPage} onValueChange={(v) => updatePref("landingPage", v)}>
                  <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANDING_PAGES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Home Page Style" description="Choose your dashboard view">
                <Select value={prefs.homePageStyle} onValueChange={(v) => updatePref("homePageStyle", v)}>
                  <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOME_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Report Page Size" description="Rows per page in tables">
                <Select value={String(prefs.reportPageSize)} onValueChange={(v) => updatePref("reportPageSize", parseInt(v, 10))}>
                  <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </SettingRow>
            </SectionBlock>

            <Separator />

            {/* Appearance */}
            <SectionBlock icon={Palette} title="Appearance">
              <SettingRow label="Theme">
                <Select value={prefs.theme} onValueChange={(v) => updatePref("theme", v as ThemeMode)}>
                  <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THEMES_OPT.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Compact Mode" description="Reduce spacing and density">
                <Switch checked={prefs.compactMode} onCheckedChange={(v) => updatePref("compactMode", v)} />
              </SettingRow>
            </SectionBlock>

            <Separator />

            {/* Accessibility */}
            <SectionBlock icon={Eye} title="Accessibility">
              <SettingRow label="Reduce Motion" description="Disable animations">
                <Switch checked={prefs.reduceMotion} onCheckedChange={(v) => updatePref("reduceMotion", v)} />
              </SettingRow>
              <SettingRow label="High Contrast" description="Increase contrast for readability">
                <Switch checked={prefs.highContrast} onCheckedChange={(v) => updatePref("highContrast", v)} />
              </SettingRow>
            </SectionBlock>

            <Separator />

            {/* Notifications */}
            <SectionBlock icon={Bell} title="Notifications">
              <SettingRow label="Push Notifications" description="Receive in-app alerts">
                <Switch checked={prefs.notificationsEnabled} onCheckedChange={(v) => updatePref("notificationsEnabled", v)} />
              </SettingRow>
              <SettingRow label="Daily Email Digest" description="Summary of daily activity">
                <Switch checked={prefs.emailDigest} onCheckedChange={(v) => updatePref("emailDigest", v)} />
              </SettingRow>
              <SettingRow label="Sound Effects" description="Play sounds for actions">
                <Switch checked={prefs.soundEffects} onCheckedChange={(v) => updatePref("soundEffects", v)} />
              </SettingRow>
            </SectionBlock>

            <Separator />

            {/* Security */}
            <SectionBlock icon={Shield} title="Security">
              <Button variant="outline" className="w-full justify-start text-sm gap-2" onClick={() => { navigate("/audit-log"); onClose(); }}>
                <Shield className="h-4 w-4" /> Security & Password
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm gap-2" onClick={() => { navigate("/audit-log"); onClose(); }}>
                <Keyboard className="h-4 w-4" /> Active Sessions
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            </SectionBlock>

            <Separator />

            {/* Logout */}
            <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
