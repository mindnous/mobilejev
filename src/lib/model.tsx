import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { initLlama, type LlamaContext } from 'llama.rn';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { TurboModuleRegistry } from 'react-native';

import { useSettings } from '@/lib/settings';

type PickedFile = { name: string; uri: string };

/** A message shown at the top of the app. `busy` shows a spinner and keeps it until the next message. */
export type Notice = { text: string; busy: boolean };

type ModelState = {
  llama: LlamaContext | null;
  modelName: string | null;
  mmprojName: string | null;
  notice: Notice | null;
  pickModel: () => Promise<void>;
  pickMmproj: () => Promise<void>;
};

const ModelContext = createContext<ModelState | null>(null);

// Our copies of the loaded .gguf files. llama.cpp needs a real file path (Android pickers
// only give content:// URIs), and keeping the copies lets the app load them again on start.
const MODELS_DIR = new Directory(Paths.document, 'models');

// Exists only while the model is auto-loading. If it is still there when the app starts,
// loading crashed the app last time, so auto-load is skipped instead of crashing again.
const AUTOLOAD_MARKER = new File(Paths.document, 'autoload-running');

// Tokens llama.cpp processes in one step. Vision models read a whole image in one step,
// so an image must not be bigger than this, or llama.cpp aborts and the app crashes.
const BATCH_SIZE = 512;
export const MAX_IMAGE_TOKENS = BATCH_SIZE;

/**
 * Deletes every model copy. Also removes the cache folders where earlier versions
 * of the app copied models (GGUF files are GBs, so don't leave old copies behind).
 */
function deleteAllCopies() {
  for (const dir of [MODELS_DIR, new Directory(Paths.cache, 'models'), new Directory(Paths.cache, 'DocumentPicker')]) {
    if (dir.exists) dir.delete();
  }
}

/** Opens the file picker and returns the picked .gguf (not copied yet), or null if canceled. */
async function pickGguf(): Promise<PickedFile | null> {
  // copyToCacheDirectory: false, because the picker copies on the UI thread and freezes the app.
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
  if (result.canceled) return null;
  const { name, uri } = result.assets[0];
  if (!name.toLowerCase().endsWith('.gguf')) throw new Error('Please pick a .gguf file');
  return { name, uri };
}

/** Copies a picked file into MODELS_DIR in the background, and returns the copy. */
async function copyIn(file: PickedFile) {
  if (!MODELS_DIR.exists) MODELS_DIR.create();
  const copy = new File(MODELS_DIR, file.name);
  if (copy.exists) copy.delete();
  await new File(file.uri).copy(copy);
  return copy;
}

