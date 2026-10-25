import { ModelControls } from '@/components/model-controls';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

export default function ModelScreen() {
  return (
    <Screen title="Model">
      <ThemedText themeColor="textSecondary">
        Pick a .gguf model file from your phone. It runs fully on this device, and is loaded again
        automatically the next time the app opens (see Settings, bottom right).
      </ThemedText>
      <ModelControls />
    </Screen>
  );
}
