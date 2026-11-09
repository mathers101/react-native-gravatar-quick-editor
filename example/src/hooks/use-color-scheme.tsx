import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Appearance,
  useColorScheme as useSystemColorScheme,
  type ColorSchemeName,
} from 'react-native';

type ColorSchemeContextValue = {
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [override, setOverride] = useState<ColorSchemeName | null>(null);
  const colorScheme: ColorSchemeName =
    override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const setColorScheme = useCallback((scheme: ColorSchemeName) => {
    setOverride(scheme);
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(scheme);
    }
  }, []);

  const value = useMemo(
    () => ({ colorScheme, setColorScheme }),
    [colorScheme, setColorScheme]
  );

  return (
    <ColorSchemeContext.Provider value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme(): ColorSchemeName | null {
  const context = useContext(ColorSchemeContext);
  const systemScheme = useSystemColorScheme();
  return context?.colorScheme ?? systemScheme;
}

export function useColorSchemeController() {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error(
      'useColorSchemeController must be used within ColorSchemeProvider'
    );
  }
  return context;
}
