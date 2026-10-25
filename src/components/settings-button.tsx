import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ModelControls } from '@/components/model-controls';
import { QuestionEditor } from '@/components/question-editor';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, BrandColor, Spacing } from '@/constants/theme';
import { useSettings } from '@/lib/settings';

/** A round button in the bottom right corner that opens the Settings page. */
export function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityLabel="Settings">
        <SymbolView name={{ ios: 'gearshape.fill', android: 'settings' }} tintColor="#ffffff" size={28} />
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SettingsPage onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

/** Defaults that are ready when the app opens. Every change is saved right away. */
function SettingsPage({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Screen title="Settings">
        <ThemedText themeColor="textSecondary">
          Load .gguf model file to run 100% on the device, will be automatically loaded the next time you open it, and
          no data leaks to the internet.
        </ThemedText>
        <ThemedText type="smallBold">Default model</ThemedText>
        <View style={styles.row}>
          <ThemedText style={styles.rowText}>Load it when the app opens</ThemedText>
          <Switch
            value={settings.autoLoad}
            onValueChange={(autoLoad) => updateSettings({ autoLoad })}
            trackColor={{ true: BrandColor }}
          />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          The default is the last model and mmproj you loaded: {settings.modelName ?? 'none yet'}
          {settings.mmprojName ? ` + ${settings.mmprojName}` : ''}
        </ThemedText>
        <ModelControls />

        <ThemedText type="smallBold">SystemOne defaults</ThemedText>
        <TextField
          placeholder="Prompt: describe the situation..."
          value={settings.prompt}
          onChangeText={(prompt) => updateSettings({ prompt })}
        />
        <QuestionEditor questions={settings.questions} onChange={(questions) => updateSettings({ questions })} />
      </Screen>
      <View style={[styles.done, { bottom: insets.bottom + Spacing.three }]}>
        <Button title="Done" onPress={onClose} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: Spacing.three,
    bottom: BottomTabInset + Spacing.three,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColor,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    zIndex: 400,
  },
  pressed: {
    opacity: 0.7,
  },
  done: {
    position: 'absolute',
    alignSelf: 'center',
    width: 200,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
});
