import React from 'react';
import { PlayerID } from '../../types';
import * as C from '../../constants';

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    decay: number;
}

export interface ExplosionCore {
    id: number;
    x: number;
    y: number;
    life: number; // in seconds
    startTime: number; // performance.now() timestamp
    maxRadius: number;
    rotation: number;
    scorerId: PlayerID;
}

export const createExplosion = (particlesRef: React.MutableRefObject<Particle[]>, x: number, y: number, color: string, count: number = 20, ballSpeed: number = C.INITIAL_BALL_SPEED) => {
    const speedRatio = Math.min(2, Math.max(0, (ballSpeed - C.INITIAL_BALL_SPEED) / (C.INITIAL_BALL_SPEED * 5)));
    const scale = 0.4 + speedRatio * 0.8;
    const particleCount = Math.floor(count * scale);

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const particleSpeed = (Math.random() * 2 + 1) * scale;
        const radius = (Math.random() * 1.0 + 0.5) * scale;
        particlesRef.current.push({ x, y, vx: Math.cos(angle) * particleSpeed, vy: Math.sin(angle) * particleSpeed, radius, color, life: 1, decay: Math.random() * 0.5 + 0.5 });
    }
};

export const createGoalExplosionParticles = (particlesRef: React.MutableRefObject<Particle[]>, x: number, y: number, scorerId: PlayerID, count: number = 100, ballSpeed: number = C.INITIAL_BALL_SPEED) => {
    const p1Colors = ['#22d3ee', '#818cf8', '#a78bfa', '#c084fc', '#e0e7ff'];
    const p2Colors = ['#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#ffff99'];
    const explosionColors = scorerId === 'player1' ? p1Colors : p2Colors;
    
    const speedRatio = Math.min(2.5, Math.max(0, (ballSpeed - C.INITIAL_BALL_SPEED) / (C.INITIAL_BALL_SPEED * 4)));
    const scale = 0.5 + speedRatio * 2.0;
    const particleCount = Math.floor(count * scale);

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const particleSpeed = (Math.random() * 3 + 1) * scale;
        const radius = (Math.random() * 1.5 + 0.8) * scale;
        particlesRef.current.push({ x, y, vx: Math.cos(angle) * particleSpeed, vy: Math.sin(angle) * particleSpeed, radius, color: explosionColors[Math.floor(Math.random() * explosionColors.length)], life: 1.5, decay: Math.random() * 0.4 + 0.3 });
    }
};

export const createGoalFountains = (particlesRef: React.MutableRefObject<Particle[]>, scorerId: PlayerID) => {
    const p1Colors = ['#22d3ee', '#818cf8', '#a78bfa', '#c084fc'];
    const p2Colors = ['#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000'];
    const fountainColors = scorerId === 'player1' ? p1Colors : p2Colors;
    
    const particleCount = 300;
    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * C.CANVAS_WIDTH;
        particlesRef.current.push({ x, y: 0, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() * 3) + 1, radius: Math.random() * 2 + 1, color: fountainColors[Math.floor(Math.random() * fountainColors.length)], life: 0.7, decay: 1.2 });
        particlesRef.current.push({ x, y: C.CANVAS_HEIGHT, vx: (Math.random() - 0.5) * 1.5, vy: -((Math.random() * 3) + 1), radius: Math.random() * 2 + 1, color: fountainColors[Math.floor(Math.random() * fountainColors.length)], life: 0.7, decay: 1.2 });
    }
};

export const createImplosion = (particlesRef: React.MutableRefObject<Particle[]>, x: number, y: number, color: string, count: number = 30) => {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const startDist = Math.random() * 40 + 30;
        const speed = Math.random() * 2 + 1.5;
        particlesRef.current.push({ x: x + Math.cos(angle) * startDist, y: y + Math.sin(angle) * startDist, vx: -Math.cos(angle) * speed, vy: -Math.sin(angle) * speed, radius: Math.random() * 1.5 + 1, color, life: 0.6, decay: 1 });
    }
};
