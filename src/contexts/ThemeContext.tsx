import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeMode = "light" | "dark" | "comfort";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("app-theme");
    return (stored as ThemeMode) || "light";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    const root = document.documentElement;
    root.classList.remove("dark", "comfort");
    if (theme === "dark") root.classList.add("dark");
    if (theme === "comfort") root.classList.add("comfort");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
