import * as SecureStore from 'expo-secure-store';

const GROUPS_KEY = 'wiz_groups';

export async function loadGroups() {
  try {
    const json = await SecureStore.getItemAsync(GROUPS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveGroups(groups) {
  try {
    await SecureStore.setItemAsync(GROUPS_KEY, JSON.stringify(groups));
  } catch (e) {
    console.warn('Failed to save groups:', e);
  }
}

export async function createGroup(name) {
  const groups = await loadGroups();
  const newGroup = { id: `group_${Date.now()}`, name, bulbIps: [] };
  const updated = [...groups, newGroup];
  await saveGroups(updated);
  return updated;
}

export async function deleteGroup(groupId) {
  const groups = await loadGroups();
  const updated = groups.filter((g) => g.id !== groupId);
  await saveGroups(updated);
  return updated;
}

export async function addBulbToGroup(groupId, bulbIp) {
  const groups = await loadGroups();
  const updated = groups.map((g) => {
    if (g.id !== groupId) return g;
    if (g.bulbIps.includes(bulbIp)) return g;
    return { ...g, bulbIps: [...g.bulbIps, bulbIp] };
  });
  await saveGroups(updated);
  return updated;
}

export async function removeBulbFromGroup(groupId, bulbIp) {
  const groups = await loadGroups();
  const updated = groups.map((g) => {
    if (g.id !== groupId) return g;
    return { ...g, bulbIps: g.bulbIps.filter((ip) => ip !== bulbIp) };
  });
  await saveGroups(updated);
  return updated;
}

export async function renameGroup(groupId, name) {
  const groups = await loadGroups();
  const updated = groups.map((g) => g.id === groupId ? { ...g, name } : g);
  await saveGroups(updated);
  return updated;
}