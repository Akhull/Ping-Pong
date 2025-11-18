
import { GameState } from '../../types';
import * as C from '../../constants';

export function drawUI(
    ctx: CanvasRenderingContext2D,
    gs: GameState,
    timestamp: number,
    clockOffset: number
) {
    // Countdown Timer
    if (gs.countdown !== null) {
        const clientCountdownStartTime = gs.countdownStartTime - clockOffset;
        const elapsed = performance.now() - clientCountdownStartTime;
        const scale = 1 + (elapsed % 1000) / 1000;
        const alpha = 1 - (elapsed % 1000) / 1000;
        ctx.font = `bold ${100 * scale}px sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let text = gs.countdown > 0 ? gs.countdown.toString() : "GO!";
        if (elapsed > 1000) text = "";
        ctx.fillText(text, C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT / 2);
    }

    // Floating Text
    gs.floatingTexts.forEach(ft => {
        ctx.font = `bold ${20 + (1 - ft.life) * 10}px sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
    });
}
