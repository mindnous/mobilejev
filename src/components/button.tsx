import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BrandColor, Spacing } from '@/constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => Promise<void> | void;
  disabled?: boolean;
};

/** A button that shows a spinner while onPress runs, and an error alert if it throws. */
export function Button({ title, onPress, disabled }: ButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    setBusy(true);
    try {
      await onPress();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || busy}
      style={({ pressed }) => [styles.button, (pressed || disabled || busy) && styles.dimmed]}>
      {busy ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.text}>{title}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: BrandColor,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  dimmed: {
    opacity: 0.6,
  },
  text: {
    color: '#ffffff',
    fontWeight: 700,
  },
});
