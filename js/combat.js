// Combat resolution: damage, shield, fire stacks

export function applyResolvedEffects(actor, target, resolved, log) {
  for (const { effect, value, count } of resolved) {
    const combo = count > 1 ? ` (x${count} combo)` : '';

    if (effect.type === 'shield') {
      const gained = Math.min(value * count, 30 - actor.shield); // cap not on shield, just reuse max sensibly
      actor.shield = Math.min(actor.shield + value * count, 30);
      log(`${actor.name} shields +${value * count}${combo}`);

    } else if (effect.type === 'attack') {
      dealDamage(target, value, log, `${actor.name} attacks for ${value}${combo}`);

    } else if (effect.type === 'fire') {
      target.fireStacks.push({ damage: value, rounds: 3 });
      log(`${actor.name} fires burning cannonballs! (${value}/round for 3 rounds${combo})`);
    }
  }
}

// Tick fire stacks at start of a ship's turn, returns total fire damage dealt
export function tickFire(ship, log) {
  let total = 0;
  ship.fireStacks = ship.fireStacks.filter(stack => {
    total += stack.damage;
    stack.rounds--;
    return stack.rounds > 0;
  });
  if (total > 0) {
    dealDamage(ship, total, log, `${ship.name} takes ${total} fire damage`);
  }
}

function dealDamage(ship, amount, log, message) {
  let remaining = amount;
  if (ship.shield > 0) {
    const absorbed = Math.min(ship.shield, remaining);
    ship.shield -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) ship.health = Math.max(0, ship.health - remaining);
  log(message);
}

export function isDefeated(ship) {
  return ship.health <= 0;
}
