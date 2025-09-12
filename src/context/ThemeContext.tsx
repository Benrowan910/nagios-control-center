import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const ThemeContext = createContext<any>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState({
    primary: "59 130 246",   // default: blue-500
    tertiary: "16 185 129", // default: emerald-500
  });

  // Push CSS vars to document root
  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", theme.primary);
    document.documentElement.style.setProperty("--color-tertiary", theme.tertiary);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}