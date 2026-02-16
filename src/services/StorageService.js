import * as SecureStore from 'expo-secure-store';

const NAMES_KEY = 'wiz_bulb_names';

export async function loadBulbNames() {
  try {
    const json = await SecureStore.getItemAsync(NAMES_KEY);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

export async function saveBulbName(ip, name) {
  try {
    const existing = await loadBulbNames();
    const updated = { ...existing, [ip]: name };
    await SecureStore.setItemAsync(NAMES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save name:', e);
  }
}