import Slider from '@react-native-community/slider';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ColorWheel from '../components/ColorWheel';
import { useBulbControl } from '../hooks/useWiz';
import { saveBulbName } from '../services/StorageService';
import { WIZ_SCENES } from '../services/WizService';
import { TEMP_MAX, TEMP_MIN, kelvinToHex, rgbToHex, tempToLabel } from '../utils/colorUtils';

const TABS = ['White', 'Color', 'Scenes'];

export default function BulbControlScreen({ route, navigation }) {
  const { bulb: initialBulb, updateBulb } = route.params;
  const [localBulb, setLocalBulb] = useState(initialBulb);
  const [activeTab, setActiveTab] = useState(
    initialBulb.mode === 'color' ? 'Color' : 'White'
  );
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState('');

  const syncUpdate = useCallback(
    (updates) => {
      setLocalBulb((prev) => ({ ...prev, ...updates }));
      updateBulb(localBulb.ip, updates);
    },
    [localBulb.ip, updateBulb]
  );

  const handleRename = () => {
    setRenameText(localBulb.name);
    setRenameVisible(true);
  };

  const { toggle, setBrightness, setColorTemp, setColor, setScene } =
    useBulbControl(localBulb, syncUpdate);

  useEffect(() => {
    navigation.setOptions({
      title: localBulb.name,
      headerStyle: { backgroundColor: '#0a0a1a' },
      headerTintColor: '#f0f0ff',
    });
  }, [localBulb.name]);

  const lightColor =
    localBulb.mode === 'color'
      ? rgbToHex(localBulb.r, localBulb.g, localBulb.b)
      : kelvinToHex(localBulb.temp || 4000);

  const renderWhiteTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Color Temperature</Text>
          <Text style={[styles.sectionValue, { color: kelvinToHex(localBulb.temp || 4000) }]}>
            {localBulb.temp || 4000}K · {tempToLabel(localBulb.temp || 4000)}
          </Text>
        </View>
        <View style={styles.tempBarWrap}>
          <View style={styles.tempGradient} />
          <Slider
            style={styles.slider}
            minimumValue={TEMP_MIN}
            maximumValue={TEMP_MAX}
            value={localBulb.temp || 4000}
            onValueChange={(v) => {
              syncUpdate({ temp: Math.round(v), mode: 'white' });
              setColorTemp(Math.round(v));
            }}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor="#fff"
          />
        </View>
        <View style={styles.tempLabels}>
          <Text style={styles.tempLabel}>🕯 Warm</Text>
          <Text style={styles.tempLabel}>Daylight ☀️</Text>
        </View>
        <View style={styles.presetRow}>
          {[2700, 3500, 4000, 5000, 6500].map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.presetBtn, localBulb.temp === k && styles.presetBtnActive]}
              onPress={() => { syncUpdate({ temp: k, mode: 'white' }); setColorTemp(k); }}
            >
              <View style={[styles.presetDot, { backgroundColor: kelvinToHex(k) }]} />
              <Text style={styles.presetText}>{k}K</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderColorTab = () => (
    <View style={styles.tabContent}>
      <ColorWheel
        color={{ r: localBulb.r, g: localBulb.g, b: localBulb.b }}
        onColorChange={(r, g, b) => { syncUpdate({ r, g, b, mode: 'color' }); setColor(r, g, b); }}
        style={styles.colorWheel}
      />
      <View style={styles.colorPreviewRow}>
        <View style={[styles.colorPreview, { backgroundColor: lightColor }]} />
        <Text style={styles.colorHex}>{lightColor.toUpperCase()}</Text>
        <Text style={styles.colorRgb}>R {localBulb.r} · G {localBulb.g} · B {localBulb.b}</Text>
      </View>
      <View style={styles.swatchRow}>
        {[[255, 60, 60], [255, 140, 0], [255, 220, 0], [60, 200, 80], [60, 140, 255], [140, 60, 255], [255, 60, 180], [255, 255, 255]].map(([r, g, b]) => (
          <TouchableOpacity
            key={`${r}-${g}-${b}`}
            style={[styles.swatch, { backgroundColor: rgbToHex(r, g, b) },
            localBulb.r === r && localBulb.g === g && localBulb.b === b && styles.swatchSelected]}
            onPress={() => { syncUpdate({ r, g, b, mode: 'color' }); setColor(r, g, b); }}
          />
        ))}
      </View>
    </View>
  );

  const renderScenesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sceneGrid}>
        {WIZ_SCENES.map((scene) => (
          <TouchableOpacity
            key={scene.id}
            style={[styles.sceneBtn, localBulb.sceneId === scene.id && styles.sceneBtnActive]}
            onPress={() => { syncUpdate({ sceneId: scene.id, mode: 'scene', isOn: true }); setScene(scene.id); }}
          >
            <Text style={styles.sceneEmoji}>{scene.emoji}</Text>
            <Text style={styles.sceneName}>{scene.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

      <View style={styles.glowHeader}>
        <View style={[styles.glowBlob, { backgroundColor: localBulb.isOn ? lightColor : '#111' }]} />
        <View style={styles.headerContent}>
          <Text style={styles.bulbName}>{localBulb.name}</Text>
          <Text style={styles.bulbIp}>{localBulb.ip}</Text>
          <TouchableOpacity onPress={handleRename} style={styles.renameBtn}>
            <Text style={styles.renameBtnText}>✏️ Rename</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.powerRow}>
          <Text style={styles.powerLabel}>{localBulb.isOn ? 'ON' : 'OFF'}</Text>
          <Switch
            value={localBulb.isOn}
            onValueChange={() => { syncUpdate({ isOn: !localBulb.isOn }); toggle(); }}
            trackColor={{ false: '#2a2a3a', true: lightColor + '99' }}
            thumbColor={localBulb.isOn ? lightColor : '#555'}
            ios_backgroundColor="#2a2a3a"
          />
        </View>
      </View>

      <View style={[styles.brightnessSection, !localBulb.isOn && styles.disabled]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Brightness</Text>
          <Text style={[styles.sectionValue, { color: lightColor }]}>{localBulb.brightness}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={100}
          step={1}
          value={localBulb.brightness}
          onValueChange={(v) => { syncUpdate({ brightness: v }); setBrightness(v); }}
          minimumTrackTintColor={lightColor}
          maximumTrackTintColor="#2a2a3a"
          thumbTintColor={lightColor}
          disabled={!localBulb.isOn}
        />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && (
              <View style={[styles.tabIndicator, { backgroundColor: lightColor }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={[styles.scroll, !localBulb.isOn && styles.disabled]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={localBulb.isOn}
      >
        {activeTab === 'White' && renderWhiteTab()}
        {activeTab === 'Color' && renderColorTab()}
        {activeTab === 'Scenes' && renderScenesTab()}
      </ScrollView>

      {/* Rename Modal */}
      <Modal visible={renameVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename Bulb</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              placeholderTextColor="#555"
              placeholder="Bulb name"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={async () => {
                  const trimmed = renameText.trim();
                  if (!trimmed) return;
                  syncUpdate({ name: trimmed });
                  try {
                    await saveBulbName(localBulb.ip, trimmed);
                  } catch (e) {
                    console.warn('Failed to save name', e);
                  }
                  setRenameVisible(false);
                }}
              >
                <Text style={styles.modalSaveText}>Save</Text>
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
  glowHeader: { padding: 20, paddingBottom: 16, overflow: 'hidden', position: 'relative' },
  glowBlob: { position: 'absolute', top: -60, left: '20%', width: 200, height: 200, borderRadius: 100, opacity: 0.12 },
  headerContent: { marginBottom: 12 },
  bulbName: { color: '#f0f0ff', fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  bulbIp: { color: '#555', fontSize: 12, fontFamily: 'Courier New', marginTop: 2 },
  renameBtn: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#1e1e3a', borderRadius: 10, borderWidth: 1, borderColor: '#3a3a6a' },
  renameBtnText: { color: '#8080ff', fontSize: 12, fontWeight: '500' },
  powerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  powerLabel: { color: '#888', fontSize: 14, fontWeight: '600', letterSpacing: 1.5 },
  brightnessSection: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#0e0e22', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1e1e3a' },
  disabled: { opacity: 0.4, pointerEvents: 'none' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionLabel: { color: '#888', fontSize: 13, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionValue: { fontSize: 14, fontWeight: '600' },
  slider: { width: '100%', height: 40 },
  tabBar: { flexDirection: 'row', backgroundColor: '#0e0e22', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#1e1e3a' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabActive: {},
  tabText: { color: '#555', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#f0f0ff', fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 2, width: '50%', borderRadius: 1 },
  scroll: { flex: 1 },
  tabContent: { padding: 20 },
  section: { marginBottom: 24 },
  tempBarWrap: { position: 'relative', height: 50, marginTop: 4 },
  tempGradient: { position: 'absolute', left: 16, right: 16, top: 16, height: 18, borderRadius: 9, backgroundColor: 'transparent' },
  tempLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  tempLabel: { color: '#555', fontSize: 12 },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'space-between' },
  presetBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#12122a', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4a', gap: 4 },
  presetBtnActive: { borderColor: '#8080ff', backgroundColor: '#1a1a3a' },
  presetDot: { width: 14, height: 14, borderRadius: 7 },
  presetText: { color: '#888', fontSize: 10, fontWeight: '500' },
  colorWheel: { marginBottom: 20 },
  colorPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, backgroundColor: '#12122a', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#2a2a4a' },
  colorPreview: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  colorHex: { color: '#f0f0ff', fontSize: 14, fontFamily: 'Courier New', fontWeight: '600' },
  colorRgb: { color: '#555', fontSize: 11, fontFamily: 'Courier New', flex: 1, textAlign: 'right' },
  swatchRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  swatch: { flex: 1, aspectRatio: 1, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: '#fff', shadowColor: '#fff', shadowOpacity: 0.4, shadowRadius: 6, elevation: 6 },
  sceneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sceneBtn: { width: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: '#12122a', borderRadius: 16, borderWidth: 1, borderColor: '#2a2a4a', gap: 4 },
  sceneBtnActive: { backgroundColor: '#1a1a4a', borderColor: '#6060cc' },
  sceneEmoji: { fontSize: 22 },
  sceneName: { color: '#888', fontSize: 11, textAlign: 'center', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#12122a', borderRadius: 20, padding: 24, width: '80%', borderWidth: 1, borderColor: '#2a2a4a' },
  modalTitle: { color: '#f0f0ff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  modalInput: { backgroundColor: '#0a0a1a', borderRadius: 12, borderWidth: 1, borderColor: '#3a3a6a', color: '#f0f0ff', fontSize: 16, padding: 12, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#1e1e3a', alignItems: 'center' },
  modalCancelText: { color: '#888', fontWeight: '600' },
  modalSave: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#3a3aaa', alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '600' },
});