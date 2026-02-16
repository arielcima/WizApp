import React, { useRef, useCallback } from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  Image,
} from 'react-native';
import { hsvToRgb } from '../utils/colorUtils';

// We render the color wheel as a gradient canvas using raw pixel math.
// Since React Native doesn't have Canvas, we use a pre-built SVG data URI
// approach: a conic gradient + radial fade overlaid.

const SIZE = 260;
const RADIUS = SIZE / 2;
const INNER_RADIUS = 24;

export default function ColorWheel({ color, onColorChange, style }) {
  const containerRef = useRef(null);

  // Convert current color to hue/saturation for indicator position
  const { r = 255, g = 255, b = 255 } = color;
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const d = max - min;

  let hue = 0;
  if (d !== 0) {
    const nr = r / 255, ng = g / 255, nb = b / 255;
    const mx = Math.max(nr, ng, nb);
    if (mx === nr) hue = ((ng - nb) / d) % 6;
    else if (mx === ng) hue = (nb - nr) / d + 2;
    else hue = (nr - ng) / d + 4;
    hue = hue * 60;
    if (hue < 0) hue += 360;
  }
  const sat = max === 0 ? 0 : d / max;

  const indicatorX = RADIUS + sat * RADIUS * Math.cos((hue * Math.PI) / 180);
  const indicatorY = RADIUS - sat * RADIUS * Math.sin((hue * Math.PI) / 180);

  const pickColor = useCallback(
    (pageX, pageY) => {
      containerRef.current?.measure((_x, _y, _w, _h, px, py) => {
        const cx = pageX - px - RADIUS;
        const cy = pageY - py - RADIUS;
        const dist = Math.sqrt(cx * cx + cy * cy);
        if (dist > RADIUS) return;

        const angle = (Math.atan2(-cy, cx) * 180) / Math.PI;
        const h = (angle + 360) % 360;
        const s = Math.min(1, dist / RADIUS);
        const { r: nr, g: ng, b: nb } = hsvToRgb(h, s, 1);
        onColorChange(nr, ng, nb);
      });
    },
    [onColorChange]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => pickColor(e.nativeEvent.pageX, e.nativeEvent.pageY),
      onPanResponderMove: (e) => pickColor(e.nativeEvent.pageX, e.nativeEvent.pageY),
    })
  ).current;

  // Build color stops for conic gradient via SVG
  const svgSize = SIZE;
  const stops = Array.from({ length: 24 }, (_, i) => {
    const h = (i / 24) * 360;
    const { r: sr, g: sg, b: sb } = hsvToRgb(h, 1, 1);
    return `<stop offset="${((i / 24) * 100).toFixed(1)}%" stop-color="rgb(${sr},${sg},${sb})" />`;
  }).join('');

  const svgXml = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}">
      <defs>
        <radialGradient id="sat" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="white" stop-opacity="1"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="hue1" x1="1" y1="0.5" x2="0" y2="0.5">
          ${stops}
        </linearGradient>
      </defs>
      <circle cx="${RADIUS}" cy="${RADIUS}" r="${RADIUS}" fill="url(#hue1)"/>
      <circle cx="${RADIUS}" cy="${RADIUS}" r="${RADIUS}" fill="url(#sat)"/>
      <circle cx="${RADIUS}" cy="${RADIUS}" r="${INNER_RADIUS}" fill="#1a1a2e"/>
    </svg>
  `;

  const base64Svg = `data:image/svg+xml;base64,${btoa(svgXml)}`;

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      {...panResponder.panHandlers}
    >
      <Image
        source={{ uri: base64Svg }}
        style={styles.wheel}
        resizeMode="contain"
      />
      {/* Color indicator dot */}
      <View
        style={[
          styles.indicator,
          {
            left: indicatorX - 12,
            top: indicatorY - 12,
            borderColor: `rgb(${r},${g},${b})`,
            backgroundColor: `rgb(${r},${g},${b})`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  wheel: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
  },
  indicator: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 8,
  },
});
