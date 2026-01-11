import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, AppTheme } from './theme';

type ThemeContextType = {
  theme: AppTheme;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState(colorScheme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: colorScheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
} 