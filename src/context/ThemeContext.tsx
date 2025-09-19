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
  setTheme: React.Dispatch<React.SetStateAction<Theme>>; // accepts object or updater fn
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

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}


export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("app-theme");
    return savedTheme ? JSON.parse(savedTheme) : defaultTheme;
  });

  

  const setTheme: React.Dispatch<React.SetStateAction<Theme>> = (newTheme) => {
    setThemeState((prev) => {
      const updatedTheme =
        typeof newTheme === "function" ? newTheme(prev) : newTheme;
      localStorage.setItem("app-theme", JSON.stringify(updatedTheme));
      return updatedTheme;
    });
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  useEffect(() => {
    for (const [key, value] of Object.entries(theme)) {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    }
  }, [theme]);

  

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

