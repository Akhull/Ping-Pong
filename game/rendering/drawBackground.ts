import { GameState } from '../../types';
import * as C from '../../constants';

function drawShenron(ctx: CanvasRenderingContext2D, timestamp: number) {
    const centerX = C.CANVAS_WIDTH / 2;
    const centerY = 150; // Position in the upper third
    const eyeSeparation = 100; // Distance between the inner points of the eyes
    const eyeWidth = 150; // Width of each eye triangle
    const eyeHeight = 70; // Height of each eye triangle

    ctx.save();

    // Pulsing effect
    const pulse = Math.sin(timestamp / 250) * 0.5 + 0.5; // Varies between 0 and 1
    const glow = 15 + pulse * 15; // Pulse shadowBlur
    const alpha = 0.7 + pulse * 0.3; // Pulse alpha

    ctx.shadowColor = `rgba(255, 0, 0, ${alpha})`;
    ctx.shadowBlur = glow;
    ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`; // red-600 with pulsing alpha

    // Left Eye (triangle pointing right)
    const leftEyeX = centerX - eyeSeparation / 2 - eyeWidth;
    ctx.beginPath();
    ctx.moveTo(leftEyeX, centerY - eyeHeight / 2); // Top-left
    ctx.lineTo(centerX - eyeSeparation / 2, centerY); // Tip pointing right
    ctx.lineTo(leftEyeX, centerY + eyeHeight / 2); // Bottom-left
    ctx.closePath();
    ctx.fill();

    // Right Eye (triangle pointing left)
    const rightEyeX = centerX + eyeSeparation / 2 + eyeWidth;
    ctx.beginPath();
    ctx.moveTo(rightEyeX, centerY - eyeHeight / 2); // Top-right
    ctx.lineTo(centerX + eyeSeparation / 2, centerY); // Tip pointing left
    ctx.lineTo(rightEyeX, centerY + eyeHeight / 2); // Bottom-right
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}


export function drawBackground(
    ctx: CanvasRenderingContext2D,
    gs: GameState,
    timestamp: number,
    clockOffset: number
) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    // Shenron Animation
    if (gs.wishSelection) {
        drawShenron(ctx, timestamp);
    }

    // Wormhole Wall Effect
    if (gs.players.player1.isWormholeActive || gs.players.player2.isWormholeActive) {
        ctx.save();
        const waveOffset = Math.sin(timestamp / 500) * 5;
        const alpha = 0.5 + Math.sin(timestamp / 300) * 0.2;

        const topGradient = ctx.createLinearGradient(0, 0, 0, 50);
        topGradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
        topGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, C.CANVAS_WIDTH, 50);

        ctx.beginPath();
        ctx.moveTo(0, 10 + waveOffset);
        for (let x = 0; x < C.CANVAS_WIDTH; x += 10) {
            const y = 10 + waveOffset + Math.sin(x / 50 + timestamp / 200) * 4;
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(110, 231, 183, ${alpha * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const bottomGradient = ctx.createLinearGradient(0, C.CANVAS_HEIGHT, 0, C.CANVAS_HEIGHT - 50);
        bottomGradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
        bottomGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, C.CANVAS_HEIGHT - 50, C.CANVAS_WIDTH, 50);
        
        ctx.beginPath();
        ctx.moveTo(0, C.CANVAS_HEIGHT - 10 - waveOffset);
        for (let x = 0; x < C.CANVAS_WIDTH; x += 10) {
            const y = C.CANVAS_HEIGHT - 10 - waveOffset + Math.sin(x / 50 + timestamp / 200) * 4;
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(110, 231, 183, ${alpha * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // Timewarp vignette and shockwave
    if (gs.timeWarp.isActive) {
        const { duration, impactX, impactY, startTime } = gs.timeWarp;
        const clientStartTime = startTime - clockOffset;
        const elapsed = timestamp - clientStartTime;
        if (elapsed > 0 && elapsed < duration) {
            const progress = elapsed / duration;
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const shockwaveRadius = easeOutProgress * C.CANVAS_WIDTH * 0.75;
            const shockwaveAlpha = 1 - easeOutProgress;
            ctx.save();
            ctx.beginPath(); ctx.arc(impactX, impactY, shockwaveRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(102, 232, 249, ${shockwaveAlpha * 0.8})`; ctx.lineWidth = 4 * shockwaveAlpha; ctx.stroke();
            if (easeOutProgress < 0.5) {
                const innerShockwaveRadius = (easeOutProgress * 2) * C.CANVAS_WIDTH * 0.5;
                const innerShockwaveAlpha = 1 - (easeOutProgress * 2);
                ctx.beginPath(); ctx.arc(impactX, impactY, innerShockwaveRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${innerShockwaveAlpha * 0.6})`; ctx.lineWidth = 2 * innerShockwaveAlpha; ctx.stroke();
            }
            ctx.restore();
            const vignetteProgress = Math.sin(Math.PI * progress);
            const gradient = ctx.createRadialGradient(C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT / 2, C.CANVAS_HEIGHT * 0.3, C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT / 2, C.CANVAS_WIDTH * 0.7);
            gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
            gradient.addColorStop(1, `rgba(15, 23, 42, ${vignetteProgress * 0.95})`);
            ctx.save(); ctx.fillStyle = gradient; ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT); ctx.restore();
        }
    }

    // Center line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(C.CANVAS_WIDTH / 2, 0);
    ctx.lineTo(C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
}