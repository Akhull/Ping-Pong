import { GameState } from '../../types';
import * as C from '../../constants';
import { Particle, ExplosionCore } from '../effects';

function drawDragonball(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, starCount: number, alpha: number) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Ball gradient
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, 'rgba(252, 211, 77, 1)'); // yellow-300
    gradient.addColorStop(1, 'rgba(249, 115, 22, 1)'); // orange-500
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Star
    ctx.fillStyle = 'rgba(220, 38, 38, 0.9)'; // red-600
    ctx.shadowColor = 'rgba(220, 38, 38, 0.7)';
    ctx.shadowBlur = 5;
    const starRadius = radius * 0.5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * (Math.PI * 2) - Math.PI / 2;
        const outerX = x + Math.cos(angle) * starRadius;
        const outerY = y + Math.sin(angle) * starRadius;
        ctx.lineTo(outerX, outerY);
        const innerAngle = angle + Math.PI / 5;
        const innerX = x + Math.cos(innerAngle) * (starRadius * 0.4);
        const innerY = y + Math.sin(innerAngle) * (starRadius * 0.4);
        ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    
    // Star Count - simple text for clarity
    // ctx.fillStyle = 'white';
    // ctx.font = 'bold 12px sans-serif';
    // ctx.textAlign = 'center';
    // ctx.textBaseline = 'middle';
    // ctx.fillText(starCount.toString(), x, y);

    ctx.restore();
}

function drawDragonballScatterAnimation(ctx: CanvasRenderingContext2D, gs: GameState, timestamp: number, clockOffset: number) {
    const animation = gs.dragonballScatterAnimation;
    if (!animation || !animation.isActive) return;

    const clientStartTime = animation.startTime - clockOffset;
    const elapsed = timestamp - clientStartTime;
    
    const DURATION = 3500;
    const GATHER_END = 1000;
    const ROTATE_END = 2000;
    const SCATTER_END = DURATION;

    const centerX = C.CANVAS_WIDTH / 2;
    const centerY = C.CANVAS_HEIGHT / 2;
    const circleRadius = 80;
    const ballRadius = 18;

    for (let i = 0; i < 7; i++) {
        let x: number | null = null, y: number | null = null, alpha = 1;

        if (elapsed < GATHER_END) {
            const progress = elapsed / GATHER_END;
            const startAngle = i * (Math.PI / 3.5) + timestamp / 2000;
            const startRadius = C.CANVAS_WIDTH / 2 + 100;
            const startX = centerX + Math.cos(startAngle) * startRadius;
            const startY = centerY + Math.sin(startAngle) * startRadius;

            const endAngle = (i / 7) * Math.PI * 2;
            const endX = centerX + Math.cos(endAngle) * circleRadius;
            const endY = centerY + Math.sin(endAngle) * circleRadius;
            
            const easedProgress = 1 - Math.pow(1 - progress, 5); // EaseOutQuint
            x = startX + (endX - startX) * easedProgress;
            y = startY + (endY - startY) * easedProgress;

        } else if (elapsed < ROTATE_END) {
            const rotationProgress = (elapsed - GATHER_END) / (ROTATE_END - GATHER_END);
            const rotationSpeed = Math.PI * 4; // 2 full rotations
            const angle = (i / 7) * Math.PI * 2 + rotationProgress * rotationSpeed;
            x = centerX + Math.cos(angle) * circleRadius;
            y = centerY + Math.sin(angle) * circleRadius;

        } else if (elapsed < SCATTER_END) {
            const scatterProgress = (elapsed - ROTATE_END) / (SCATTER_END - ROTATE_END);
            const startRotation = (Math.PI * 4);
            const startAngle = (i / 7) * Math.PI * 2 + startRotation;
            const startX = centerX + Math.cos(startAngle) * circleRadius;
            const startY = centerY + Math.sin(startAngle) * circleRadius;
            
            const endAngle = (i / 7) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const endRadius = C.CANVAS_WIDTH * 0.8;
            const endX = centerX + Math.cos(endAngle) * endRadius;
            const endY = centerY + Math.sin(endAngle) * endRadius;

            const easedProgress = scatterProgress * scatterProgress; // EaseInQuad
            x = startX + (endX - startX) * easedProgress;
            y = startY + (endY - startY) * easedProgress;
            alpha = 1 - scatterProgress;

            if (scatterProgress > 0.05) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = `rgba(255, 255, 224, ${alpha * 0.8})`;
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.restore();
            }
        }

        if (x !== null && y !== null) {
            drawDragonball(ctx, x, y, ballRadius, i + 1, alpha);
        }
    }
}


