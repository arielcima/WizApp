import Slider from '@react-native-community/slider';
import { useCallback, useState } from 'react';
import {
  Alert,
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
import WizService, { WIZ_SCENES } from '../services/WizService';
import { TEMP_MAX, TEMP_MIN, kelvinToHex, rgbToHex, tempToLabel } from '../utils/colorUtils';


const TABS = ['White', 'Color', 'Scenes'];

export default function GroupControlScreen({ route, navigation }) {
  const { group, bulbs, onUpdateBulbs, onRemoveBulb, onDeleteGroup, onRenameGroup } = route.params;

  const groupBulbs = bulbs.filter((b) => group.bulbIps.includes(b.ip));
  const allOn = groupBulbs.every((b) => b.isOn) && groupBulbs.length > 0;
  const someOn = groupBulbs.some((b) => b.isOn);

  const [activeTab, setActiveTab] = useState('White');
  const [brightness, setBrightnessState] = useState(groupBulbs[0]?.brightness ?? 80);
  const [temp, setTempState] = useState(groupBulbs[0]?.temp ?? 4000);
  const [color, setColorState] = useState({ r: groupBulbs[0]?.r ?? 255, g: groupBulbs[0]?.g ?? 255, b: groupBulbs[0]?.b ?? 255 });
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState(group.name);

  const lightColor = someOn
    ? activeTab === 'Color' ? rgbToHex(color.r, color.g, color.b) : kelvinToHex(temp)
    : '#444';

  const sendAll = useCallback(async (commandFn) => {
    await Promise.all(groupBulbs.map((b) => commandFn(b.ip)));
  }, [groupBulbs]);

  const toggleAll = useCallback(async () => {
    const newState = !allOn;
    await sendAll((ip) => WizService.togglePower(ip, newState));
    onUpdateBulbs(group.bulbIps, { isOn: newState });
  }, [allOn, sendAll, group.bulbIps, onUpdateBulbs]);

  const handleBrightness = useCallback((value) => {
    setBrightnessState(value);
    sendAll((ip) => WizService.setBrightness(ip, value));
    onUpdateBulbs(group.bulbIps, { brightness: value });
  }, [sendAll, group.bulbIps, onUpdateBulbs]);

  const handleColorTemp = useCallback((value) => {
    setTempState(value);
    sendAll((ip) => WizService.setColorTemp(ip, value, brightness));
    onUpdateBulbs(group.bulbIps, { temp: value, mode: 'white' });
  }, [sendAll, brightness, group.bulbIps, onUpdateBulbs]);

  const handleColor = useCallback((r, g, b) => {
    setColorState({ r, g, b });
    sendAll((ip) => WizService.setColor(ip, r, g, b, brightness));
    onUpdateBulbs(group.bulbIps, { r, g, b, mode: 'color' });
  }, [sendAll, brightness, group.bulbIps, onUpdateBulbs]);

  const handleScene = useCallback((sceneId) => {
    sendAll((ip) => WizService.setScene(ip, sceneId, brightness));
    onUpdateBulbs(group.bulbIps, { sceneId, mode: 'scene', isOn: true });
  }, [sendAll, brightness, group.bulbIps, onUpdateBulbs]);

  const renderWhiteTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Color Temperature</Text>
          <Text style={[styles.sectionValue, { color: kelvinToHex(temp) }]}>{temp}K · {tempToLabel(temp)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={TEMP_MIN}
          maximumValue={TEMP_MAX}
          value={temp}
          onValueChange={(v) => setTempState(Math.round(v))}
          onSlidingComplete={(v) => handleColorTemp(Math.round(v))}
          minimumTrackTintColor={kelvinToHex(temp)}
          maximumTrackTintColor="#2a2a3a"
          thumbTintColor="#fff"
        />
        <View style={styles.tempLabels}>
          <Text style={styles.tempLabel}>🕯 Warm</Text>
          <Text style={styles.tempLabel}>Daylight ☀️</Text>
        </View>
        <View style={styles.presetRow}>
          {[2700, 3500, 4000, 5000, 6500].map((k) => (
            <TouchableOpacity key={k} style={[styles.presetBtn, temp === k && styles.presetBtnActive]} onPress={() => handleColorTemp(k)}>
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
      <ColorWheel color={color} onColorChange={handleColor} style={styles.colorWheel} />
      <View style={styles.colorPreviewRow}>
        <View style={[styles.colorPreview, { backgroundColor: rgbToHex(color.r, color.g, color.b) }]} />
        <Text style={styles.colorHex}>{rgbToHex(color.r, color.g, color.b).toUpperCase()}</Text>
        <Text style={styles.colorRgb}>R {color.r} · G {color.g} · B {color.b}</Text>
      </View>
      <View style={styles.swatchRow}>
        {[[255, 60, 60], [255, 140, 0], [255, 220, 0], [60, 200, 80], [60, 140, 255], [140, 60, 255], [255, 60, 180], [255, 255, 255]].map(([r, g, b]) => (
          <TouchableOpacity
            key={`${r}-${g}-${b}`}
            style={[styles.swatch, { backgroundColor: rgbToHex(r, g, b) }, color.r === r && color.g === g && color.b === b && styles.swatchSelected]}
            onPress={() => handleColor(r, g, b)}
          />
        ))}
      </View>
    </View>
  );

  const renderScenesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sceneGrid}>
        {WIZ_SCENES.map((scene) => (
          <TouchableOpacity key={scene.id} style={styles.sceneBtn} onPress={() => handleScene(scene.id)}>
            <Text style={styles.sceneEmoji}>{scene.emoji}</Text>
            <Text style={styles.sceneName}>{scene.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBulbList = () => (
    <View style={styles.bulbList}>
      <Text style={styles.bulbListTitle}>BULBS IN GROUP</Text>
      {groupBulbs.map((b) => (
        <View key={b.ip} style={styles.bulbRow}>
          <Text style={styles.bulbRowIcon}>{b.isOn ? '💡' : '🔌'}</Text>
          <View style={styles.bulbRowInfo}>
            <Text style={styles.bulbRowName}>{b.name}</Text>
            <Text style={styles.bulbRowIp}>{b.ip}</Text>
          </View>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => {
              Alert.alert('Remove from group', `Remove "${b.name}" from "${group.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => onRemoveBulb(group.id, b.ip) },
              ]);
            }}
          >
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.deleteGroupBtn}
        onPress={() => {
          Alert.alert('Delete Group', `Delete "${group.name}"? Bulbs will return to the home screen.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { onDeleteGroup(group.id); navigation.goBack(); } },
          ]);
        }}
      >
        <Text style={styles.deleteGroupText}>🗑 Delete Group</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
      <View style={styles.glowHeader}>
        <View style={[styles.glowBlob, { backgroundColor: someOn ? lightColor : '#111' }]} />
        <View style={styles.headerContent}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupSubtitle}>
            {groupBulbs.length} bulb{groupBulbs.length !== 1 ? 's' : ''} · {someOn ? `${groupBulbs.filter(b => b.isOn).length} on` : 'all off'}
          </Text>
          <TouchableOpacity onPress={() => { setRenameText(group.name); setRenameVisible(true); }} style={styles.renameBtn}>
            <Text style={styles.renameBtnText}>✏️ Rename</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.powerRow}>
          <Text style={styles.powerLabel}>{allOn ? 'ALL ON' : someOn ? 'SOME ON' : 'OFF'}</Text>
          <Switch
            value={allOn}
            onValueChange={toggleAll}
            trackColor={{ false: '#2a2a3a', true: lightColor + '99' }}
            thumbColor={allOn ? lightColor : '#555'}
            ios_backgroundColor="#2a2a3a"
          />
        </View>
      </View>

      <View style={[styles.brightnessSection, !someOn && styles.dimmed]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Brightness</Text>
          <Text style={[styles.sectionValue, { color: lightColor }]}>{brightness}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={100}
          step={1}
          value={brightness}
          onValueChange={setBrightnessState}
          onSlidingComplete={handleBrightness}
          minimumTrackTintColor={lightColor}
          maximumTrackTintColor="#2a2a3a"
          thumbTintColor={lightColor}
          disabled={!someOn}
        />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={[styles.tabIndicator, { backgroundColor: lightColor }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'White' && renderWhiteTab()}
        {activeTab === 'Color' && renderColorTab()}
        {activeTab === 'Scenes' && renderScenesTab()}
        {renderBulbList()}
      </ScrollView>

      <Modal visible={renameVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename Group</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              placeholderTextColor="#555"
              placeholder="Group name"
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
                  try { await onRenameGroup(group.id, trimmed); } catch { }
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
  groupName: { color: '#f0f0ff', fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  groupSubtitle: { color: '#555', fontSize: 13, marginTop: 2 },
  renameBtn: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#1e1e3a', borderRadius: 10, borderWidth: 1, borderColor: '#3a3a6a' },
  renameBtnText: { color: '#8080ff', fontSize: 12, fontWeight: '500' },
  powerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  powerLabel: { color: '#888', fontSize: 12, fontWeight: '600', letterSpacing: 1.5 },
  brightnessSection: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#0e0e22', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1e1e3a' },
  dimmed: { opacity: 0.4 },
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
  tempLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  tempLabel: { color: '#555', fontSize: 12 },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
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
  sceneEmoji: { fontSize: 22 },
  sceneName: { color: '#888', fontSize: 11, textAlign: 'center', fontWeight: '500' },
  bulbList: { padding: 20, paddingTop: 0 },
  bulbListTitle: { color: '#444', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 10 },
  bulbRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#12122a', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a4a' },
  bulbRowIcon: { fontSize: 18 },
  bulbRowInfo: { flex: 1 },
  bulbRowName: { color: '#f0f0ff', fontSize: 14, fontWeight: '500' },
  bulbRowIp: { color: '#555', fontSize: 11, fontFamily: 'Courier New' },
  removeBtn: { padding: 6, backgroundColor: '#2a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#5a2a2a' },
  removeBtnText: { color: '#ff6060', fontSize: 12, fontWeight: '600' },
  deleteGroupBtn: { marginTop: 16, padding: 14, backgroundColor: '#1a0a0a', borderRadius: 14, borderWidth: 1, borderColor: '#5a1a1a', alignItems: 'center' },
  deleteGroupText: { color: '#ff4444', fontSize: 14, fontWeight: '600' },
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