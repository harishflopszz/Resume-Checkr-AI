import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface CustomThemeProviderProps {
  className?: string;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  forcedTheme?: string;
  children: React.ReactNode;
}

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}
