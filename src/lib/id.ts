import * as Crypto from 'expo-crypto';

/** UUID v4 za ID-eve zapisa. `expo-crypto` je u Expo Go. */
export function newId(): string {
  return Crypto.randomUUID();
}
