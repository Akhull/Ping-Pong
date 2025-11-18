import { GameState, PlayerID, PlayerState } from '../../types';
import * as C from '../../constants';

// Cache for pre-rendered hole visuals to improve performance
const holeCaches: { [key: string]: { glow: HTMLCanvasElement, disk: HTMLCanvasElement, core: HTMLCanvasElement } } = {};

function getHoleCache(
    key: 'blackHole' | 'whiteHole',
    visualRadius: number
): { glow: HTMLCanvasElement, disk: HTMLCanvasElement, core: HTMLCanvasElement } {
    const cacheKey = `${key}-${visualRadius}`;
    if (holeCaches[cacheKey]) {
        return holeCaches[cacheKey];
    }

    // Create canvases for caching
    const glowRadius = visualRadius * 1.5;
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = glowRadius * 2;
    const glowCtx = glowCanvas.getContext('2d')!;
    glowCtx.translate(glowRadius, glowRadius);

    const diskCanvas = document.createElement('canvas');
    diskCanvas.width = diskCanvas.height = visualRadius * 2;
    const diskCtx = diskCanvas.getContext('2d')!;
    diskCtx.translate(visualRadius, visualRadius);
    
    const coreCanvas = document.createElement('canvas');
    coreCanvas.width = coreCanvas.height = visualRadius * 2;
    const coreCtx = coreCanvas.getContext('2d')!;
    coreCtx.translate(visualRadius, visualRadius);

    // Pre-render visuals
    if (key === 'blackHole') {
        // Render Glow
        const glowGradient = glowCtx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        glowGradient.addColorStop(0, 'rgba(147, 51, 234, 0.3)');
        glowGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.15)');
        glowGradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
        glowCtx.fillStyle = glowGradient;
        glowCtx.beginPath(); glowCtx.arc(0, 0, glowRadius, 0, Math.PI * 2); glowCtx.fill();
        
        // Render rotating Disk
        const diskGradient = diskCtx.createConicGradient(0, 0, 0);
        diskGradient.addColorStop(0, 'rgba(126, 34, 206, 0)');
        diskGradient.addColorStop(0.2, 'rgba(147, 51, 234, 0.5)');
        diskGradient.addColorStop(0.4, 'rgba(126, 34, 206, 0)');
        diskGradient.addColorStop(0.6, 'rgba(168, 85, 247, 0.6)');
        diskGradient.addColorStop(0.8, 'rgba(126, 34, 206, 0)');
        diskGradient.addColorStop(1, 'rgba(126, 34, 206, 0)');
        diskCtx.fillStyle = diskGradient;
        diskCtx.beginPath(); diskCtx.arc(0, 0, visualRadius, 0, Math.PI * 2); diskCtx.fill();
        
        // Render Core
        coreCtx.strokeStyle = 'rgba(20, 10, 40, 0.8)'; coreCtx.lineWidth = visualRadius * 0.2;
        coreCtx.beginPath(); coreCtx.arc(0, 0, visualRadius * 0.9, 0, Math.PI * 2); coreCtx.stroke();
        const coreGradient = coreCtx.createRadialGradient(0, 0, 0, 0, 0, visualRadius * 0.15);
        coreGradient.addColorStop(0, 'black'); coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        coreCtx.fillStyle = coreGradient;
        coreCtx.beginPath(); coreCtx.arc(0, 0, visualRadius * 0.15, 0, Math.PI * 2); coreCtx.fill();
        coreCtx.fillStyle = 'black'; coreCtx.beginPath(); coreCtx.arc(0, 0, 20, 0, Math.PI * 2); coreCtx.fill();

    } else { // whiteHole
        // Render Glow
        const glowGradient = glowCtx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        glowGradient.addColorStop(0, 'rgba(103, 232, 249, 0.3)');
        glowGradient.addColorStop(0.5, 'rgba(103, 232, 249, 0.15)');
        glowGradient.addColorStop(1, 'rgba(103, 232, 249, 0)');
        glowCtx.fillStyle = glowGradient; glowCtx.beginPath(); glowCtx.arc(0, 0, glowRadius, 0, Math.PI * 2); glowCtx.fill();

        // Render rotating Disk
        const diskGradient = diskCtx.createConicGradient(0, 0, 0);
        diskGradient.addColorStop(0, 'rgba(224, 242, 254, 0)'); diskGradient.addColorStop(0.2, 'rgba(186, 230, 253, 0.6)');
        diskGradient.addColorStop(0.4, 'rgba(224, 242, 254, 0)'); diskGradient.addColorStop(0.6, 'rgba(103, 232, 249, 0.7)');
        diskGradient.addColorStop(0.8, 'rgba(224, 242, 254, 0)'); diskGradient.addColorStop(1, 'rgba(224, 242, 254, 0)');
        diskCtx.fillStyle = diskGradient; diskCtx.beginPath(); diskCtx.arc(0, 0, visualRadius, 0, Math.PI * 2); diskCtx.fill();

        // Render Core
        coreCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; coreCtx.lineWidth = visualRadius * 0.2;
        coreCtx.beginPath(); coreCtx.arc(0, 0, visualRadius * 0.9, 0, Math.PI * 2); coreCtx.stroke();
        const coreGradient = coreCtx.createRadialGradient(0, 0, 0, 0, 0, visualRadius * 0.15);
        coreGradient.addColorStop(0, 'white'); coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        coreCtx.fillStyle = coreGradient; coreCtx.beginPath(); coreCtx.arc(0, 0, visualRadius * 0.15, 0, Math.PI * 2); coreCtx.fill();
        coreCtx.fillStyle = 'white'; coreCtx.beginPath(); coreCtx.arc(0, 0, 20, 0, Math.PI * 2); coreCtx.fill();
    }

    holeCaches[cacheKey] = { glow: glowCanvas, disk: diskCanvas, core: coreCanvas };
    return holeCaches[cacheKey];
}


