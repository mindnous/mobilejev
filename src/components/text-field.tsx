import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A themed multi-line text box. Pass `mono` for code/JSON. */
export function TextField({ mono, style, ...rest }: TextInputProps & { mono?: boolean }) {
  const theme = useTheme();
  return (
    <TextInput
      multiline
      placeholderTextColor={theme.textSecondary}
      autoCapitalize="none"
      autoCorrect={!mono}
      style={[
        styles.input,
        { color: theme.text, backgroundColor: theme.backgroundElement },
        mono && { fontFamily: Fonts.mono, fontSize: 12 },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
