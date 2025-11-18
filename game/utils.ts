
import { PlayerState } from '../types';
import * as C from '../constants';

export const getPlayerPaddles = (player: PlayerState): { x: number, y: number, width: number, height: number }[] => {
    if (player.isMultiCloneActive) {
        const { x, y, width, height } = player.paddle;
        return [
            { x, y, width, height },
            { x, y: y - height - C.MULTI_CLONE_GAP, width, height },
            { x, y: y + height + C.MULTI_CLONE_GAP, width, height }
        ];
    }
    return [player.paddle];
};
