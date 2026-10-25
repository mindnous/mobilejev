import { useState } from 'react';

import { AnswerList } from '@/components/answer-list';
import { Button } from '@/components/button';
import { ImageArea } from '@/components/image-area';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { parseSystemOneRequest, systemOne, validateSystemOneRequest, type SystemOneResponse } from '@/lib/llm';
import { requireModel, useModel } from '@/lib/model';
import { buildRequest, useSettings } from '@/lib/settings';

export default function SystemOneScreen() {
  const { settings } = useSettings();
  // Start again from the saved prompt and questions whenever they are changed in Settings.
  return <SystemOneForm key={JSON.stringify([settings.prompt, settings.questions])} />;
}

function SystemOneForm() {
  const { llama, modelName } = useModel();
  const { settings } = useSettings();
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [imageUri, setImageUri] = useState<string>();
  const [response, setResponse] = useState<SystemOneResponse | null>(null);
  // Advanced mode starts as the same request as Simple mode.
  const [requestJson, setRequestJson] = useState(() => JSON.stringify(buildRequest(settings), null, 2));

  async function run() {
    const model = requireModel(llama);
    const request =
      mode === 'simple' ? validateSystemOneRequest(buildRequest(settings)) : parseSystemOneRequest(requestJson);
    // The uploaded image is added to any "images" already in the JSON.
    if (imageUri) request.images = [...(request.images ?? []), imageUri];
    setResponse(null);
    setResponse(await systemOne(model, modelName ?? '', request));
  }

  return (
    <Screen title="SystemOne">
      <Segmented
        options={[
          { value: 'simple', label: 'Simple' },
          { value: 'advanced', label: 'Advanced' },
        ]}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setResponse(null);
        }}
      />

      {mode === 'simple' ? (
        <>
          <ThemedText themeColor="textSecondary">
            Uses the prompt and questions saved in Settings (bottom right).
          </ThemedText>
          <ImageArea imageUri={imageUri} onChange={setImageUri} />
          <Button title="Run" onPress={run} />
          {response && <AnswerList questions={settings.questions} response={response} />}
        </>
      ) : (
        <>
          <ThemedText themeColor="textSecondary">
            Raw request JSON: &quot;choice&quot; picks one of the criteria, &quot;noul&quot; gives the probability of
            yes. The image below is sent with it (no need to put it in the JSON).
          </ThemedText>
          <TextField mono value={requestJson} onChangeText={setRequestJson} />
          <ImageArea imageUri={imageUri} onChange={setImageUri} />
          <Button title="Run" onPress={run} />
          {response && <TextField mono editable={false} value={JSON.stringify(response, null, 2)} />}
        </>
      )}
    </Screen>
  );
}
