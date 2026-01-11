import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useTheme } from './ThemeContext';
import { AppTheme } from './theme';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useStyles<T extends NamedStyles<T>>(
  styleFactory: (theme: AppTheme) => T
): T {
  const { theme } = useTheme();
  return StyleSheet.create(styleFactory(theme));
} 