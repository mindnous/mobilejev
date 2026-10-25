import { File, Paths } from 'expo-file-system';
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';

import type { SystemOneRequest } from '@/lib/llm';

/** One SystemOne question as typed in the app. Choice options are one per line, as "name: description". */
export type SimpleQuestion = {
  type: 'choice' | 'noul';
  instructions: string;
  options: string;
};

export type Settings = {
  autoLoad: boolean; // load the default model (and mmproj) when the app opens
  useGpu: boolean;
  imageMaxTokens: string; // as typed, checked when the mmproj is loaded
  modelName: string | null; // the default model: the last one loaded (its copy stays in the app)
  mmprojName: string | null;
  prompt: string; // SystemOne defaults
  questions: SimpleQuestion[];
};

// The SystemOne defaults are the curl example in guide.md.
const DEFAULT_SETTINGS: Settings = {
  autoLoad: true,
  useGpu: false,
  imageMaxTokens: '512', // MAX_IMAGE_TOKENS in model.tsx
  modelName: null,
  mmprojName: null,
  prompt: 'Customer: I was charged twice and I am furious.',
  questions: [
    { type: 'choice', instructions: 'What is the issue about?', options: 'billing: money problems\nbug: broken product' },
    { type: 'noul', instructions: 'Escalate to a human now?', options: '' },
  ],
};

/** Turns the saved prompt and questions into a SystemOne request (questions are named q1, q2, ...). */
export function buildRequest({ prompt, questions }: Pick<Settings, 'prompt' | 'questions'>): SystemOneRequest {
  const entries = questions.map((question, i) => {
    if (question.type === 'noul') return [`q${i + 1}`, { type: 'noul', instructions: question.instructions }];
    const criteria: Record<string, string> = {};
    for (const line of question.options.split('\n')) {
      const [name, ...description] = line.split(':');
      if (name.trim()) criteria[name.trim()] = description.join(':').trim();
    }
    return [`q${i + 1}`, { type: 'choice', instructions: question.instructions, criteria }];
  });
  return { state: prompt, questions: Object.fromEntries(entries) };
}

const SETTINGS_FILE = new File(Paths.document, 'settings.json');

function readSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(SETTINGS_FILE.textSync()) };
  } catch {
    return DEFAULT_SETTINGS; // first start (no file yet)
  }
}

type SettingsState = {
  settings: Settings;
  updateSettings: (change: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

/** Holds the settings, saved in the app's documents so they are ready the next time the app opens. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(readSettings);
  // Always the newest settings, so two quick updates in a row don't undo each other.
  const latest = useRef(settings);

  function updateSettings(change: Partial<Settings>) {
    latest.current = { ...latest.current, ...change };
    setSettings(latest.current);
    SETTINGS_FILE.write(JSON.stringify(latest.current));
  }

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const state = useContext(SettingsContext);
  if (!state) throw new Error('useSettings must be used inside <SettingsProvider>');
  return state;
}
