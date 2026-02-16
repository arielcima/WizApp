import UdpSocket from 'react-native-udp';
import NetInfo from '@react-native-community/netinfo';

const WIZ_PORT = 38899;
const DISCOVERY_TIMEOUT = 3000;
const COMMAND_TIMEOUT = 2000;

class WizService {
  constructor() {
    this.discoveredBulbs = new Map();
    this.listeners = new Set();
  }

  // ─── Utility ────────────────────────────────────────────────────────────────

  async getLocalIP() {
    const info = await NetInfo.fetch();
    return info?.details?.ipAddress || null;
  }

  getBroadcastAddress(ip) {
    if (!ip) return '255.255.255.255';
    const parts = ip.split('.');
    parts[3] = '255';
    return parts.join('.');
  }

  generateMac() {
    return 'AABBCCDDEEFF';
  }

  // ─── Core UDP Send/Receive ───────────────────────────────────────────────────

  sendCommand(ip, payload) {
    return new Promise((resolve, reject) => {
      const socket = UdpSocket.createSocket({ type: 'udp4', debug: false });
      const message = JSON.stringify(payload);
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.close();
          reject(new Error('Command timeout'));
        }
      }, COMMAND_TIMEOUT);

      socket.on('message', (data) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          socket.close();
          try {
            resolve(JSON.parse(data.toString()));
          } catch {
            resolve(null);
          }
        }
      });

      socket.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          socket.close();
          reject(err);
        }
      });

      socket.bind(0, () => {
        socket.send(message, 0, message.length, WIZ_PORT, ip, (err) => {
          if (err && !resolved) {
            resolved = true;
            clearTimeout(timer);
            socket.close();
            reject(err);
          }
        });
      });
    });
  }

  // ─── Discovery ───────────────────────────────────────────────────────────────

  async discoverBulbs(onBulbFound) {
    const localIP = await this.getLocalIP();
    const broadcastAddr = this.getBroadcastAddress(localIP);
    const found = new Map();

    return new Promise((resolve) => {
      const socket = UdpSocket.createSocket({ type: 'udp4', debug: false });

      socket.on('message', (data, rinfo) => {
        try {
          const response = JSON.parse(data.toString());
          const ip = rinfo.address;

          if (response.method === 'registration' || response.result) {
            if (!found.has(ip)) {
              const bulb = {
                ip,
                id: ip,
                name: `WiZ Bulb (${ip.split('.').pop()})`,
                isOn: response.result?.state ?? false,
                brightness: response.result?.dimming ?? 100,
                temp: response.result?.temp ?? 4000,
                r: response.result?.r ?? 255,
                g: response.result?.g ?? 255,
                b: response.result?.b ?? 255,
                mode: response.result?.temp ? 'white' : 'color',
                rssi: response.result?.rssi ?? -60,
              };
              found.set(ip, bulb);
              if (onBulbFound) onBulbFound(bulb);
            }
          }
        } catch (_) {}
      });

      socket.on('error', () => {});

      socket.bind(0, () => {
        socket.setBroadcast(true);

        const registrationMsg = JSON.stringify({
          method: 'registration',
          params: {
            phonemac: this.generateMac(),
            register: true,
            phoneip: localIP || '0.0.0.0',
            id: 1,
          },
        });

        socket.send(
          registrationMsg,
          0,
          registrationMsg.length,
          WIZ_PORT,
          broadcastAddr,
          () => {}
        );
      });

      setTimeout(() => {
        try { socket.close(); } catch (_) {}
        resolve(Array.from(found.values()));
      }, DISCOVERY_TIMEOUT);
    });
  }

  // ─── Bulb State ──────────────────────────────────────────────────────────────

  async getPilot(ip) {
    try {
      const response = await this.sendCommand(ip, {
        method: 'getPilot',
        params: {},
      });
      return response?.result ?? null;
    } catch {
      return null;
    }
  }

  async setPilot(ip, params) {
    try {
      const response = await this.sendCommand(ip, {
        method: 'setPilot',
        params,
      });
      return response?.result?.success === true;
    } catch {
      return false;
    }
  }

  // ─── Controls ────────────────────────────────────────────────────────────────

  async togglePower(ip, isOn) {
    return this.setPilot(ip, { state: isOn });
  }

  async setBrightness(ip, brightness) {
    const clamped = Math.max(10, Math.min(100, Math.round(brightness)));
    return this.setPilot(ip, { dimming: clamped });
  }

  async setColorTemp(ip, temp, brightness) {
    const clampedTemp = Math.max(2200, Math.min(6500, Math.round(temp)));
    const clampedBri = Math.max(10, Math.min(100, Math.round(brightness)));
    return this.setPilot(ip, {
      temp: clampedTemp,
      dimming: clampedBri,
      r: undefined,
      g: undefined,
      b: undefined,
    });
  }

  async setColor(ip, r, g, b, brightness) {
    return this.setPilot(ip, {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
      dimming: Math.max(10, Math.min(100, Math.round(brightness))),
    });
  }

  async setScene(ip, sceneId, brightness) {
    return this.setPilot(ip, {
      sceneId,
      dimming: Math.max(10, Math.min(100, Math.round(brightness))),
    });
  }
}

export default new WizService();

// ─── WiZ Scene IDs ────────────────────────────────────────────────────────────
export const WIZ_SCENES = [
  { id: 1,  name: 'Ocean',       emoji: '🌊' },
  { id: 2,  name: 'Romance',     emoji: '❤️' },
  { id: 3,  name: 'Sunset',      emoji: '🌅' },
  { id: 4,  name: 'Party',       emoji: '🎉' },
  { id: 5,  name: 'Fireplace',   emoji: '🔥' },
  { id: 6,  name: 'Cozy',        emoji: '🛋️' },
  { id: 7,  name: 'Forest',      emoji: '🌲' },
  { id: 8,  name: 'Pastel',      emoji: '🎨' },
  { id: 9,  name: 'Wakeup',      emoji: '☀️' },
  { id: 10, name: 'Bedtime',     emoji: '🌙' },
  { id: 11, name: 'Warm White',  emoji: '💡' },
  { id: 12, name: 'Daylight',    emoji: '🌤️' },
  { id: 13, name: 'Cool White',  emoji: '❄️' },
  { id: 14, name: 'Night Light', emoji: '🌃' },
  { id: 15, name: 'Focus',       emoji: '🎯' },
  { id: 16, name: 'Relax',       emoji: '😌' },
  { id: 17, name: 'TV Time',     emoji: '📺' },
  { id: 18, name: 'Plantgrowth', emoji: '🌱' },
  { id: 19, name: 'Spring',      emoji: '🌸' },
  { id: 20, name: 'Summer',      emoji: '🌻' },
];
