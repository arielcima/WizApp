import { useCallback, useRef, useState } from 'react';
import { loadBulbNames } from '../services/StorageService';
import WizService from '../services/WizService';

export function useBulbs() {
  const [bulbs, setBulbs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  const scan = useCallback(async () => {
    setIsScanning(true);
    setBulbs([]);

    try {
      console.log('Starting scan...');
      const savedNames = await loadBulbNames();
      console.log('Saved names loaded:', savedNames);

      const discovered = await WizService.discoverBulbs((bulb) => {
        console.log('Bulb found during discovery:', bulb.ip);
        setBulbs((prev) => {
          const exists = prev.find((b) => b.ip === bulb.ip);
          if (exists) return prev;
          const name = savedNames[bulb.ip] ?? bulb.name;
          return [...prev, { ...bulb, name }];
        });
      });

      console.log('Discovery finished, found:', discovered.length, 'bulbs');

      await Promise.all(
        discovered.map(async (bulb) => {
          console.log('Fetching state for:', bulb.ip);
          const state = await WizService.getPilot(bulb.ip);
          console.log('State for', bulb.ip, ':', JSON.stringify(state));
          if (!state) return;
          setBulbs((prev) =>
            prev.map((b) =>
              b.ip === bulb.ip
                ? {
                    ...b,
                    isOn: state.state ?? false,
                    brightness: state.dimming ?? 100,
                    temp: state.temp ?? 4000,
                    r: state.r ?? 255,
                    g: state.g ?? 255,
                    b: state.b ?? 255,
                    mode: state.r != null ? 'color' : 'white',
                    sceneId: state.sceneId ?? null,
                  }
                : b
            )
          );
        })
      );
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsScanning(false);
      setLastScan(new Date());
    }
  }, []);

  const updateBulb = useCallback((ip, updates) => {
    setBulbs((prev) =>
      prev.map((b) => (b.ip === ip ? { ...b, ...updates } : b))
    );
  }, []);

  return { bulbs, isScanning, lastScan, scan, updateBulb };
}

export function useBulbControl(bulb, updateBulb) {
  const debounceRef = useRef(null);

  const toggle = useCallback(async () => {
    const newState = !bulb.isOn;
    updateBulb(bulb.ip, { isOn: newState });
    await WizService.togglePower(bulb.ip, newState);
  }, [bulb.ip, bulb.isOn, updateBulb]);

  const setBrightness = useCallback(
    (value) => {
      updateBulb(bulb.ip, { brightness: value });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        WizService.setBrightness(bulb.ip, value);
      }, 150);
    },
    [bulb.ip, updateBulb]
  );

  const setColorTemp = useCallback(
    (temp) => {
      updateBulb(bulb.ip, { temp, mode: 'white' });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        WizService.setColorTemp(bulb.ip, temp, bulb.brightness);
      }, 150);
    },
    [bulb.ip, bulb.brightness, updateBulb]
  );

  const setColor = useCallback(
    (r, g, b) => {
      updateBulb(bulb.ip, { r, g, b, mode: 'color' });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        WizService.setColor(bulb.ip, r, g, b, bulb.brightness);
      }, 150);
    },
    [bulb.ip, bulb.brightness, updateBulb]
  );

  const setScene = useCallback(
    async (sceneId) => {
      updateBulb(bulb.ip, { sceneId, mode: 'scene', isOn: true });
      await WizService.setScene(bulb.ip, sceneId, bulb.brightness);
    },
    [bulb.ip, bulb.brightness, updateBulb]
  );

  return { toggle, setBrightness, setColorTemp, setColor, setScene };
}