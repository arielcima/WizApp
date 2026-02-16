import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { kelvinToHex, rgbToHex } from '../utils/colorUtils';

export default function GroupCard({ group, bulbs, onToggleAll, onPress, onLongPress }) {
  const groupBulbs = bulbs.filter((b) => group.bulbIps.includes(b.ip));
  const onCount = groupBulbs.filter((b) => b.isOn).length;
  const allOn = onCount === groupBulbs.length && groupBulbs.length > 0;
  const someOn = onCount > 0;

  const firstOn = groupBulbs.find((b) => b.isOn);
  const lightColor = firstOn
    ? firstOn.mode === 'color'
      ? rgbToHex(firstOn.r, firstOn.g, firstOn.b)
      : kelvinToHex(firstOn.temp || 4000)
    : '#444';

  return (
    <TouchableOpacity
      style={[styles.card, !someOn && styles.cardOff]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      delayLongPress={500}
    >
      {someOn && (
        <View style={[styles.glow, { backgroundColor: lightColor, opacity: 0.1 }]} />
      )}
      <View style={styles.row}>
        <View style={[styles.iconWrap, someOn && { backgroundColor: lightColor + '22' }]}>
          <Text style={styles.icon}>📁</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.count}>
            {groupBulbs.length} bulb{groupBulbs.length !== 1 ? 's' : ''}
            {someOn ? ` · ${onCount} on` : ' · all off'}
          </Text>
          {groupBulbs.length > 0 && (
            <View style={styles.dotsRow}>
              {groupBulbs.map((b) => {
                const c = b.isOn
                  ? b.mode === 'color' ? rgbToHex(b.r, b.g, b.b) : kelvinToHex(b.temp || 4000)
                  : '#333';
                return <View key={b.ip} style={[styles.dot, { backgroundColor: c }]} />;
              })}
            </View>
          )}
        </View>
        <Switch
          value={allOn}
          onValueChange={onToggleAll}
          trackColor={{ false: '#2a2a3a', true: lightColor + '88' }}
          thumbColor={allOn ? lightColor : '#555'}
          ios_backgroundColor="#2a2a3a"
        />
      </View>
      {groupBulbs.length > 0 && (
        <View style={styles.brightnessBar}>
          <View
            style={[styles.brightnessProgress, {
              width: `${(onCount / groupBulbs.length) * 100}%`,
              backgroundColor: lightColor,
            }]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#12122a', borderRadius: 20, padding: 16, marginHorizontal: 16, marginVertical: 6, borderWidth: 1, borderColor: '#3a2a5a', overflow: 'hidden' },
  cardOff: { opacity: 0.6 },
  glow: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#1e1e3a', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  name: { color: '#f0f0ff', fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  count: { color: '#666', fontSize: 12, marginTop: 1 },
  dotsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  brightnessBar: { height: 3, backgroundColor: '#1e1e3a', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  brightnessProgress: { height: '100%', borderRadius: 2, opacity: 0.7 },
});