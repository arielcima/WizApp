import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Switch,
} from 'react-native';
import { kelvinToHex, rgbToHex } from '../utils/colorUtils';

export default function BulbCard({ bulb, onToggle, onPress }) {
  const lightColor =
    bulb.mode === 'color'
      ? rgbToHex(bulb.r, bulb.g, bulb.b)
      : kelvinToHex(bulb.temp || 4000);

  const signalBars = bulb.rssi
    ? bulb.rssi > -50 ? 3 : bulb.rssi > -70 ? 2 : 1
    : 1;

  return (
    <TouchableOpacity
      style={[styles.card, !bulb.isOn && styles.cardOff]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Glow effect when on */}
      {bulb.isOn && (
        <View
          style={[
            styles.glow,
            { backgroundColor: lightColor, opacity: 0.12 },
          ]}
        />
      )}

      <View style={styles.row}>
        {/* Bulb icon */}
        <View style={[styles.iconWrap, bulb.isOn && { backgroundColor: lightColor + '33' }]}>
          <View style={[styles.bulbDot, { backgroundColor: bulb.isOn ? lightColor : '#333' }]} />
          <Text style={styles.bulbIcon}>{bulb.isOn ? '💡' : '🔌'}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {bulb.name}
          </Text>
          <Text style={styles.ip}>{bulb.ip}</Text>
          <View style={styles.statusRow}>
            {bulb.isOn && (
              <Text style={[styles.statusBadge, { color: lightColor }]}>
                {bulb.brightness}% · {bulb.mode === 'color' ? 'Color' : `${bulb.temp}K`}
              </Text>
            )}
            {!bulb.isOn && (
              <Text style={styles.offLabel}>OFF</Text>
            )}
            {/* Signal bars */}
            <View style={styles.signal}>
              {[1, 2, 3].map((bar) => (
                <View
                  key={bar}
                  style={[
                    styles.bar,
                    { height: bar * 5 + 2 },
                    bar <= signalBars ? styles.barActive : styles.barInactive,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Toggle */}
        <Switch
          value={bulb.isOn}
          onValueChange={onToggle}
          trackColor={{ false: '#2a2a3a', true: lightColor + '88' }}
          thumbColor={bulb.isOn ? lightColor : '#555'}
          ios_backgroundColor="#2a2a3a"
        />
      </View>

      {/* Brightness bar */}
      {bulb.isOn && (
        <View style={styles.brightnessBar}>
          <View
            style={[
              styles.brightnessProgress,
              {
                width: `${bulb.brightness}%`,
                backgroundColor: lightColor,
              },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12122a',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    overflow: 'hidden',
  },
  cardOff: {
    opacity: 0.6,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1e1e3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulbDot: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    opacity: 0.3,
  },
  bulbIcon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: '#f0f0ff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  ip: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'Courier New',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  offLabel: {
    color: '#444',
    fontSize: 12,
    letterSpacing: 1,
  },
  signal: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: 'auto',
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  barActive: {
    backgroundColor: '#5a8',
  },
  barInactive: {
    backgroundColor: '#333',
  },
  brightnessBar: {
    height: 3,
    backgroundColor: '#1e1e3a',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  brightnessProgress: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.7,
  },
});