export function drawArenaObjects(
    ctx: CanvasRenderingContext2D,
    gs: GameState,
    timestamp: number,
    clockOffset: number,
    localPlayerId: PlayerID | null,
) {
    // Black Holes
    gs.arena.blackHoles.forEach(bh => {
        const cache = getHoleCache('blackHole', bh.safeRadius);
        const glowRadius = bh.safeRadius * 1.5;

        ctx.save();
        ctx.translate(bh.x, bh.y);

        // Draw pre-rendered glow
        ctx.drawImage(cache.glow, -glowRadius, -glowRadius);
        
        // Rotate and draw pre-rendered disk
        ctx.rotate(bh.rotationAngle);
        ctx.drawImage(cache.disk, -bh.safeRadius, -bh.safeRadius);
        ctx.rotate(-bh.rotationAngle);
        
        // Draw pre-rendered core
        ctx.drawImage(cache.core, -bh.safeRadius, -bh.safeRadius);
        
        ctx.restore();
    });

    // White Holes
    gs.arena.whiteHoles.forEach(wh => {
        const cache = getHoleCache('whiteHole', wh.safeRadius);
        const glowRadius = wh.safeRadius * 1.5;

        ctx.save();
        ctx.translate(wh.x, wh.y);
        
        // Draw pre-rendered glow
        ctx.drawImage(cache.glow, -glowRadius, -glowRadius);

        // Rotate and draw pre-rendered disk
        ctx.rotate(wh.rotationAngle);
        ctx.drawImage(cache.disk, -wh.safeRadius, -wh.safeRadius);
        ctx.rotate(-wh.rotationAngle);
        
        // Draw pre-rendered core
        ctx.drawImage(cache.core, -wh.safeRadius, -wh.safeRadius);

        ctx.restore();
    });

    // Exodia Laser Charge
    gs.arena.exodiaLaserCharges.forEach(charge => {
        const clientEndTime = charge.endTime - clockOffset;
        const timeRemaining = clientEndTime - timestamp;
        if (timeRemaining < 0) return;

        const isP1 = charge.ownerId === 'player1';
        const x = isP1 ? 0 : C.CANVAS_WIDTH - 5;
        const chargeProgress = 1 - (timeRemaining / C.EXODIA_LASER_CHARGE_TIME_MS);
        
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 0, ${0.2 + chargeProgress * 0.5})`;
        ctx.fillRect(x, charge.y, 5, C.EXODIA_LASER_HEIGHT);
        
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255, 255, 150, ${0.5 + chargeProgress * 0.5})`;
        ctx.fillRect(x, charge.y, 5, C.EXODIA_LASER_HEIGHT);

        ctx.restore();
    });

    // Exodia Lasers
    gs.arena.exodiaLasers.forEach(laser => {
        const clientEndTime = laser.endTime - clockOffset;
        const timeRemaining = clientEndTime - timestamp;
        if (timeRemaining < 0) return;
        
        // Fade in/out effect based on duration
        const FADE_TIME = 200; // 200ms fade in/out
        let alpha = 1.0;
        if (timeRemaining < FADE_TIME) {
            alpha = timeRemaining / FADE_TIME;
        } else if ((C.EXODIA_LASER_DURATION_MS - timeRemaining) < FADE_TIME) {
            alpha = (C.EXODIA_LASER_DURATION_MS - timeRemaining) / FADE_TIME;
        }
        alpha = Math.max(0, alpha);


        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 20;

        const gradient = ctx.createLinearGradient(0, laser.y, 0, laser.y + laser.height);
        gradient.addColorStop(0, `rgba(255, 255, 100, ${0.4 * alpha})`);
        gradient.addColorStop(0.3, `rgba(255, 255, 200, ${0.9 * alpha})`);
        gradient.addColorStop(0.7, `rgba(255, 255, 200, ${0.9 * alpha})`);
        gradient.addColorStop(1, `rgba(255, 255, 100, ${0.4 * alpha})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, laser.y, C.CANVAS_WIDTH, laser.height);

        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(0, laser.y + laser.height/2 - (laser.height * 0.1), C.CANVAS_WIDTH, laser.height * 0.2);

        ctx.restore();
    });

    // Defensive Walls
    gs.arena.walls.forEach(wall => {
        const baseColor = wall.ownerId === 'player1' ? '4, 184, 217' : '251, 146, 60';
        if (wall.blocksRemaining > 0) {
            ctx.fillStyle = `rgba(${baseColor}, 0.8)`; ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            ctx.strokeStyle = `rgba(${baseColor}, 1)`; ctx.lineWidth = 2; ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
            for (let i = 0; i < wall.blocksRemaining; i++) {
                ctx.fillStyle = `rgba(${baseColor}, 1)`;
                if (wall.ownerId === 'player1') ctx.fillRect(wall.x + wall.width + 4, wall.y + 4 + i * (10), 6, 6);
                else ctx.fillRect(wall.x - 4 - 6, wall.y + 4 + i * (10), 6, 6);
            }
        } else {
            ctx.fillStyle = '#475569'; ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            const clientCooldownEndTime = wall.cooldownEndTime - clockOffset;
            if (timestamp < clientCooldownEndTime) {
                const clientCooldownStartTime = clientCooldownEndTime - wall.cooldownDuration;
                const elapsed = timestamp - clientCooldownStartTime;
                const progress = Math.min(1, elapsed / wall.cooldownDuration);
                ctx.fillStyle = `rgba(${baseColor}, 0.5)`; ctx.fillRect(wall.x, wall.y + wall.height - (wall.height * progress), wall.width, wall.height * progress);
            }
        }
    });

    // Last Stand Goal Line Shield
    Object.values(gs.players).forEach((player: PlayerState) => {
        if (player.abilities.lastStand.isActive) {
            const isP1 = player.id === 'player1';
            const netX = isP1 ? 0 : (C.CANVAS_WIDTH - 5);
            ctx.save();
            ctx.globalAlpha = 0.6 + Math.sin(timestamp / 150) * 0.2;
            ctx.fillStyle = isP1 ? '#22d3ee' : '#fb923c'; ctx.fillRect(netX, 0, 5, C.CANVAS_HEIGHT);
            ctx.globalAlpha = 1.0; ctx.fillStyle = '#ffffff'; ctx.fillRect(netX + 1.5, 0, 2, C.CANVAS_HEIGHT);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + Math.sin(timestamp / 200) * 0.1})`; ctx.lineWidth = 1;
            const yOffset = timestamp / 50;
            for (let y = -60; y < C.CANVAS_HEIGHT + 60; y += 51.96 / 2) {
                const currentY = (y + yOffset) % (C.CANVAS_HEIGHT + 120) - 60;
                ctx.beginPath();
                for(let i = 0; i < 7; i++) {
                    const angle = (Math.PI / 3) * i;
                    const hx = netX + 2.5 + 30 * Math.cos(angle), hy = currentY + 30 * Math.sin(angle);
                    if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
                }
                ctx.stroke();
            }
            ctx.restore();
        }
    });

    // Kamehameha Charge
    gs.arena.kamehamehaCharges.forEach(charge => {
        const owner = gs.players[charge.ownerId];
        if (!owner) return;
        const clientEndTime = charge.endTime - clockOffset;
        const timeRemaining = clientEndTime - timestamp;
        if (timeRemaining < 0) return;
    
        const chargeProgress = 1 - (timeRemaining / 1200); // 1200ms charge time
        const paddle = owner.paddle;
        const centerX = paddle.x + paddle.width / 2;
        const centerY = paddle.y + paddle.height / 2;
        
        ctx.save();
        const radius = 10 + 20 * chargeProgress;
        const alpha = 0.5 + 0.5 * chargeProgress;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `rgba(191, 219, 254, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(37, 99, 235, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Kamehameha Beams
    gs.arena.kamehamehaBeams.forEach(beam => {
        const clientEndTime = beam.endTime - clockOffset;
        const timeRemaining = clientEndTime - timestamp;
        if (timeRemaining < 0) return;
        
        const DURATION = 2000;
        const FADE_TIME = 300;
        let alpha = 1.0;
        if (timeRemaining < FADE_TIME) {
            alpha = timeRemaining / FADE_TIME;
        } else if ((DURATION - timeRemaining) < FADE_TIME) {
            alpha = (DURATION - timeRemaining) / FADE_TIME;
        }
        alpha = Math.max(0, alpha);
        
        let beamY = beam.y;
        // If the local player owns this beam, override the Y position with the local paddle's position for zero latency.
        if (localPlayerId && beam.ownerId === localPlayerId) {
            const owner = gs.players[localPlayerId];
            if (owner) {
                beamY = owner.paddle.y + (owner.paddle.height / 2) - (beam.height / 2);
            }
        }
    
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = '#60a5fa'; // blue-400
        ctx.shadowBlur = 25;
    
        const gradient = ctx.createLinearGradient(0, beamY, 0, beamY + beam.height);
        gradient.addColorStop(0, `rgba(147, 197, 253, ${0.4 * alpha})`);
        gradient.addColorStop(0.3, `rgba(219, 234, 254, ${0.9 * alpha})`);
        gradient.addColorStop(0.7, `rgba(219, 234, 254, ${0.9 * alpha})`);
        gradient.addColorStop(1, `rgba(147, 197, 253, ${0.4 * alpha})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, beamY, C.CANVAS_WIDTH, beam.height);
    
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(0, beamY + beam.height/2 - (beam.height * 0.1), C.CANVAS_WIDTH, beam.height * 0.2);
    
        ctx.restore();
    });
    
    // Midline Seal
    gs.arena.midlineSeals.forEach(seal => {
        const clientEndTime = seal.endTime - clockOffset;
        const timeRemaining = clientEndTime - timestamp;
        if (timeRemaining < 0) return;
    
        const DURATION = 5000;
        const FADE_TIME = 400;
        let alpha = 0.8 + Math.sin(timestamp / 80) * 0.2; // Pulsing
        if (timeRemaining < FADE_TIME) {
            alpha *= (timeRemaining / FADE_TIME); // Fade out
        } else if ((DURATION - timeRemaining) < FADE_TIME) {
            alpha *= ((DURATION - timeRemaining) / FADE_TIME); // Fade in
        }
    
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        
        const midlineX = C.CANVAS_WIDTH / 2;
        
        // Core Glow
        ctx.shadowColor = '#fb923c'; // orange-400
        ctx.shadowBlur = 30;
        
        // Gradient line
        const gradient = ctx.createLinearGradient(midlineX, 0, midlineX, C.CANVAS_HEIGHT);
        gradient.addColorStop(0, `rgba(253, 186, 116, 0)`); // orange-300 transparent
        gradient.addColorStop(0.5, `rgba(251, 146, 60, 1)`); // orange-400
        gradient.addColorStop(1, `rgba(253, 186, 116, 0)`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(midlineX, 0);
        ctx.lineTo(midlineX, C.CANVAS_HEIGHT);
        ctx.stroke();
    
        // Inner white hot line
        ctx.shadowBlur = 10;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(midlineX, 0);
        ctx.lineTo(midlineX, C.CANVAS_HEIGHT);
        ctx.stroke();
    
        ctx.restore();
    });
}