import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

export type HomeStyle = 'snapshot' | 'simple-nav' | 'compact' | 'executive';
export type LandingPage = 
  | 'home' 
  | 'shop' 
  | 'global-search' 
  | 'orders' 
  | 'invoices' 
  | 'tickets' 
  | 'dashboard'
  | 'help'
  | 'employees'
  | 'subscribers'
  | 'subscriptions'
  | 'wireless-overview'
  | 'fulfillment'
  | 'group-orders'
  | 'telecom-bill'
  | 'mdm-overview';

interface EnterprisePreferences {
  landingPage: LandingPage;
  homeStyle: HomeStyle;
  reportPageSize: number;
  compactMode: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  notificationsEnabled: boolean;
  emailDigest: boolean;
  soundEffects: boolean;
}

interface PrefsContextValue extends EnterprisePreferences {
  setLandingPage: (page: LandingPage) => void;
  setHomeStyle: (style: HomeStyle) => void;
  setReportPageSize: (size: number) => void;
  setCompactMode: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setEmailDigest: (v: boolean) => void;
  setSoundEffects: (v: boolean) => void;
  isLoaded: boolean;
}

const DEFAULTS: EnterprisePreferences = {
  landingPage: 'home',
  homeStyle: 'snapshot',
  reportPageSize: 25,
  compactMode: false,
  reduceMotion: false,
  highContrast: false,
  notificationsEnabled: true,
  emailDigest: true,
  soundEffects: false,
};

const STORAGE_KEY = 'enterprise_prefs';

function loadPrefs(): EnterprisePreferences & { isLoaded: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw), isLoaded: true };
  } catch {}
  return { ...DEFAULTS, isLoaded: true };
}

const PrefsContext = createContext<PrefsContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(loadPrefs, []);
  const [prefs, setPrefs] = useState<EnterprisePreferences>(() => ({
    landingPage: initial.landingPage,
    homeStyle: initial.homeStyle,
    reportPageSize: initial.reportPageSize,
    compactMode: initial.compactMode,
    reduceMotion: initial.reduceMotion,
    highContrast: initial.highContrast,
    notificationsEnabled: initial.notificationsEnabled,
    emailDigest: initial.emailDigest,
    soundEffects: initial.soundEffects,
  }));

  const persist = useCallback((updated: EnterprisePreferences) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  const setLandingPage = useCallback((v: LandingPage) => {
    setPrefs(p => { const n = { ...p, landingPage: v }; persist(n); return n; });
  }, [persist]);
  const setHomeStyle = useCallback((v: HomeStyle) => {
    setPrefs(p => { const n = { ...p, homeStyle: v }; persist(n); return n; });
  }, [persist]);
  const setReportPageSize = useCallback((v: number) => {
    setPrefs(p => { const n = { ...p, reportPageSize: v }; persist(n); return n; });
  }, [persist]);
  const setCompactMode = useCallback((v: boolean) => {
    setPrefs(p => { const n = { ...p, compactMode: v }; persist(n); return n; });
  }, [persist]);
  const setReduceMotion = useCallback((v: boolean) => {
    setPrefs(p => { const n = { ...p, reduceMotion: v }; persist(n); return n; });
  }, [persist]);
  const setHighContrast = useCallback((v: boolean) => {
    setPrefs(p => { const n = { ...p, highContrast: v }; persist(n); return n; });
  }, [persist]);
  const setNotificationsEnabled = useCallback((v: boolean) => {
    setPrefs(p => { const n = { ...p, notificationsEnabled: v }; persist(n); return n; });
  }, [persist]);
  const setEmailDigest = useCallback((v: boolean) => {
    setPrefs(p => { const n = { ...p, emailDigest: v }; persist(n); return n; });
  }, [persist]);
  const setSoundEffects = useCallback((v: boolean) => {
    setPrefs(p => { const n = { ...p, soundEffects: v }; persist(n); return n; });
  }, [persist]);

  const value = useMemo(() => ({
    ...prefs,
    setLandingPage, setHomeStyle, setReportPageSize,
    setCompactMode, setReduceMotion, setHighContrast,
    setNotificationsEnabled, setEmailDigest, setSoundEffects,
    isLoaded: initial.isLoaded,
  }), [prefs, initial.isLoaded]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
