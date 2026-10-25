import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { pickImage } from '@/lib/image';
import { chatCompletions, type ChatMessage } from '@/lib/llm';
import { requireModel, useModel } from '@/lib/model';

export default function ChatScreen() {
  const { llama, mmprojName } = useModel();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string>();

  async function attachImage() {
    const uri = await pickImage(mmprojName);
    if (uri) setImageUri(uri);
  }

  async function send() {
    const model = requireModel(llama);
    if (!text.trim()) throw new Error('Type a message first');
    const history = [...messages, { role: 'user' as const, text, imageUri }];
    setMessages(history);
    setText('');
    setImageUri(undefined);
    try {
      const reply = await chatCompletions(model, history);
      setMessages([...history, { role: 'assistant', text: reply }]);
    } catch (error) {
      // Put the message back in the box so it can be sent again.
      setMessages(messages);
      setText(text);
      setImageUri(imageUri);
      throw error;
    }
  }

  return (
    <Screen title="Chat" scrollToEnd>
      {messages.map((message, i) => (
        <ThemedView
          key={i}
          type={message.role === 'user' ? 'backgroundSelected' : 'backgroundElement'}
          style={styles.bubble}>
          <ThemedText type="smallBold">{message.role === 'user' ? 'You' : 'Model'}</ThemedText>
          {message.imageUri && <Image source={{ uri: message.imageUri }} style={styles.image} />}
          <ThemedText selectable>{message.text}</ThemedText>
        </ThemedView>
      ))}

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <TextField placeholder="Ask something..." value={text} onChangeText={setText} />
      <Button title={imageUri ? 'Change image' : 'Attach image (optional)'} onPress={attachImage} />
      <Button title="Send" onPress={send} />
      {messages.length > 0 && <Button title="Clear chat" onPress={() => setMessages([])} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.two,
  },
});
