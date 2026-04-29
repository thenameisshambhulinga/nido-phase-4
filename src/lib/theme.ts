type HslTriplet = {
  h: number;
  s: number;
  l: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const hexToHsl = (hex: string): string | null => {
  const triplet = hexToHslTriplet(hex);
  if (!triplet) return null;
  return `${triplet.h} ${triplet.s}% ${triplet.l}%`;
};

export const hexToHslTriplet = (hex: string): HslTriplet | null => {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const format = (value: HslTriplet) => `${value.h} ${value.s}% ${value.l}%`;

export const buildBrandThemeVars = (hex: string) => {
  const base = hexToHslTriplet(hex);
  if (!base) return null;

  const subduedSat = clamp(base.s - 20, 18, 58);

  return {
    "--primary": format({
      h: base.h,
      s: clamp(base.s, 42, 78),
      l: clamp(base.l, 34, 50),
    }),
    "--ring": format({
      h: base.h,
      s: clamp(base.s, 42, 78),
      l: clamp(base.l + 4, 38, 56),
    }),
    "--sidebar-background": format({
      h: base.h,
      s: subduedSat,
      l: clamp(base.l - 18, 14, 22),
    }),
    "--sidebar-foreground": "0 0% 98%",
    "--sidebar-primary": format({
      h: base.h,
      s: clamp(base.s + 6, 44, 88),
      l: clamp(base.l + 16, 56, 68),
    }),
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": format({
      h: base.h,
      s: subduedSat,
      l: clamp(base.l - 10, 20, 30),
    }),
    "--sidebar-accent-foreground": "0 0% 98%",
    "--sidebar-border": format({
      h: base.h,
      s: clamp(subduedSat - 2, 14, 50),
      l: clamp(base.l - 12, 18, 28),
    }),
    "--sidebar-ring": format({
      h: base.h,
      s: clamp(base.s + 4, 44, 82),
      l: clamp(base.l + 12, 48, 62),
    }),
    "--header-background": format({
      h: base.h,
      s: clamp(base.s - 8, 24, 72),
      l: clamp(base.l - 8, 22, 34),
    }),
    "--header-foreground": "0 0% 100%",
    "--header-border": format({
      h: base.h,
      s: clamp(subduedSat, 18, 56),
      l: clamp(base.l - 2, 28, 40),
    }),
    "--header-muted": "0 0% 90%",
  };
};

export const applyBrandTheme = (hex?: string) => {
  const root = document.documentElement;
  const vars = hex ? buildBrandThemeVars(hex) : null;

  const brandVarKeys = [
    "--primary",
    "--ring",
    "--sidebar-background",
    "--sidebar-foreground",
    "--sidebar-primary",
    "--sidebar-primary-foreground",
    "--sidebar-accent",
    "--sidebar-accent-foreground",
    "--sidebar-border",
    "--sidebar-ring",
    "--header-background",
    "--header-foreground",
    "--header-border",
    "--header-muted",
  ];

  if (!vars) {
    brandVarKeys.forEach((key) => root.style.removeProperty(key));
    return;
  }

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};
