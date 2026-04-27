// Entry point — sequential turn orchestration
import { createState, addLog } from './game.js';
import { rollDice, resolveRoll, DICE_COLORS } from './dice.js';
import { applyResolvedEffects, tickFire, isDefeated } from './combat.js';
import { renderShip, showTurnLabel, hideTurnLabel, showGameOver, hideGameOver } from './ui.js';
import { initPhysicsZone, throwAndLine, showLineup, destroyAll } from './physics.js';

const PLACEHOLDER = [
  { id: 'SHIELD_5',  label: 'Shield +5'  },
  { id: 'SHIELD_5',  label: 'Shield +5'  },
  { id: 'SHIELD_5',  label: 'Shield +5'  },
  { id: 'SHIELD_5',  label: 'Shield +5'  },
  { id: 'SHIELD_5',  label: 'Shield +5'  },
  { id: 'SHIELD_5',  label: 'Shield +5'  },
];

let state;
let gameActive = false;
const $ = id => document.getElementById(id);

// ── Helpers ──────────────────────────────────────────────────────────────────

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function throw_(zoneId, roll, colors) {
  return new Promise(r => throwAndLine(zoneId, roll, colors, r));
}

function updateShips() {
  renderShip($('player-ship'), state.player);
  renderShip($('ai-ship'),     state.ai);
}

function checkGameOver() {
  if (isDefeated(state.player)) {
    state.phase = 'gameover';
    showGameOver($('gameover-overlay'), 'ai');
    return true;
  }
  if (isDefeated(state.ai)) {
    state.phase = 'gameover';
    showGameOver($('gameover-overlay'), 'player');
    return true;
  }
  return false;
}

function setRollBtn(enabled) {
  $('roll-btn').disabled = !enabled;
}

// ── Turn loop ─────────────────────────────────────────────────────────────────

async function playerTurn() {
  showTurnLabel("⚓ Player's Turn");

  setRollBtn(true);
  await new Promise(resolve => {
    const btn = $('roll-btn');
    const handler = () => {
      btn.removeEventListener('click', handler);
      setRollBtn(false);
      resolve();
    };
    btn.addEventListener('click', handler);
  });

  tickFire(state.player, msg => addLog(state, msg));
  updateShips();

  const roll     = rollDice();
  const resolved = resolveRoll(roll);

  await throw_('player', roll, DICE_COLORS);

  applyResolvedEffects(state.player, state.ai, resolved, msg => addLog(state, msg));
  updateShips();

  hideTurnLabel();
  await wait(400);
}

async function aiTurn() {
  showTurnLabel("💀 Enemy's Turn");

  await wait(400);

  tickFire(state.ai, msg => addLog(state, msg));
  updateShips();

  const roll     = rollDice();
  const resolved = resolveRoll(roll);

  await throw_('ai', roll, DICE_COLORS);

  applyResolvedEffects(state.ai, state.player, resolved, msg => addLog(state, msg));
  updateShips();

  hideTurnLabel();
  await wait(400);
}

async function runGame() {
  gameActive = true;
  while (gameActive) {
    await playerTurn();
    if (!gameActive || checkGameOver()) return;

    await aiTurn();
    if (!gameActive || checkGameOver()) return;

    state.round++;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initZones() {
  initPhysicsZone('player-canvas', 'player-overlay', 'player');
  initPhysicsZone('ai-canvas',     'ai-overlay',     'ai');

  // Show face-down placeholder dice in both zones
  showLineup('player', PLACEHOLDER, DICE_COLORS);
  showLineup('ai',     PLACEHOLDER, DICE_COLORS);
}

function init() {
  state = createState();
  setRollBtn(false);
  hideGameOver($('gameover-overlay'));
  updateShips();

  requestAnimationFrame(() => requestAnimationFrame(() => {
    initZones();
    runGame();
  }));

  $('restart-btn').addEventListener('click', () => {
    gameActive = false;
    state = createState();
    hideGameOver($('gameover-overlay'));
    destroyAll();
    updateShips();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      initZones();
      runGame();
    }));
  });
}

document.addEventListener('DOMContentLoaded', init);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
