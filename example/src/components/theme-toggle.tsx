import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorSchemeController } from '@/hooks/use-color-scheme';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorSchemeController();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.row}>
      <ThemedText type="small">Dark mode</ThemedText>
      <Switch
        accessibilityLabel="Dark mode"
        onValueChange={(enabled) => setColorScheme(enabled ? 'dark' : 'light')}
        value={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
