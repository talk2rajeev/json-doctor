import React, { createContext, useContext, useState, type ReactNode } from 'react';

type MonacoTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

interface ThemeContextType {
  theme: MonacoTheme;
  setTheme: (theme: MonacoTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<MonacoTheme>('vs');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const themeOptions: MonacoTheme[] = ['vs', 'vs-dark', 'hc-black', 'hc-light'];
