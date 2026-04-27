// DOM rendering and UI updates
import { MAX_HEALTH, MAX_SHIELD } from './game.js';

export function renderShip(shipEl, ship) {
  shipEl.querySelector('.health-fill').style.width = `${(ship.health / MAX_HEALTH) * 100}%`;
  shipEl.querySelector('.shield-fill').style.width = `${(ship.shield / MAX_SHIELD) * 100}%`;
  shipEl.querySelector('.health-val').textContent  = `${ship.health}/${MAX_HEALTH}`;
  shipEl.querySelector('.shield-val').textContent  = `${ship.shield}`;

  const fireBadge = shipEl.querySelector('.fire-badge');
  const totalFire = ship.fireStacks.reduce((s, f) => s + f.damage, 0);
  fireBadge.textContent  = totalFire > 0 ? `🔥 ${totalFire}/round` : '';
  fireBadge.style.display = totalFire > 0 ? 'inline-block' : 'none';
}

// Show turn label instantly
export function showTurnLabel(text) {
  const el = document.getElementById('turn-flash');
  el.style.transition = 'none';
  el.style.opacity    = '0';
  el.style.transform  = 'scale(0.75)';
  el.textContent      = text;
  void el.offsetHeight;
  el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  el.style.opacity    = '1';
  el.style.transform  = 'scale(1)';
}

// Hide turn label with fade
export function hideTurnLabel() {
  const el = document.getElementById('turn-flash');
  el.style.transition = 'opacity 0.3s ease';
  el.style.opacity    = '0';
  setTimeout(() => { el.textContent = ''; }, 300);
}

export function showGameOver(overlayEl, winner) {
  overlayEl.querySelector('.gameover-title').textContent =
    winner === 'player' ? '🏴☠️ Victory!' : '💀 Defeated!';
  overlayEl.style.display = 'flex';
}

export function hideGameOver(overlayEl) {
  overlayEl.style.display = 'none';
}
