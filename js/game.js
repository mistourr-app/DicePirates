// Core game state

export const MAX_HEALTH = 100;
export const MAX_SHIELD = 30;

export function createShip(name) {
  return { name, health: MAX_HEALTH, shield: MAX_SHIELD, fireStacks: [] };
}

export function createState() {
  return {
    player: createShip('Player'),
    ai:     createShip('AI'),
    turn:   'player',   // 'player' | 'ai'
    phase:  'roll',     // 'roll' | 'resolving' | 'gameover'
    round:  1,
    log:    [],
  };
}

export function addLog(state, message) {
  state.log.unshift(`[R${state.round}] ${message}`);
  if (state.log.length > 30) state.log.pop();
}
