/**
 * On-device versions of the two server endpoints from guide.md:
 *  - chatCompletions ~ POST /v1/chat/completions (text, or text + image)
 *  - systemOne       ~ POST /v1/systemone (typed "choice" / "noul" decisions)
 */
import type { LlamaContext, RNLlamaOAICompatibleMessage } from 'llama.rn';

// ---------- /v1/chat/completions ----------

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  imageUri?: string; // local file:// image, only for user messages
};

/** Sends the whole conversation to the model and returns the assistant's reply. */
export async function chatCompletions(llama: LlamaContext, messages: ChatMessage[]) {
  const formatted: RNLlamaOAICompatibleMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.imageUri
      ? [
          { type: 'image_url', image_url: { url: m.imageUri } },
          { type: 'text', text: m.text },
        ]
      : m.text,
  }));
  const result = await llama.completion({
    messages: formatted,
    n_predict: 512,
    temperature: 0.7,
    enable_thinking: false,
  });
  if (result.context_full) throw new Error('The chat is too long for the model. Press "Clear chat".');
  return result.content || result.text;
}

// ---------- /v1/systemone ----------

export type ChoiceQuestion = {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>; // option name -> description (can be empty)
};

export type NoulQuestion = {
  type: 'noul'; // yes/no question, answered with the probability of "yes"
  instructions: string;
};

export type SystemOneRequest = {
  model?: string; // accepted for compatibility with the server, ignored on device
  state: string;
  questions: Record<string, ChoiceQuestion | NoulQuestion>;
  images?: string[]; // optional local file:// or data: image URLs
};

export type ChoiceAnswer = {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number; // top-1 probability minus top-2 probability
};

export type NoulAnswer = {
  type: 'noul';
  noul: number; // probability of "yes"
};

export type SystemOneResponse = {
  model: string;
  answers: Record<string, ChoiceAnswer | NoulAnswer>;
  usage: { input_tokens: number; output_tokens: number };
};

/** Parses the SystemOne JSON typed by the user, with readable errors for the common mistakes. */
export function parseSystemOneRequest(json: string): SystemOneRequest {
  return validateSystemOneRequest(JSON.parse(json));
}

/** Checks a request has the shape SystemOne expects, and throws a readable error if not. */
export function validateSystemOneRequest(request: any): SystemOneRequest {
  if (typeof request?.state !== 'string') throw new Error('"state" must be a string');
  if (typeof request.questions !== 'object' || !request.questions) throw new Error('"questions" must be an object');
  for (const [name, question] of Object.entries<any>(request.questions)) {
    if (typeof question?.instructions !== 'string') throw new Error(`"${name}.instructions" must be a string`);
    if (question.type === 'choice') {
      if (Object.keys(question.criteria ?? {}).length < 2) throw new Error(`"${name}.criteria" needs at least 2 options`);
    } else if (question.type !== 'noul') {
      throw new Error(`"${name}.type" must be "choice" or "noul"`);
    }
  }
  return request;
}

/** Answers every question by asking the model for one letter and reading the letter probabilities. */
export async function systemOne(
  llama: LlamaContext,
  modelName: string,
  request: SystemOneRequest
): Promise<SystemOneResponse> {
  const answers: SystemOneResponse['answers'] = {};
  const usage = { input_tokens: 0, output_tokens: 0 };

  // One question at a time. The state (and images) come first in every prompt, so
  // llama.rn reuses that cached prefix and only the question part is re-processed.
  for (const [name, question] of Object.entries(request.questions)) {
    if (question.type === 'noul') {
      const [yes] = await optionProbabilities(llama, request, question.instructions, ['yes', 'no'], usage);
      answers[name] = { type: 'noul', noul: yes };
    } else {
      const optionNames = Object.keys(question.criteria);
      const options = optionNames.map((option) =>
        question.criteria[option] ? `${option} (${question.criteria[option]})` : option
      );
      const probs = await optionProbabilities(llama, request, question.instructions, options, usage);
      const [top1, top2] = [...probs].sort((a, b) => b - a);
      answers[name] = {
        type: 'choice',
        choice: optionNames[probs.indexOf(top1)],
        probabilities: Object.fromEntries(optionNames.map((option, i) => [option, probs[i]])),
        confidence: top1 - top2,
      };
    }
  }

  return { model: modelName, answers, usage };
}

/** Asks one question with options labeled A, B, C... and returns each option's probability (sums to 1). */
async function optionProbabilities(
  llama: LlamaContext,
  request: SystemOneRequest,
  instructions: string,
  options: string[],
  usage: SystemOneResponse['usage']
) {
  const letters = options.map((_, i) => String.fromCharCode(65 + i));
  const prompt =
    `${request.state}\n\n` +
    `Question: ${instructions}\n` +
    options.map((option, i) => `${letters[i]}: ${option}`).join('\n') +
    `\n\nAnswer with one letter only.`;

  const images = (request.images ?? []).map((url) => ({ type: 'image_url', image_url: { url } }));
  const result = await llama.completion({
    messages: [{ role: 'user', content: [...images, { type: 'text', text: prompt }] }],
    n_predict: 1,
    temperature: 0,
    grammar: `root ::= [${letters.join('')}]`, // force the reply to be one of the letters
    n_probs: 20,
    post_sampling_probs: false, // raw model probabilities, not the ones changed by the grammar
    enable_thinking: false,
  });
  usage.input_tokens += result.tokens_evaluated;
  usage.output_tokens += result.tokens_predicted;

  // Sum the probability of each letter (tokens like "A" and " A" both count).
  const probs = letters.map(() => 0);
  for (const candidate of result.completion_probabilities?.[0]?.probs ?? []) {
    const i = letters.indexOf(candidate.tok_str.trim());
    if (i >= 0) probs[i] += candidate.prob;
  }
  const total = probs.reduce((a, b) => a + b, 0);
  if (total > 0) return probs.map((p) => p / total);

  // Same fallback as jev_base.py: no letter is in the top probabilities, so trust the
  // grammar-forced letter with probability 1 (the full distribution is unavailable).
  const answer = letters.indexOf(result.text.trim());
  if (answer < 0) throw new Error(`The model did not answer with a letter for: ${instructions}`);
  return letters.map((_, i) => (i === answer ? 1 : 0));
}
