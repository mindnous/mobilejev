import { useRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = {
  title: string;
  children: ReactNode;
  scrollToEnd?: boolean; // keep the newest content in view (used by the chat)
};

/** Page wrapper: safe area, title, and a scrollable column that stays above the keyboard. */
export function Screen({ title, children, scrollToEnd }: ScreenProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six + Spacing.four, // room for the Settings button
  },
});
