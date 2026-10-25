import { Pressable, StyleSheet, View } from 'react-native';

import { Segmented } from '@/components/segmented';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SimpleQuestion } from '@/lib/settings';

type QuestionEditorProps = {
  questions: SimpleQuestion[];
  onChange: (questions: SimpleQuestion[]) => void;
};

/** Edits a list of SystemOne questions: each is "pick one option" (with its options) or yes/no. */
export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const theme = useTheme();

  function updateQuestion(index: number, change: Partial<SimpleQuestion>) {
    onChange(questions.map((question, i) => (i === index ? { ...question, ...change } : question)));
  }

  return (
    <>
      {questions.map((question, i) => (
        <View key={i} style={[styles.card, { borderColor: theme.backgroundSelected }]}>
          <View style={styles.cardHeader}>
            <ThemedText type="smallBold">Question {i + 1}</ThemedText>
            {questions.length > 1 && (
              <Pressable onPress={() => onChange(questions.filter((_, j) => j !== i))}>
                <ThemedText type="linkPrimary">Remove</ThemedText>
              </Pressable>
            )}
          </View>
          <Segmented
            options={[
              { value: 'choice', label: 'Pick one option' },
              { value: 'noul', label: 'Yes / No' },
            ]}
            value={question.type}
            onChange={(type) => updateQuestion(i, { type })}
          />
          <TextField
            placeholder="Question, e.g. What is the issue about?"
            value={question.instructions}
            onChangeText={(instructions) => updateQuestion(i, { instructions })}
          />
          {question.type === 'choice' && (
            <TextField
              placeholder={'One option per line, e.g.\nbilling: money problems\nbug: broken product'}
              value={question.options}
              onChangeText={(options) => updateQuestion(i, { options })}
            />
          )}
        </View>
      ))}

      <Pressable onPress={() => onChange([...questions, { type: 'noul', instructions: '', options: '' }])}>
        <ThemedText type="linkPrimary">+ Add question</ThemedText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
