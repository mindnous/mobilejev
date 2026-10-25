import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AnswerList } from '@/components/answer-list';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { systemOne, validateSystemOneRequest, type SystemOneResponse } from '@/lib/llm';
import { requireModel, useModel } from '@/lib/model';
import { buildRequest, useSettings } from '@/lib/settings';

/** Asks the saved SystemOne questions about the camera image, again and again, showing each new answer. */
export default function LiveScreen() {
  const { llama, modelName, mmprojName } = useModel();
  const { settings } = useSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const keepRunning = useRef(false);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<SystemOneResponse | null>(null);
  const [frameMs, setFrameMs] = useState<number | null>(null);

  // Stop when leaving this tab.
  useFocusEffect(
    useCallback(() => () => {
      keepRunning.current = false;
    }, [])
  );

  async function start() {
    const model = requireModel(llama);
    if (!mmprojName) throw new Error('Upload an mmproj in Settings to use the camera.');
    const request = validateSystemOneRequest(buildRequest(settings));

    keepRunning.current = true;
    setRunning(true);
    try {
      while (keepRunning.current && camera.current) {
        const started = Date.now();
        const photo = await camera.current.takePictureAsync({ quality: 0.5, shutterSound: false });
        try {
          setResponse(await systemOne(model, modelName ?? '', { ...request, images: [photo.uri] }));
        } finally {
          new File(photo.uri).delete(); // don't fill the phone with frames
        }
        setFrameMs(Date.now() - started);
      }
    } finally {
      keepRunning.current = false;
      setRunning(false);
    }
  }

  if (!permission?.granted) {
    return (
      <Screen title="Live">
        <ThemedText themeColor="textSecondary">The Live page needs the camera.</ThemedText>
        <Button
          title="Allow camera"
          onPress={async () => {
            await requestPermission();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Live">
      <ThemedText themeColor="textSecondary">
        Asks the prompt and questions saved in Settings about the camera image, frame after frame.
      </ThemedText>
      <CameraView ref={camera} style={styles.camera} animateShutter={false} />
      {running ? (
        <Button
          title="Stop"
          onPress={() => {
            keepRunning.current = false;
          }}
        />
      ) : (
        <Button title="Start" onPress={start} />
      )}
      {frameMs !== null && (
        <ThemedText type="small" themeColor="textSecondary">
          {frameMs} ms per frame
        </ThemedText>
      )}
      {response && <AnswerList questions={settings.questions} response={response} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
});
