// Dice definitions and roll logic

export const EFFECTS = {
  ATTACK_5:   { id: 'ATTACK_5',   label: 'Attack 5',          type: 'attack',  value: 5  },
  ATTACK_10:  { id: 'ATTACK_10',  label: 'Attack 10',         type: 'attack',  value: 10 },
  ATTACK_20:  { id: 'ATTACK_20',  label: 'Attack 20',         type: 'attack',  value: 20 },
  FIRE:       { id: 'FIRE',       label: 'Fire Cannonballs',  type: 'fire',    value: 5  },
  SHIELD_5:   { id: 'SHIELD_5',   label: 'Shield +5',         type: 'shield',  value: 5  },
  SHIELD_10:  { id: 'SHIELD_10',  label: 'Shield +10',        type: 'shield',  value: 10 },
};

// All dice share the same 6 faces in the prototype
const FACES = [
  EFFECTS.ATTACK_5,
  EFFECTS.ATTACK_10,
  EFFECTS.ATTACK_20,
  EFFECTS.FIRE,
  EFFECTS.SHIELD_5,
  EFFECTS.SHIELD_10,
];

export const DICE_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

// Roll all 6 dice, return array of effect objects
export function rollDice() {
  return FACES.map(() => FACES[Math.floor(Math.random() * FACES.length)]);
}

// Apply combo bonus: base * (1 + 0.05 * (count - 1)), rounded
export function applyComboBonus(value, count) {
  return Math.round(value * (1 + 0.05 * (count - 1)));
}

// Group rolled effects and apply combo bonuses, return resolved effect list
// Returns: [{ effect, value, count }]
export function resolveRoll(roll) {
  const groups = {};
  for (const effect of roll) {
    if (!groups[effect.id]) groups[effect.id] = { effect, count: 0 };
    groups[effect.id].count++;
  }
  return Object.values(groups).map(({ effect, count }) => ({
    effect,
    count,
    value: applyComboBonus(effect.value, count),
  }));
}
