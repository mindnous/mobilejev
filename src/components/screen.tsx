import { useRef, type ReactNode } from 'react';
import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = {
  title: string;
  children: ReactNode;
  scrollToEnd?: boolean; // keep the newest content in view (used by the chat)
};

/** Page wrapper: safe area, app icon at the top center, title, and a scrollable column that stays above the keyboard. */
export function Screen({ title, children, scrollToEnd }: ScreenProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Image
          source={require('@/assets/images/android-icon-monochrome.png')}
          style={[styles.logo, { tintColor: theme.text }]}
        />
        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollToEnd && scrollRef.current?.scrollToEnd()}>
            <ThemedText type="subtitle">{title}</ThemedText>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  flex: {
    flex: 1,
  },
  logo: {
    // The icon is padded: its mark is 58% of the image, so this shows a 30 px mark in a 30 px tall row.
    alignSelf: 'center',
    width: 52,
    height: 52,
    marginVertical: -11,
  },
  content: {
    flexGrow: 1, // lets a page fill the free space (the Live camera)
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.six + Spacing.four, // room for the Settings button (the tab bar is outside the page)
  },
});
