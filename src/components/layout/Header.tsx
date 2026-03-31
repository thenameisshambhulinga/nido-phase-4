import { useCallback, useMemo } from "react";
import {
  Search,
  Bell,
  Settings,
  ArrowLeft,
  Sun,
  Moon,
  Eye,
  Mail,
  CheckCheck,
  Trash2,
  Building2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HeaderProps {
  title?: string;
}

const THEMES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light Mode", icon: Sun },
  { value: "dark", label: "Dark Mode", icon: Moon },
  { value: "comfort", label: "Eye Comfort", icon: Eye },
];

export default function Header({ title }: HeaderProps) {
  const { clients } = useData();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications();

  const activeOrganizations = useMemo(
    () => clients.filter((client) => client.status === "active"),
    [clients],
  );

  const now = useMemo(() => Date.now(), []);
  const formatTime = useCallback(
    (timestamp: string) => {
      const diff = now - new Date(timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    },
    [now],
  );

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "overdue_mail":
        return <Mail className="h-4 w-4 text-destructive" />;
      case "reminder":
        return <Bell className="h-4 w-4 text-warning" />;
      case "alert":
        return <Bell className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 transition-transform hover:scale-105 active:scale-95"
          onClick={() => navigate(-1)}
          title="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="max-w-[150px] truncate text-base font-display font-semibold text-foreground sm:max-w-none sm:text-lg">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {!isMobile && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-9 w-48 border-0 bg-muted/50 pl-9 text-sm transition-all focus:ring-2 focus:ring-primary/20 lg:w-64"
            />
          </div>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 transition-transform hover:scale-105 active:scale-95"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-scale-in">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[calc(100vw-2rem)] p-0 sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 px-1.5 text-[10px]"
                  >
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="mr-1 h-3 w-3" /> Read all
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={clearAll}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No notifications
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={`group flex cursor-pointer gap-3 px-4 py-3 transition-all duration-200 hover:bg-muted/50 ${!notification.read ? "bg-primary/5" : ""}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getNotifIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-tight ${!notification.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                          >
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              clearNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        {notification.draftedMail && (
                          <div className="mt-2 rounded-md border border-border bg-muted/60 p-2">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Auto-Drafted Mail
                            </p>
                            <p className="text-xs font-medium text-foreground">
                              {notification.draftedMail.subject}
                            </p>
                            <p className="mt-1 line-clamp-3 whitespace-pre-line text-[11px] text-muted-foreground">
                              {notification.draftedMail.body}
                            </p>
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 transition-transform hover:scale-105 active:scale-95"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Appearance
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {THEMES.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={
                  theme === option.value ? "bg-accent font-semibold" : ""
                }
              >
                <option.icon className="mr-2 h-4 w-4" /> {option.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/archive")}>
              <Trash2 className="mr-2 h-4 w-4" /> Archived Records
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={
            location.pathname.startsWith("/organizations")
              ? "secondary"
              : "ghost"
          }
          size="sm"
          className="gap-2 transition-transform hover:scale-105 active:scale-95"
          onClick={() => navigate("/organizations")}
        >
          <Building2 className="h-4 w-4" />
          {!isMobile && (
            <span className="text-xs font-medium">Organizations</span>
          )}
          {!isMobile && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {activeOrganizations.length}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
