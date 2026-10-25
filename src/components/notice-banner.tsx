import { ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColor, Spacing } from '@/constants/theme';
import { useModel } from '@/lib/model';

/** Shows what the app is doing (e.g. auto-loading the model) at the top of every screen. */
export function NoticeBanner() {
  const { notice } = useModel();
  const insets = useSafeAreaInsets();
  if (!notice) return null;

  return (
    <ThemedView
      type="backgroundSelected"
      pointerEvents="none"
      style={[styles.banner, { top: insets.top + Spacing.two }]}>
      {notice.busy && <ActivityIndicator color={BrandColor} />}
      <ThemedText type="small" style={styles.text}>
        {notice.text}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: BrandColor,
    zIndex: 500,
  },
  text: {
    flex: 1,
  },
});
