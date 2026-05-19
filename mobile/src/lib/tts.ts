/**
 * Türkçe sesli okuma (TTS) yardımcısı — expo-speech wrapper.
 *
 * Native modül bu build'de yoksa sessizce no-op olur.
 */

let Speech: typeof import('expo-speech') | null = null;
try {
  Speech = require('expo-speech');
} catch {
  Speech = null;
}

export function isTTSAvailable(): boolean {
  return Speech !== null;
}

export async function speak(text: string): Promise<void> {
  if (!Speech || !text) return;
  try {
    // Önceki konuşmayı durdur (üst üste binmemesi için)
    await Speech.stop();
    Speech.speak(text, {
      language: 'tr-TR',
      pitch: 1.0,
      rate: 1.0,
    });
  } catch {}
}

export async function stop(): Promise<void> {
  if (!Speech) return;
  try {
    await Speech.stop();
  } catch {}
}

export async function isSpeaking(): Promise<boolean> {
  if (!Speech) return false;
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