export function drawEffects(
    ctx: CanvasRenderingContext2D,
    gs: GameState,
    particles: Particle[],
    explosionCores: ExplosionCore[],
    timestamp: number,
    clockOffset: number
) {
    // Draw Dragonball scatter animation first, so it's behind goal explosions
    if (gs.dragonballScatterAnimation?.isActive) {
        drawDragonballScatterAnimation(ctx, gs, timestamp, clockOffset);
    }

    // Goal Explosions
    explosionCores.forEach(core => {
        const elapsed = timestamp - core.startTime;
        const easedProgress = (1 - Math.pow(1 - Math.min(1.0, elapsed / 1000 / core.life), 5));
        const currentRadius = Math.max(0, core.maxRadius * easedProgress);
        const alpha = 1 - Math.min(1.0, elapsed / 1000 / core.life);
        ctx.save();
        ctx.translate(core.x, core.y);
        let glowColor1, glowColor2, rayColor, coreColor1, coreColor2, coreColor3;
        if (core.scorerId === 'player1') {
            glowColor1 = `rgba(100, 200, 255, ${alpha * 0.6})`; glowColor2 = `rgba(130, 100, 255, ${alpha * 0.4})`; rayColor = `rgba(180, 220, 255, ${alpha * 0.9})`;
            coreColor1 = `rgba(220, 240, 255, ${alpha})`; coreColor2 = `rgba(100, 220, 255, ${alpha * 0.9})`; coreColor3 = `rgba(130, 100, 255, 0)`;
        } else {
            glowColor1 = `rgba(255, 180, 0, ${alpha * 0.6})`; glowColor2 = `rgba(255, 100, 0, ${alpha * 0.4})`; rayColor = `rgba(255, 220, 100, ${alpha * 0.9})`;
            coreColor1 = `rgba(255, 255, 220, ${alpha})`; coreColor2 = `rgba(255, 200, 0, ${alpha * 0.9})`; coreColor3 = `rgba(255, 100, 0, 0)`;
        }
        const glowGradient = ctx.createRadialGradient(0, 0, currentRadius * 0.4, 0, 0, currentRadius);
        glowGradient.addColorStop(0, glowColor1); glowGradient.addColorStop(0.7, glowColor2); glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGradient; ctx.beginPath(); ctx.arc(0, 0, currentRadius, 0, Math.PI * 2); ctx.fill();
        ctx.rotate(core.rotation + easedProgress * Math.PI * 0.5);
        ctx.strokeStyle = rayColor; ctx.lineWidth = Math.max(1, 5 * (1 - easedProgress));
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(Math.cos(angle) * currentRadius * 0.3, Math.sin(angle) * currentRadius * 0.3); ctx.lineTo(Math.cos(angle) * currentRadius * 0.85, Math.sin(angle) * currentRadius * 0.85); ctx.stroke();
        }
        ctx.rotate(-(core.rotation + easedProgress * Math.PI * 0.5));
        const coreRadius = currentRadius * 0.3 * (1 + Math.sin(timestamp / 40) * 0.2);
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
        coreGradient.addColorStop(0, coreColor1); coreGradient.addColorStop(0.6, coreColor2); coreGradient.addColorStop(1, coreColor3);
        ctx.fillStyle = coreGradient; ctx.beginPath(); ctx.arc(0, 0, coreRadius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });

    // Ball Spawn Animation
    if (gs.ballSpawn.isActive) {
        const { duration, p1SourceX, p2SourceX, startTime } = gs.ballSpawn;
        const clientStartTime = startTime - clockOffset;
        const elapsed = timestamp - clientStartTime;
        const easedProgress = 1 - Math.pow(1 - Math.min(1.0, elapsed / duration), 5);
        const orb1X = p1SourceX + (C.CANVAS_WIDTH / 2 - p1SourceX) * easedProgress;
        const orb2X = p2SourceX + (C.CANVAS_WIDTH / 2 - p2SourceX) * easedProgress;
        const orbRadius = 8 + (1 - easedProgress) * 10;
        ctx.save();
        ctx.globalAlpha = 0.5 + easedProgress * 0.5;
        const p1Gradient = ctx.createRadialGradient(orb1X, C.CANVAS_HEIGHT / 2, 0, orb1X, C.CANVAS_HEIGHT / 2, orbRadius * 2);
        p1Gradient.addColorStop(0, 'rgba(103, 232, 249, 1)'); p1Gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = p1Gradient; ctx.beginPath(); ctx.arc(orb1X, C.CANVAS_HEIGHT / 2, orbRadius * 2, 0, Math.PI * 2); ctx.fill();
        const p2Gradient = ctx.createRadialGradient(orb2X, C.CANVAS_HEIGHT / 2, 0, orb2X, C.CANVAS_HEIGHT / 2, orbRadius * 2);
        p2Gradient.addColorStop(0, 'rgba(251, 191, 36, 1)'); p2Gradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = p2Gradient; ctx.beginPath(); ctx.arc(orb2X, C.CANVAS_HEIGHT / 2, orbRadius * 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // Particles - Optimized rendering loop
    const originalAlpha = ctx.globalAlpha;
    particles.forEach(p => {
        ctx.globalAlpha = originalAlpha * Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
    });
    ctx.globalAlpha = originalAlpha; // Restore alpha after the loop

    // Visual Effects (e.g., Chain Lightning)
    gs.visualEffects.forEach(ve => {
        if (ve.type === 'chain_lightning') {
            ctx.save();
            ctx.strokeStyle = `rgba(139, 92, 246, ${ve.life * 2})`;
            ctx.lineWidth = 3;
            ctx.globalAlpha = Math.max(0, ve.life * 2);
            ctx.beginPath();
            ctx.moveTo(ve.from.x, ve.from.y);
            const dx = ve.to.x - ve.from.x;
            const dy = ve.to.y - ve.from.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const segments = 10;
            const segmentLength = distance / segments;
            for (let i = 1; i < segments; i++) {
                ctx.lineTo(ve.from.x + (dx / segments) * i + (Math.random() - 0.5) * segmentLength, ve.from.y + (dy / segments) * i + (Math.random() - 0.5) * segmentLength);
            }
            ctx.lineTo(ve.to.x, ve.to.y);
            ctx.stroke();
            ctx.restore();
        } else if (ve.type === 'exodia_summon') {
            const centerX = ve.from.x;
            const centerY = ve.from.y;
            const maxRadius = Math.min(C.CANVAS_WIDTH, C.CANVAS_HEIGHT) * 0.35;
            
            const initialLife = 3; // Based on the value set in augments.ts
            const progress = (initialLife - ve.life) / initialLife;
            
            // Fade in for the first 15% of its life, then fade out for the last 30%
            let alpha = 0;
            if (progress < 0.15) {
                alpha = progress / 0.15;
            } else if (progress > 0.7) {
                alpha = (1 - progress) / 0.3;
            } else {
                alpha = 1;
            }
            alpha = Math.max(0, alpha); // clamp alpha

            ctx.save();
            ctx.translate(centerX, centerY);
            
            ctx.globalAlpha = alpha;
            ctx.shadowColor = '#38bdf8'; // light blue
            ctx.shadowBlur = 20;

            const drawPentagram = (radius: number, rotation: number) => {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const pointIndex = (i * 2) % 5;
                    const finalAngle = rotation + (pointIndex * 2 * Math.PI / 5) - (Math.PI / 2);
                    const x = radius * Math.cos(finalAngle);
                    const y = radius * Math.sin(finalAngle);
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.strokeStyle = '#7dd3fc'; // lighter blue
                ctx.lineWidth = 4;
                ctx.stroke();
            };

            const rotation1 = (timestamp / 10000);
            const rotation2 = -(timestamp / 8000);

            drawPentagram(maxRadius, rotation1);
            drawPentagram(maxRadius * 0.7, rotation2);

            ctx.restore();
        } else if (ve.type === 'dragonball_wish') {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ve.life); 
            ctx.fillStyle = '#fde047'; 
            ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
            ctx.restore();
        } else if (ve.type === 'ki_aura_teleport') {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ve.life * 5); // Make it fade out quickly
            ctx.strokeStyle = '#fef08a'; // A light yellow
            ctx.lineWidth = 4;
            ctx.shadowColor = '#facc15'; // Yellow-500
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(ve.from.x, ve.from.y);
            ctx.lineTo(ve.to.x, ve.to.y);
            ctx.stroke();
            
            ctx.restore();
        }
    });
}