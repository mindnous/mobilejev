import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SystemOneResponse } from '@/lib/llm';
import type { SimpleQuestion } from '@/lib/settings';

type AnswerListProps = {
  questions: SimpleQuestion[];
  response: SystemOneResponse; // answers are named q1, q2, ... (see buildRequest)
};

/** Shows each question with its answer and probabilities. */
export function AnswerList({ questions, response }: AnswerListProps) {
  return questions.map((question, i) => {
    const answer = response.answers[`q${i + 1}`];
    return (
      <ThemedView key={i} type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{question.instructions}</ThemedText>
        {answer?.type === 'noul' && <ThemedText>Yes: {percent(answer.noul)}</ThemedText>}
        {answer?.type === 'choice' && (
          <>
            <ThemedText>Answer: {answer.choice}</ThemedText>
            {Object.entries(answer.probabilities).map(([option, probability]) => (
              <ThemedText key={option} type="small" themeColor="textSecondary">
                {option}: {percent(probability)}
              </ThemedText>
            ))}
          </>
        )}
      </ThemedView>
    );
  });
}

function percent(probability: number) {
  return `${Math.round(probability * 100)}%`;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