/** Holds the one loaded GGUF model so every screen can use it, and loads the default model on start. */
export function ModelProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [llama, setLlama] = useState<LlamaContext | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [mmprojName, setMmprojName] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const hideNoticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /** Shows a message at the top of the app. Messages that are not busy hide after a few seconds. */
  function notify(text: string, busy = false) {
    clearTimeout(hideNoticeTimer.current);
    setNotice({ text, busy });
    if (!busy) hideNoticeTimer.current = setTimeout(() => setNotice(null), 4000);
  }

  /** Loads a model file that is already in MODELS_DIR. */
  async function loadModel(file: File) {
    notify(`Loading model ${file.name}...`, true);
    const context = await initLlama(
      {
        model: file.uri,
        n_ctx: 4096,
        n_batch: BATCH_SIZE,
        n_ubatch: BATCH_SIZE,
        // The GPU (OpenCL) can give wrong outputs on some phones and models, so it's optional.
        n_gpu_layers: settings.useGpu ? 99 : 0,
        ctx_shift: false, // must be off for image (mmproj) support
      },
      (percent) => notify(`Loading model ${file.name} ${percent}%`, true)
    );
    setLlama(context);
    setModelName(file.name);
    return context;
  }

  /** Loads an mmproj file that is already in MODELS_DIR into the loaded model. */
  async function loadMmproj(context: LlamaContext, file: File) {
    notify(`Loading mmproj ${file.name}...`, true);
    // Limit the tokens per image (models like Qwen-VL use more tokens for bigger images).
    const ok = await context
      .initMultimodal({ path: file.uri, use_gpu: true, image_max_tokens: Number(settings.imageMaxTokens) })
      .catch(() => false);
    if (!ok) throw new Error('Could not load this mmproj. Make sure it matches the model.');
    setMmprojName(file.name);
  }

  async function pickModel() {
    // llama.rn's native code only exists in an app built after llama.rn was installed
    // (not in Expo Go, and not in a development build made before it was added).
    if (!TurboModuleRegistry.get('RNLlama')) {
      throw new Error('This app was built without llama.rn. Rebuild and install it with "npx expo run:android".');
    }
    const picked = await pickGguf();
    if (!picked) return;

    // Unload the old model (and its mmproj) before loading the new one, to free memory and storage.
    await llama?.release();
    setLlama(null);
    setModelName(null);
    setMmprojName(null);
    deleteAllCopies();
    updateSettings({ modelName: null, mmprojName: null });

    try {
      notify('Copying model into the app...', true);
      const file = await copyIn(picked);
      await loadModel(file);
      updateSettings({ modelName: file.name }); // the last loaded model is the default
      notify(`Model loaded: ${file.name}`);
    } catch (error) {
      deleteAllCopies();
      setNotice(null);
      throw error;
    }
  }

  async function pickMmproj() {
    if (!llama) throw new Error('Load a model first');
    const imageMaxTokens = Number(settings.imageMaxTokens);
    if (!Number.isInteger(imageMaxTokens) || imageMaxTokens < 1 || imageMaxTokens > MAX_IMAGE_TOKENS) {
      throw new Error(`Max image tokens must be a whole number from 1 to ${MAX_IMAGE_TOKENS}`);
    }
    const picked = await pickGguf();
    if (!picked) return;

    if (mmprojName) {
      await llama.releaseMultimodal();
      const old = new File(MODELS_DIR, mmprojName);
      if (old.exists) old.delete();
      setMmprojName(null);
      updateSettings({ mmprojName: null });
    }

    let file: File | null = null;
    try {
      notify('Copying mmproj into the app...', true);
      file = await copyIn(picked);
      await loadMmproj(llama, file);
      updateSettings({ mmprojName: file.name });
      notify(`mmproj loaded: ${file.name}`);
    } catch (error) {
      if (file?.exists) file.delete();
      setNotice(null);
      throw error;
    }
  }

  /** Loads the default model and mmproj from Settings, telling the user what happens. */
  async function autoLoad() {
    if (!settings.autoLoad || !settings.modelName) return;
    if (AUTOLOAD_MARKER.exists) {
      AUTOLOAD_MARKER.delete();
      notify('Did not auto-load the model: the app closed while loading it last time.');
      return;
    }
    const model = new File(MODELS_DIR, settings.modelName);
    if (!model.exists) {
      notify(`Default model ${settings.modelName} is missing. Pick it again in Settings.`);
      return;
    }

    AUTOLOAD_MARKER.create();
    try {
      const context = await loadModel(model);
      if (settings.mmprojName) await loadMmproj(context, new File(MODELS_DIR, settings.mmprojName));
      notify('Ready: default model loaded');
    } catch (error) {
      notify(`Auto-load failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      AUTOLOAD_MARKER.delete();
    }
  }

  // Auto-load once, when the app opens (from a timer so the first screen shows first).
  useEffect(() => {
    const timer = setTimeout(autoLoad, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only once, when the app opens
  }, []);

  return (
    <ModelContext.Provider value={{ llama, modelName, mmprojName, notice, pickModel, pickMmproj }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const state = useContext(ModelContext);
  if (!state) throw new Error('useModel must be used inside <ModelProvider>');
  return state;
}

/** Returns the loaded model, or throws a readable error if none is loaded yet. */
export function requireModel(llama: LlamaContext | null) {
  if (!llama) throw new Error('No model loaded. Open Settings (gear, bottom right) and upload a .gguf file.');
  return llama;
}
