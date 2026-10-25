import { Button } from '@/components/button';
import { Segmented } from '@/components/segmented';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { MAX_IMAGE_TOKENS, useModel } from '@/lib/model';
import { useSettings } from '@/lib/settings';

/** Model, GPU, and mmproj choices. Shown in Settings; the choices are saved. */
export function ModelControls() {
  const { modelName, mmprojName, pickModel, pickMmproj } = useModel();
  const { settings, updateSettings } = useSettings();

  return (
    <>
      <ThemedText>Model: {modelName ?? 'none loaded'}</ThemedText>
      <ThemedText type="smallBold">Run the model on</ThemedText>
      <Segmented
        options={[
          { value: 'cpu', label: 'CPU' },
          { value: 'gpu', label: 'GPU (faster)' },
        ]}
        value={settings.useGpu ? 'gpu' : 'cpu'}
        onChange={(device) => updateSettings({ useGpu: device === 'gpu' })}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Used when a model is loaded. If answers look wrong on GPU, switch to CPU and upload the model again.
      </ThemedText>
      <Button title={modelName ? 'Change model' : 'Upload GGUF model'} onPress={pickModel} />

      <ThemedText themeColor="textSecondary">
        Optional: to send images, also pick the model&apos;s matching mmproj .gguf file.
      </ThemedText>
      <ThemedText>Vision (mmproj): {mmprojName ?? 'none'}</ThemedText>
      <ThemedText type="smallBold">Max image tokens (1 to {MAX_IMAGE_TOKENS})</ThemedText>
      <TextField
        multiline={false}
        keyboardType="number-pad"
        value={settings.imageMaxTokens}
        onChangeText={(imageMaxTokens) => updateSettings({ imageMaxTokens })}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Fewer tokens is faster but sees less detail. Used when the mmproj is uploaded, so upload it again after
        changing this.
      </ThemedText>
      <Button title="Upload mmproj (for images)" onPress={pickMmproj} disabled={!modelName} />
    </>
  );
}
