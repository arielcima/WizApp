import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView, StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BulbCard from '../components/BulbCard';
import GroupCard from '../components/GroupCard';
import { useGroups } from '../hooks/useGroups';
import { useBulbControl, useBulbs } from '../hooks/useWiz';
import WizService from '../services/WizService';

function BulbCardWrapper({ bulb, updateBulb, onPress, onLongPress }) {
  const { toggle } = useBulbControl(bulb, updateBulb);
  return (
    <BulbCard
      bulb={bulb}
      onToggle={toggle}
      onPress={() => onPress(bulb)}
      onLongPress={() => onLongPress(bulb)}
    />
  );
}

export default function HomeScreen({ navigation }) {
  const { bulbs, isScanning, lastScan, scan, updateBulb } = useBulbs();
  const { groups, addGroup, removeGroup, assignBulbToGroup, unassignBulbFromGroup, updateGroupName, getBulbGroup } = useGroups();

  const [assignModal, setAssignModal] = useState(false);
  const [selectedBulb, setSelectedBulb] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [pendingAssignAfterCreate, setPendingAssignAfterCreate] = useState(false);

  useEffect(() => { scan(); }, []);

  const formatLastScan = () => {
    if (!lastScan) return '';
    const diff = Math.round((Date.now() - lastScan) / 1000);
    if (diff < 60) return `Updated ${diff}s ago`;
    return `Updated ${Math.round(diff / 60)}m ago`;
  };

  const handleLongPress = useCallback((bulb) => {
    setSelectedBulb(bulb);
    setAssignModal(true);
  }, []);

  const handleAssignToGroup = useCallback(async (groupId) => {
    if (!selectedBulb) return;
    const existingGroupId = getBulbGroup(selectedBulb.ip);
    if (existingGroupId) await unassignBulbFromGroup(existingGroupId, selectedBulb.ip);
    await assignBulbToGroup(groupId, selectedBulb.ip);
    setAssignModal(false);
    setSelectedBulb(null);
  }, [selectedBulb, getBulbGroup, assignBulbToGroup, unassignBulbFromGroup]);

  const handleRemoveFromGroup = useCallback(async () => {
    if (!selectedBulb) return;
    const existingGroupId = getBulbGroup(selectedBulb.ip);
    if (existingGroupId) await unassignBulbFromGroup(existingGroupId, selectedBulb.ip);
    setAssignModal(false);
    setSelectedBulb(null);
  }, [selectedBulb, getBulbGroup, unassignBulbFromGroup]);

  const handleCreateGroup = useCallback(async () => {
    const name = newGroupName.trim();
    if (!name) return;
    const updatedGroups = await addGroup(name);
    setNewGroupName('');
    setCreateModal(false);
    // If triggered from long-press, assign bulb to the newly created group
    if (pendingAssignAfterCreate && selectedBulb) {
      const { loadGroups } = await import('../services/GroupService');
      const allGroups = await loadGroups();
      const newest = allGroups[allGroups.length - 1];
      if (newest) {
        const existingGroupId = getBulbGroup(selectedBulb.ip);
        if (existingGroupId) await unassignBulbFromGroup(existingGroupId, selectedBulb.ip);
        await assignBulbToGroup(newest.id, selectedBulb.ip);
      }
      setPendingAssignAfterCreate(false);
      setSelectedBulb(null);
    }
  }, [newGroupName, addGroup, pendingAssignAfterCreate, selectedBulb, getBulbGroup, assignBulbToGroup, unassignBulbFromGroup]);

  const handleGroupToggleAll = useCallback(async (group) => {
    const groupBulbs = bulbs.filter((b) => group.bulbIps.includes(b.ip));
    const allOn = groupBulbs.every((b) => b.isOn);
    const newState = !allOn;
    await Promise.all(groupBulbs.map((b) => WizService.togglePower(b.ip, newState)));
    group.bulbIps.forEach((ip) => updateBulb(ip, { isOn: newState }));
  }, [bulbs, updateBulb]);

  const updateBulbs = useCallback((ips, updates) => {
    ips.forEach((ip) => updateBulb(ip, updates));
  }, [updateBulb]);

  const groupedBulbIps = new Set(groups.flatMap((g) => g.bulbIps));
  const ungroupedBulbs = bulbs.filter((b) => !groupedBulbIps.has(b.ip));
  const listItems = [
    ...groups.map((g) => ({ type: 'group', data: g })),
    ...ungroupedBulbs.map((b) => ({ type: 'bulb', data: b })),
  ];

  const renderItem = ({ item }) => {
    if (item.type === 'group') {
      const group = item.data;
      return (
        <GroupCard
          group={group}
          bulbs={bulbs}
          onToggleAll={() => handleGroupToggleAll(group)}
          onPress={() => navigation.navigate('GroupControl', {
            group,
            bulbs,
            onUpdateBulbs: updateBulbs,
            onRemoveBulb: async (groupId, bulbIp) => { await unassignBulbFromGroup(groupId, bulbIp); },
            onDeleteGroup: async (groupId) => { await removeGroup(groupId); },
            onRenameGroup: async (groupId, name) => { await updateGroupName(groupId, name); },
          })}
        />
      );
    }
    return (
      <BulbCardWrapper
        bulb={item.data}
        updateBulb={updateBulb}
        onPress={(bulb) => navigation.navigate('BulbControl', { bulb, updateBulb })}
        onLongPress={handleLongPress}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      {isScanning ? (
        <>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Scanning network…</Text>
          <Text style={styles.emptySubtitle}>Looking for WiZ bulbs on your local network</Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyTitle}>No bulbs found</Text>
          <Text style={styles.emptySubtitle}>Make sure your WiZ bulbs are powered on{'\n'}and on the same Wi-Fi network</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={scan}>
            <Text style={styles.retryText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>WiZ Control</Text>
          <Text style={styles.subtitle}>
            {bulbs.length > 0 ? `${bulbs.length} bulb${bulbs.length > 1 ? 's' : ''} · ${formatLastScan()}` : 'Local network control'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addGroupBtn} onPress={() => { setSelectedBulb(null); setPendingAssignAfterCreate(false); setCreateModal(true); }}>
            <Text style={styles.addGroupText}>+ Group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.scanBtn, isScanning && styles.scanBtnActive]} onPress={scan} disabled={isScanning}>
            {isScanning ? <ActivityIndicator size="small" color="#a0a0ff" /> : <Text style={styles.scanBtnText}>↻ Scan</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {bulbs.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <View style={styles.onDot} />
            <Text style={styles.statText}>{bulbs.filter((b) => b.isOn).length} on</Text>
          </View>
          <View style={styles.statPill}>
            <View style={[styles.onDot, { backgroundColor: '#444' }]} />
            <Text style={styles.statText}>{bulbs.filter((b) => !b.isOn).length} off</Text>
          </View>
          {groups.length > 0 && (
            <View style={styles.statPill}>
              <Text style={styles.statText}>📁 {groups.length} group{groups.length > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={listItems}
        keyExtractor={(item) => item.type === 'group' ? item.data.id : item.data.ip}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={listItems.length === 0 ? styles.listEmpty : styles.list}
        refreshControl={<RefreshControl refreshing={isScanning} onRefresh={scan} tintColor="#a0a0ff" colors={['#a0a0ff']} />}
      />

      {/* Assign to group modal */}
      <Modal visible={assignModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assign "{selectedBulb?.name}" to group</Text>
            {groups.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.groupOption, getBulbGroup(selectedBulb?.ip) === g.id && styles.groupOptionActive]}
                onPress={() => handleAssignToGroup(g.id)}
              >
                <Text style={styles.groupOptionIcon}>📁</Text>
                <Text style={styles.groupOptionName}>{g.name}</Text>
                <Text style={styles.groupOptionCount}>{g.bulbIps.length} bulb{g.bulbIps.length !== 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            ))}
            {getBulbGroup(selectedBulb?.ip) && (
              <TouchableOpacity style={styles.removeFromGroupBtn} onPress={handleRemoveFromGroup}>
                <Text style={styles.removeFromGroupText}>↩ Remove from group</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.newGroupOption}
              onPress={() => { setAssignModal(false); setPendingAssignAfterCreate(true); setCreateModal(true); }}
            >
              <Text style={styles.newGroupOptionText}>+ Create new group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAssignModal(false); setSelectedBulb(null); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create group modal */}
      <Modal visible={createModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Group</Text>
            <TextInput
              style={styles.modalInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
              placeholder="Group name (e.g. Living Room)"
              placeholderTextColor="#555"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setCreateModal(false); setNewGroupName(''); setPendingAssignAfterCreate(false); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleCreateGroup}>
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { color: '#f0f0ff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#666', fontSize: 13, marginTop: 2 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  addGroupBtn: { backgroundColor: '#1a1a3a', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#4a3a6a' },
  addGroupText: { color: '#c080ff', fontSize: 13, fontWeight: '600' },
  scanBtn: { backgroundColor: '#1a1a3a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#3a3a6a', minWidth: 80, alignItems: 'center' },
  scanBtnActive: { borderColor: '#a0a0ff' },
  scanBtnText: { color: '#a0a0ff', fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#12122a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  onDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5fa' },
  statText: { color: '#888', fontSize: 12 },
  list: { paddingBottom: 24 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: '#f0f0ff', fontSize: 22, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { color: '#555', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  retryBtn: { marginTop: 24, backgroundColor: '#1e1e4a', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 22, borderWidth: 1, borderColor: '#4a4a9a' },
  retryText: { color: '#a0a0ff', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#12122a', borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: '#2a2a4a' },
  modalTitle: { color: '#f0f0ff', fontSize: 17, fontWeight: '600', marginBottom: 16 },
  modalInput: { backgroundColor: '#0a0a1a', borderRadius: 12, borderWidth: 1, borderColor: '#3a3a6a', color: '#f0f0ff', fontSize: 16, padding: 12, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#1e1e3a', alignItems: 'center' },
  cancelBtnText: { color: '#888', fontWeight: '600' },
  modalSave: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#3a3aaa', alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '600' },
  groupOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#0e0e22', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a4a' },
  groupOptionActive: { borderColor: '#6060cc', backgroundColor: '#1a1a3a' },
  groupOptionIcon: { fontSize: 18 },
  groupOptionName: { flex: 1, color: '#f0f0ff', fontSize: 15, fontWeight: '500' },
  groupOptionCount: { color: '#555', fontSize: 12 },
  removeFromGroupBtn: { padding: 12, backgroundColor: '#1a0a0a', borderRadius: 12, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#5a2a2a' },
  removeFromGroupText: { color: '#ff6060', fontWeight: '600' },
  newGroupOption: { padding: 12, backgroundColor: '#0a0a1e', borderRadius: 12, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a5a', borderStyle: 'dashed' },
  newGroupOptionText: { color: '#8080ff', fontWeight: '600' },
});