// ======================== AUDIO ENGINE ========================
let audioContext: AudioContext | null = null;
import * as C from '../constants';

export const initAudio = () => {
    if (!audioContext && typeof window !== 'undefined') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
};

const playSound = (frequency: number, type: OscillatorType, volume: number, duration: number, delay: number = 0) => {
    if (!audioContext) return;
    setTimeout(() => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }, delay);
};

export const sounds = {
    paddleHit: () => playSound(440, 'square', 0.08, 0.1),
    paddleCrit: () => {
        playSound(880, 'sawtooth', 0.12, 0.15);
        playSound(1320, 'sawtooth', 0.1, 0.2);
    },
    wallHit: () => playSound(220, 'sine', 0.06, 0.1),
    explosion: () => {
        if (!audioContext) return;
        // Low-frequency boom
        const boomOsc = audioContext.createOscillator();
        const boomGain = audioContext.createGain();
        boomOsc.connect(boomGain);
        boomGain.connect(audioContext.destination);
        boomOsc.type = 'triangle';
        boomGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        boomOsc.frequency.setValueAtTime(120, audioContext.currentTime);
        boomOsc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.4);
        boomGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        boomOsc.start();
        boomOsc.stop(audioContext.currentTime + 0.4);

        // White noise "crash"
        const bufferSize = audioContext.sampleRate * 0.3; // 0.3 seconds
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.8;
        }
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.25, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        noiseSource.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseSource.start();
    },
    score: () => {
        playSound(523.25, 'triangle', 0.18, 0.1);
        playSound(659.25, 'triangle', 0.18, 0.15, 100);
        playSound(783.99, 'triangle', 0.18, 0.2, 200);
    },
    augmentSelect: () => playSound(600, 'sine', 0.15, 0.4),
    augmentConfirm: () => playSound(800, 'square', 0.18, 0.1),
    augmentReroll: () => {
        playSound(600, 'sine', 0.1, 0.05);
        playSound(500, 'sine', 0.1, 0.1, 50);
    },
    fireball: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'sawtooth';
        g.gain.setValueAtTime(0.2, audioContext.currentTime);
        o.frequency.setValueAtTime(200, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        o.start();
        o.stop(audioContext.currentTime + 0.3);
    },
    shrinkRay: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'sawtooth';
        g.gain.setValueAtTime(0.15, audioContext.currentTime);
        o.frequency.setValueAtTime(1500, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.4);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        o.start();
        o.stop(audioContext.currentTime + 0.4);
    },
    chainLightning: () => {
         if (!audioContext) return;
        const bufferSize = audioContext.sampleRate * 0.2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 0.6 - 0.3;
        }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.1;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start();
    },
    stickyAttach: () => playSound(150, 'sine', 0.2, 0.05),
    stickyRelease: () => playSound(300, 'square', 0.15, 0.1),
    curveball: () => {
        playSound(300, 'sine', 0.1, 0.1);
        playSound(900, 'sine', 0.1, 0.1, 50);
    },
    stalemateReset: () => {
        playSound(500, 'sawtooth', 0.15, 0.1);
        playSound(300, 'sawtooth', 0.15, 0.2, 100);
    },
    blackHoleActivate: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'sawtooth';
        g.gain.setValueAtTime(0.25, audioContext.currentTime);
        o.frequency.setValueAtTime(150, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.8);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
        o.start();
        o.stop(audioContext.currentTime + 0.8);
    },
    whiteHoleActivate: () => {
        if (!audioContext) return;
        // Rising sine wave
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'sine';
        g.gain.setValueAtTime(0.2, audioContext.currentTime);
        o.frequency.setValueAtTime(100, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.6);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
        o.start();
        o.stop(audioContext.currentTime + 0.6);

        // White noise "burst"
        const bufferSize = audioContext.sampleRate * 0.4;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.15, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        noiseSource.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseSource.start();
    },
    wormholeTeleport: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(1600, audioContext.currentTime + 0.1);
        o.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);
        g.gain.setValueAtTime(0.15, audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        o.start();
        o.stop(audioContext.currentTime + 0.2);
    },
    kiAuraTeleport: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(800, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(2400, audioContext.currentTime + 0.08);
        g.gain.setValueAtTime(0.1, audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
        o.start();
        o.stop(audioContext.currentTime + 0.08);
    },
    aimbotActivate: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'sine';
        g.gain.setValueAtTime(0.2, audioContext.currentTime);
        o.frequency.setValueAtTime(800, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        o.start();
        o.stop(audioContext.currentTime + 0.15);
    },
    aimbotHit: () => playSound(1000, 'square', 0.1, 0.08),
    aimbotDeactivate: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'sawtooth';
        g.gain.setValueAtTime(0.15, audioContext.currentTime);
        o.frequency.setValueAtTime(500, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        o.start();
        o.stop(audioContext.currentTime + 0.3);
    },
    wallSpawn: () => {
        if (!audioContext) return;
        // Low-frequency "thump"
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1);
        g1.connect(audioContext.destination);
        o1.type = 'sine';
        o1.frequency.setValueAtTime(100, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
        g1.gain.setValueAtTime(0.2, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        o1.start();
        o1.stop(audioContext.currentTime + 0.15);
        // Metallic "click"
        playSound(1200, 'square', 0.08, 0.05, 50);
    },
    wallBlock: () => {
        if (!audioContext) return;
        // Sharp "crack"
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1);
        g1.connect(audioContext.destination);
        o1.type = 'triangle';
        o1.frequency.setValueAtTime(800, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        g1.gain.setValueAtTime(0.15, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        o1.start();
        o1.stop(audioContext.currentTime + 0.1);
        // Low-frequency impact
        playSound(150, 'sine', 0.1, 0.1);
    },
    wallPassThrough: () => playSound(1500, 'sine', 0.05, 0.2),
    wallBreak: () => {
        if (!audioContext) return;
        // Glass shattering effect
        playSound(2000, 'square', 0.1, 0.05);
        playSound(1500, 'square', 0.1, 0.1, 30);
        playSound(2500, 'square', 0.08, 0.08, 60);
    },
    wallReactivate: () => {
        if (!audioContext) return;
        // Rising sine wave for "power up"
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1);
        g1.connect(audioContext.destination);
        o1.type = 'sine';
        o1.frequency.setValueAtTime(400, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.3);
        g1.gain.setValueAtTime(0.15, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        o1.start();
        o1.stop(audioContext.currentTime + 0.3);
    },
    vanguardError: () => {
        if (!audioContext) return;
        // Descending square wave "error" sound
        playSound(900, 'square', 0.12, 0.1);
        playSound(600, 'square', 0.12, 0.15, 100);
        // White noise "static" burst
        const bufferSize = audioContext.sampleRate * 0.15;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.3;
        }
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        noiseSource.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseSource.start();
    },
    lastStandActivate: () => {
        if (!audioContext) return;
        // A rising, shimmering sound
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1);
        g1.connect(audioContext.destination);
        o1.type = 'sine';
        o1.frequency.setValueAtTime(400, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.4);
        g1.gain.setValueAtTime(0.15, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        o1.start();
        o1.stop(audioContext.currentTime + 0.4);

        const o2 = audioContext.createOscillator();
        const g2 = audioContext.createGain();
        o2.connect(g2);
        g2.connect(audioContext.destination);
        o2.type = 'sawtooth';
        o2.frequency.setValueAtTime(402, audioContext.currentTime); // Slight detune for shimmer
        o2.frequency.exponentialRampToValueAtTime(1205, audioContext.currentTime + 0.4);
        g2.gain.setValueAtTime(0.1, audioContext.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        o2.start();
        o2.stop(audioContext.currentTime + 0.4);
    },
    lastStandBlock: () => {
        if (!audioContext) return;
        // A deep, resonant "thwump" with a crackle
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1);
        g1.connect(audioContext.destination);
        o1.type = 'triangle';
        o1.frequency.setValueAtTime(300, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
        g1.gain.setValueAtTime(0.25, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        o1.start();
        o1.stop(audioContext.currentTime + 0.2);

        // White noise "crackle"
        const bufferSize = audioContext.sampleRate * 0.15;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.6;
        }
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.2, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        noiseSource.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseSource.start();
    },
    gameOver: () => {
        playSound(440, 'triangle', 0.2, 0.2);
        playSound(330, 'triangle', 0.2, 0.2, 200);
        playSound(220, 'triangle', 0.2, 0.5, 400);
    },
    countdownTick: () => playSound(400, 'square', 0.1, 0.1),
    countdownGo: () => playSound(800, 'triangle', 0.2, 0.2),
    exodiaObliterate: () => {
        if (!audioContext) return;
        // Deep, rising hum
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1);
        g1.connect(audioContext.destination);
        o1.type = 'sawtooth';
        o1.frequency.setValueAtTime(80, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 1.5);
        g1.gain.setValueAtTime(0.3, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
        o1.start();
        o1.stop(audioContext.currentTime + 1.5);
        
        // Shattering crash after 1 second
        setTimeout(() => {
            if (!audioContext) return;
            const bufferSize = audioContext.sampleRate * 0.5;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1);
            }
            const noiseSource = audioContext.createBufferSource();
            noiseSource.buffer = buffer;
            const noiseGain = audioContext.createGain();
            noiseGain.gain.setValueAtTime(0.4, audioContext.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
            noiseSource.connect(noiseGain);
            noiseGain.connect(audioContext.destination);
            noiseSource.start();
        }, 1000);
    },
    dragonballWish: () => {
        playSound(200, 'sine', 0.2, 0.5);
        playSound(300, 'sine', 0.2, 0.4, 100);
        playSound(400, 'sine', 0.2, 0.3, 200);
        playSound(500, 'sine', 0.3, 1.0, 300);
    },
    exodiaLaserCharge: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'sawtooth';
        g.gain.setValueAtTime(0.001, audioContext.currentTime);
        o.frequency.setValueAtTime(100, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + C.EXODIA_LASER_CHARGE_TIME_MS / 1000);
        g.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + C.EXODIA_LASER_CHARGE_TIME_MS / 1000);
        o.start();
        o.stop(audioContext.currentTime + C.EXODIA_LASER_CHARGE_TIME_MS / 1000);
    },
    exodiaLaserFire: () => {
        if (!audioContext) return;
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1); g1.connect(audioContext.destination);
        o1.type = 'triangle';
        o1.frequency.setValueAtTime(200, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
        g1.gain.setValueAtTime(0.3, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        o1.start(); o1.stop(audioContext.currentTime + 0.3);

        const bufferSize = audioContext.sampleRate * 0.2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.7;
        }
        const noise = audioContext.createBufferSource(); noise.buffer = buffer;
        const noiseGain = audioContext.createGain(); noise.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseGain.gain.setValueAtTime(0.2, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        noise.start();
    },
    exodiaLaserHit: () => {
        playSound(1500, 'square', 0.15, 0.05);
        playSound(2500, 'square', 0.1, 0.1, 30);
    },
    kamehamehaCharge: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g);
        g.connect(audioContext.destination);
        o.type = 'triangle';
        g.gain.setValueAtTime(0.001, audioContext.currentTime);
        o.frequency.setValueAtTime(200, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 1.2);
        g.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 1.2);
        o.start();
        o.stop(audioContext.currentTime + 1.2);
    },
    kamehamehaFire: () => {
        if (!audioContext) return;
        // Deep, powerful blast
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1); g1.connect(audioContext.destination);
        o1.type = 'sawtooth';
        o1.frequency.setValueAtTime(300, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.5);
        g1.gain.setValueAtTime(0.35, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        o1.start(); o1.stop(audioContext.currentTime + 0.5);

        // Noise component for crackle
        const bufferSize = audioContext.sampleRate * 0.3;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.8;
        }
        const noise = audioContext.createBufferSource(); noise.buffer = buffer;
        const noiseGain = audioContext.createGain(); noise.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseGain.gain.setValueAtTime(0.25, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        noise.start();
    },
    shenronsBarrierActivate: () => {
        if (!audioContext) return;
        // A rising, shimmering sound, like a forcefield activating
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1); g1.connect(audioContext.destination);
        o1.type = 'sine';
        o1.frequency.setValueAtTime(300, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.4);
        g1.gain.setValueAtTime(0.2, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        o1.start(); o1.stop(audioContext.currentTime + 0.4);

        const o2 = audioContext.createOscillator();
        const g2 = audioContext.createGain();
        o2.connect(g2);
        g2.connect(audioContext.destination);
        o2.type = 'sine';
        o2.frequency.setValueAtTime(302, audioContext.currentTime); // Slight detune for shimmer
        o2.frequency.exponentialRampToValueAtTime(1005, audioContext.currentTime + 0.4);
        g2.gain.setValueAtTime(0.15, audioContext.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        o2.start();
        o2.stop(audioContext.currentTime + 0.4);
    },
    shenronsBarrierBlock: () => {
        if (!audioContext) return;
        // Deep, resonant "thwump"
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1);
        g1.connect(audioContext.destination);
        o1.type = 'triangle';
        o1.frequency.setValueAtTime(250, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.15);
        g1.gain.setValueAtTime(0.25, audioContext.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        o1.start();
        o1.stop(audioContext.currentTime + 0.15);

        // Energetic "crackle"
        const bufferSize = audioContext.sampleRate * 0.1;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noiseSource.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseGain.gain.setValueAtTime(0.15, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        noiseSource.start();
    },
    shenronSummon: () => {
        if (!audioContext) return;
        const o1 = audioContext.createOscillator();
        const g1 = audioContext.createGain();
        o1.connect(g1); g1.connect(audioContext.destination);
        o1.type = 'sawtooth';
        o1.frequency.setValueAtTime(60, audioContext.currentTime);
        o1.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 2.0);
        g1.gain.setValueAtTime(0.01, audioContext.currentTime);
        g1.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 1.5);
        g1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.5);
        o1.start();
        o1.stop(audioContext.currentTime + 2.5);
    },
    dragonballGather: () => {
        if (!audioContext) return;
        const o = audioContext.createOscillator();
        const g = audioContext.createGain();
        o.connect(g); g.connect(audioContext.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(400, audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 1.0);
        g.gain.setValueAtTime(0.2, audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.0);
        o.start();
        o.stop(audioContext.currentTime + 1.0);
    },
    dragonballScatterWhoosh: () => {
        if (!audioContext) return;
        const bufferSize = audioContext.sampleRate * 0.2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1);
        }
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.15, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        noiseSource.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseSource.start();
    }
};

export type Sounds = typeof sounds;
// =============================================================