import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useBulbs } from '../hooks/useWiz';
import { useBulbControl } from '../hooks/useWiz';
import BulbCard from '../components/BulbCard';

function BulbCardWrapper({ bulb, updateBulb, onPress }) {
  const { toggle } = useBulbControl(bulb, updateBulb);
  return (
    <BulbCard
      bulb={bulb}
      onToggle={toggle}
      onPress={() => onPress(bulb)}
    />
  );
}

export default function HomeScreen({ navigation }) {
  const { bulbs, isScanning, lastScan, scan, updateBulb } = useBulbs();

  useEffect(() => {
    scan();
  }, []);

  const handleBulbPress = useCallback(
    (bulb) => {
      navigation.navigate('BulbControl', { bulb, updateBulb });
    },
    [navigation, updateBulb]
  );

  const formatLastScan = () => {
    if (!lastScan) return '';
    const diff = Math.round((Date.now() - lastScan) / 1000);
    if (diff < 60) return `Updated ${diff}s ago`;
    return `Updated ${Math.round(diff / 60)}m ago`;
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      {isScanning ? (
        <>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Scanning network…</Text>
          <Text style={styles.emptySubtitle}>
            Looking for WiZ bulbs on your local network
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyTitle}>No bulbs found</Text>
          <Text style={styles.emptySubtitle}>
            Make sure your WiZ bulbs are powered on{'\n'}and connected to the same Wi-Fi network
          </Text>
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

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>WiZ Control</Text>
          <Text style={styles.subtitle}>
            {bulbs.length > 0
              ? `${bulbs.length} bulb${bulbs.length > 1 ? 's' : ''} found · ${formatLastScan()}`
              : 'Local network control'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.scanBtn, isScanning && styles.scanBtnActive]}
          onPress={scan}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color="#a0a0ff" />
          ) : (
            <Text style={styles.scanBtnText}>↻ Scan</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bulb count pill */}
      {bulbs.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <View style={styles.onDot} />
            <Text style={styles.statText}>
              {bulbs.filter((b) => b.isOn).length} on
            </Text>
          </View>
          <View style={styles.statPill}>
            <View style={[styles.onDot, { backgroundColor: '#444' }]} />
            <Text style={styles.statText}>
              {bulbs.filter((b) => !b.isOn).length} off
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={bulbs}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <BulbCardWrapper
            bulb={item}
            updateBulb={updateBulb}
            onPress={handleBulbPress}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={bulbs.length === 0 ? styles.listEmpty : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={scan}
            tintColor="#a0a0ff"
            colors={['#a0a0ff']}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#f0f0ff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  scanBtn: {
    backgroundColor: '#1a1a3a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3a6a',
    minWidth: 80,
    alignItems: 'center',
  },
  scanBtnActive: {
    borderColor: '#a0a0ff',
  },
  scanBtnText: {
    color: '#a0a0ff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#12122a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  onDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5fa',
  },
  statText: {
    color: '#888',
    fontSize: 12,
  },
  list: {
    paddingBottom: 24,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#f0f0ff',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#555',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 24,
    backgroundColor: '#1e1e4a',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#4a4a9a',
  },
  retryText: {
    color: '#a0a0ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
