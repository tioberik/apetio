import { useSyncExternalStore } from 'react';
import Storage from 'expo-sqlite/kv-store';

/**
 * Reaktivni ključ-vrijednost store za postavke (ciljevi, locale, tema, AI preferenca).
 * Sinkroni API (kao MMKV) preko `expo-sqlite/kv-store` — radi u **Expo Go** (za razliku od
 * react-native-mmkv). NIKAD API ključ ovdje (§12.2 → expo-secure-store).
 */

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function emit(key: string): void {
  const set = listeners.get(key);
  if (set) for (const l of set) l();
}

export const kv = {
  getString(key: string): string | undefined {
    return Storage.getItemSync(key) ?? undefined;
  },
  set(key: string, value: string): void {
    Storage.setItemSync(key, value);
    emit(key);
  },
  remove(key: string): void {
    Storage.removeItemSync(key);
    emit(key);
  },
  subscribe(key: string, listener: Listener): () => void {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(listener);
    return () => set?.delete(listener);
  },
};

/** Reaktivno čitanje jednog ključa (React re-render na promjenu). */
export function useKVString(key: string): string | undefined {
  return useSyncExternalStore(
    (cb) => kv.subscribe(key, cb),
    () => kv.getString(key),
  );
}
