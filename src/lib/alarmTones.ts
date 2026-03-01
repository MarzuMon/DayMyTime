// Web Audio API tone generator for alarm previews
const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

type ToneType = 'default' | 'chime' | 'bell' | 'alarm' | 'gentle' | 'urgent' | 'melody' | 'digital' | 'nature' | 'piano' | 'none';

interface ToneConfig {
  frequencies: number[];
  duration: number;
  type: OscillatorType;
  pattern: 'single' | 'repeat' | 'ascending' | 'descending' | 'arpeggio';
  gain: number;
}

const TONE_CONFIGS: Record<ToneType, ToneConfig> = {
  default: { frequencies: [523, 659, 784], duration: 0.15, type: 'sine', pattern: 'ascending', gain: 0.3 },
  chime: { frequencies: [880, 1108, 1320], duration: 0.25, type: 'sine', pattern: 'ascending', gain: 0.2 },
  bell: { frequencies: [440, 554, 660], duration: 0.4, type: 'triangle', pattern: 'single', gain: 0.25 },
  alarm: { frequencies: [800, 600], duration: 0.12, type: 'square', pattern: 'repeat', gain: 0.15 },
  gentle: { frequencies: [396, 528], duration: 0.5, type: 'sine', pattern: 'ascending', gain: 0.15 },
  urgent: { frequencies: [1000, 700, 1000, 700], duration: 0.08, type: 'sawtooth', pattern: 'repeat', gain: 0.12 },
  melody: { frequencies: [523, 587, 659, 784, 880], duration: 0.2, type: 'sine', pattern: 'arpeggio', gain: 0.25 },
  digital: { frequencies: [1200, 900, 1200], duration: 0.06, type: 'square', pattern: 'repeat', gain: 0.1 },
  nature: { frequencies: [320, 400, 480, 520], duration: 0.35, type: 'sine', pattern: 'descending', gain: 0.18 },
  piano: { frequencies: [262, 330, 392, 523], duration: 0.3, type: 'triangle', pattern: 'arpeggio', gain: 0.22 },
  none: { frequencies: [], duration: 0, type: 'sine', pattern: 'single', gain: 0 },
};

let currentSource: { stop: () => void } | null = null;

export function playAlarmTone(tone: string): void {
  stopAlarmTone();

  const config = TONE_CONFIGS[tone as ToneType];
  if (!config || config.frequencies.length === 0) return;

  try {
    const ctx = audioCtx();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = config.gain;

    const oscillators: OscillatorNode[] = [];
    let time = ctx.currentTime;

    config.frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = config.type;
      osc.frequency.value = freq;
      osc.connect(gainNode);

      const gap = config.pattern === 'arpeggio' ? 0.12 : 0.05;
      const startTime = time + i * (config.duration + gap);
      const endTime = startTime + config.duration;

      // Add vibrato for nature tone
      if (tone === 'nature') {
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibrato.frequency.value = 5;
        vibratoGain.gain.value = 8;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(startTime);
        vibrato.stop(endTime);
      }

      osc.start(startTime);
      osc.stop(endTime);
      oscillators.push(osc);
    });

    const gap = config.pattern === 'arpeggio' ? 0.12 : 0.05;
    const totalDuration = config.frequencies.length * (config.duration + gap);
    gainNode.gain.setValueAtTime(config.gain, time + totalDuration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, time + totalDuration + 0.1);

    currentSource = {
      stop: () => {
        oscillators.forEach(o => { try { o.stop(); } catch {} });
        ctx.close();
      }
    };

    setTimeout(() => {
      currentSource = null;
      try { ctx.close(); } catch {}
    }, (totalDuration + 0.2) * 1000);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

export function stopAlarmTone(): void {
  if (currentSource) {
    currentSource.stop();
    currentSource = null;
  }
}
