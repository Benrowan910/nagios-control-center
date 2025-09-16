import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Theme {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
  cardBackground: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default theme values
const defaultTheme: Theme = {
  primary: "59 130 246",   // blue-500
  secondary: "139 92 246", // purple-500
  tertiary: "16 185 129",  // emerald-500
  background: "10 15 28",  // dark blue
  cardBackground: "20 30 46", // slightly lighter dark blue
  text: "248 250 252",     // almost white
  border: "30 41 59",      // blue-gray border
  success: "34 197 94",    // green-500
  warning: "234 179 8",    // yellow-500
  error: "239 68 68",      // red-500
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load theme from localStorage if available
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme ? JSON.parse(savedTheme) : defaultTheme;
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  // Push CSS vars to document root
  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", theme.primary);
    document.documentElement.style.setProperty("--color-secondary", theme.secondary);
    document.documentElement.style.setProperty("--color-tertiary", theme.tertiary);
    document.documentElement.style.setProperty("--color-background", theme.background);
    document.documentElement.style.setProperty("--color-card-background", theme.cardBackground);
    document.documentElement.style.setProperty("--color-text", theme.text);
    document.documentElement.style.setProperty("--color-border", theme.border);
    document.documentElement.style.setProperty("--color-success", theme.success);
    document.documentElement.style.setProperty("--color-warning", theme.warning);
    document.documentElement.style.setProperty("--color-error", theme.error);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}