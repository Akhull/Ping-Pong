import { GameState, PlayerState } from '../../types';
import * as C from '../../constants';
import { Particle } from '../effects';
import { getPlayerPaddles } from '../utils';

function drawPaddleAndEffects(ctx: CanvasRenderingContext2D, player: PlayerState, timestamp: number) {
    ctx.fillStyle = player.id === 'player1' ? '#22d3ee' : '#fb923c';
    getPlayerPaddles(player).forEach(paddle => {
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        if (player.isStunned) { ctx.save(); ctx.globalAlpha = 0.7 + Math.sin(timestamp / 50) * 0.3; ctx.fillStyle = '#fafafa'; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); ctx.restore(); }
        if (player.areControlsInverted) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(timestamp / 100) * 0.2; ctx.fillStyle = '#e879f9'; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); ctx.restore(); }
        if (player.abilities.vacBann.isArmed) { ctx.save(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.globalAlpha = 0.6 + Math.sin(timestamp / 150) * 0.4; ctx.strokeRect(paddle.x - 2, paddle.y - 2, paddle.width + 4, paddle.height + 4); ctx.restore(); }
        if (player.isAimbotActive) { ctx.save(); ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 4; ctx.globalAlpha = 0.8 + Math.sin(timestamp / 100) * 0.2; ctx.strokeRect(paddle.x - 3, paddle.y - 3, paddle.width + 6, paddle.height + 6); ctx.restore(); }
        if (player.isShrunk) {
            ctx.save(); ctx.fillStyle = '#c084fc';
            const animationOffset = Math.sin(timestamp / 150) * 4; const paddleCenterX = paddle.x + paddle.width / 2;
            ctx.beginPath(); ctx.moveTo(paddleCenterX - 6, paddle.y - 8 - animationOffset - 3); ctx.lineTo(paddleCenterX + 6, paddle.y - 8 - animationOffset - 3); ctx.lineTo(paddleCenterX, paddle.y - 8 - animationOffset + 3); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(paddleCenterX - 6, paddle.y + paddle.height + 8 + animationOffset + 3); ctx.lineTo(paddleCenterX + 6, paddle.y + paddle.height + 8 + animationOffset + 3); ctx.lineTo(paddleCenterX, paddle.y + paddle.height + 8 + animationOffset - 3); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    });
    if (player.isAimbotActive && player.abilities.aimbot.charges > 0) {
        ctx.fillStyle = '#67e8f9';
        for (let i = 0; i < player.abilities.aimbot.charges; i++) {
            const indicatorX = player.id === 'player1' ? player.paddle.x + player.paddle.width + 5 : player.paddle.x - 5 - 8;
            const indicatorY = player.paddle.y + 5 + i * (13);
            ctx.beginPath(); ctx.arc(indicatorX + 4, indicatorY + 4, 4, 0, Math.PI * 2); ctx.fill();
        }
    }
}

export function drawEntities(
    ctx: CanvasRenderingContext2D,
    gs: GameState,
    timestamp: number,
    particles: Particle[],
) {
    // Draw Paddles
    drawPaddleAndEffects(ctx, gs.players.player1, timestamp);
    drawPaddleAndEffects(ctx, gs.players.player2, timestamp);

    const currentSpeed = Math.sqrt(gs.ball.vx ** 2 + gs.ball.vy ** 2);
    const displaySpeed = currentSpeed * 10;
    const AIRDRAG_THRESHOLD = 125;

    // Draw Ball
    if (gs.ball.isInvisible) {
        particles.push({ x: gs.ball.x, y: gs.ball.y, vx: 0, vy: 0, radius: Math.random() * 1.5 + 1, color: '#64748b', life: 0.1, decay: 1 });
    } else {
        const isHighSpeed = displaySpeed > AIRDRAG_THRESHOLD;
        const effectIntensity = isHighSpeed ? Math.min(1, (displaySpeed - AIRDRAG_THRESHOLD) / (C.MAX_BALL_SPEED * 10 - AIRDRAG_THRESHOLD)) : 0;
        const angle = Math.atan2(gs.ball.vy, gs.ball.vx);

        ctx.save();
        ctx.translate(gs.ball.x, gs.ball.y);
        
        if (isHighSpeed) {
            ctx.rotate(angle);
            const stretchFactor = 1.0 + effectIntensity * 0.8;
            const squishFactor = 1.0 - effectIntensity * 0.4;
            ctx.scale(stretchFactor, squishFactor);
        }

        // Draw main ball shape (either circle or stretched ellipse) at the new origin (0,0)
        ctx.beginPath();
        ctx.arc(0, 0, gs.ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = gs.ball.isFireball ? '#fca5a5' : '#ffffff';
        ctx.fill();

        // Draw fireball glow if applicable, also at (0,0)
        if (gs.ball.isFireball) {
            const gradient = ctx.createRadialGradient(0, 0, gs.ball.radius / 2, 0, 0, gs.ball.radius * 2);
            gradient.addColorStop(0, 'rgba(252, 165, 165, 0.5)');
            gradient.addColorStop(1, 'rgba(252, 165, 165, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, gs.ball.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
    
    // Airdrag trailing particles
    if (displaySpeed > AIRDRAG_THRESHOLD) {
        const effectIntensity = Math.min(1, (displaySpeed - AIRDRAG_THRESHOLD) / (C.MAX_BALL_SPEED * 10 - AIRDRAG_THRESHOLD));
        const angle = Math.atan2(gs.ball.vy, gs.ball.vx);
        if (Math.random() < 0.7) {
            const lineCount = 1 + Math.floor(Math.random() * 2);
            for(let i = 0; i < lineCount; i++) {
                const offsetRadius = gs.ball.radius + Math.random() * 5;
                const offsetAngle = Math.PI + (Math.random() - 0.5) * 1.5;
                const startX = gs.ball.x + Math.cos(angle + offsetAngle) * offsetRadius;
                const startY = gs.ball.y + Math.sin(angle + offsetAngle) * offsetRadius;
                const baseAlpha = 0.2 + Math.random() * 0.2; // Base alpha range: [0.2, 0.4]
                const finalAlpha = Math.min(1.0, baseAlpha + effectIntensity * 0.5); // Add up to 0.5 alpha at max speed
                particles.push({ x: startX, y: startY, vx: -gs.ball.vx * 0.1, vy: -gs.ball.vy * 0.1, radius: Math.random() * 1.2, color: `rgba(255, 255, 255, ${finalAlpha})`, life: 0.2 + Math.random() * 0.2, decay: 2.5 });
            }
        }
    }
}
