// AI turn: random roll with same dice as player
import { rollDice, resolveRoll } from './dice.js';
import { applyResolvedEffects, tickFire, isDefeated } from './combat.js';
import { addLog } from './game.js';

export function runAiTurn(state, onDone) {
  const roll = rollDice();
  const resolved = resolveRoll(roll);

  tickFire(state.ai, msg => addLog(state, msg));

  applyResolvedEffects(state.ai, state.player, resolved, msg => addLog(state, msg));

  state.turn = 'player';
  state.round++;

  onDone(roll, resolved);
}
