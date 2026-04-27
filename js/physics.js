// Physics + CSS 3D dice
// Matter.js: headless physics for positions & collisions
// Rendering: CSS 3D cubes in HTML overlay

const { Engine, Runner, Bodies, Body, World, Composite } = Matter;

const DIE       = 22;
const THROW_MS  = 2200;
const PAUSE_MS  = 400;
const LINEUP_MS = 500;
const WALL_T    = 60;

const EFFECT_FACE = {
  ATTACK_5:  1,
  ATTACK_10: 2,
  ATTACK_20: 3,
  FIRE:      4,
  SHIELD_5:  5,
  SHIELD_10: 6,
};

const EFFECT_INFO = {
  ATTACK_5:  { icon: '💥', label: '5'    },
  ATTACK_10: { icon: '💥', label: '10'   },
  ATTACK_20: { icon: '💥', label: '20'   },
  FIRE:      { icon: '☄️', label: 'Fire' },
  SHIELD_5:  { icon: '🛡️', label: '+5'   },
  SHIELD_10: { icon: '🛡️', label: '+10'  },
};

const sims = {};

// ── CSS 3D cube builder ───────────────────────────────────────────────────────
function makeCube(color, effectId) {
  const s    = DIE * 2;
  const half = DIE;

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position: absolute;
    width: ${s}px; height: ${s}px;
    margin-left: -${half}px; margin-top: -${half}px;
    perspective: 260px;
    pointer-events: none;
  `;

  const cube = document.createElement('div');
  cube.style.cssText = `
    width: ${s}px; height: ${s}px;
    position: relative;
    transform-style: preserve-3d;
    transform: none;
  `;

  const faceTransforms = [
    `translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(90deg)  translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg)  translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];

  const effectKeys = Object.keys(EFFECT_INFO);

  faceTransforms.forEach((t, fi) => {
    const faceEffectId = effectKeys.find(k => EFFECT_FACE[k] === fi + 1);
    const { icon, label } = EFFECT_INFO[faceEffectId];
    const isResult = faceEffectId === effectId;

    const face = document.createElement('div');
    face.style.cssText = `
      position: absolute;
      width: ${s}px; height: ${s}px;
      border: 2px solid ${color};
      border-radius: 8px;
      background: ${isResult ? '#1e3a5f' : '#1a2540'};
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      transform: ${t};
      box-shadow: inset 0 0 ${isResult ? 14 : 6}px ${color}${isResult ? '99' : '33'};
    `;
    face.innerHTML = `
      <span style="font-size:${isResult ? 17 : 13}px;line-height:1">${icon}</span>
      <span style="font-size:7px;color:#94a3b8;margin-top:2px;font-weight:600">${label}</span>
    `;
    cube.appendChild(face);
  });

  wrap.appendChild(cube);
  return { wrap, cube };
}

// ── Init zone ─────────────────────────────────────────────────────────────────
export function initPhysicsZone(canvasId, overlayId, zoneId) {
  if (sims[zoneId]) _destroy(zoneId);

  const canvas  = document.getElementById(canvasId);
  const overlay = document.getElementById(overlayId);
  const wrap    = canvas.parentElement;

  const W = wrap.offsetWidth;
  const H = wrap.offsetHeight;

  canvas.style.display = 'none';

  overlay.style.cssText = `
    position: absolute; inset: 0;
    pointer-events: none;
    background: #111827;
    border-radius: 8px;
  `;

  const engine = Engine.create({ gravity: { y: 0 } });
  const runner = Runner.create();

  World.add(engine.world, [
    Bodies.rectangle(W / 2, H + WALL_T / 2,  W + WALL_T * 2, WALL_T, { isStatic: true }),
    Bodies.rectangle(-WALL_T / 2, H / 2,      WALL_T, H * 3,          { isStatic: true }),
    Bodies.rectangle(W + WALL_T / 2, H / 2,   WALL_T, H * 3,          { isStatic: true }),
    Bodies.rectangle(W / 2, -WALL_T / 2,      W + WALL_T * 2, WALL_T, { isStatic: true }),
  ]);

  Runner.run(runner, engine);

  sims[zoneId] = { engine, runner, overlay, W, H, bodies: [], cubes: [], rafId: null };
}

// ── Throw → pause → lineup ────────────────────────────────────────────────────
export function throwAndLine(zoneId, roll, colors, onDone) {
  const sim = sims[zoneId];
  if (!sim) return;

  _clearDice(sim);

  const { engine, overlay, W, H } = sim;
  const cx = W / 2;
  const cy = H / 2;

  const bodies = [];
  const cubes  = [];
  const spins  = [];

  roll.forEach((effect, i) => {
    const ox = (Math.random() - 0.5) * DIE * 2;
    const oy = (Math.random() - 0.5) * DIE * 2;

    const body = Bodies.rectangle(cx + ox, cy + oy, DIE * 2, DIE * 2, {
      restitution: 0.85,
      friction: 0.1,
      frictionAir: 0.001,
    });

    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 12;
    Body.setVelocity(body, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.6);

    Composite.add(engine.world, body);
    bodies.push(body);

    const { wrap: cubeWrap, cube } = makeCube(colors[i], effect.id);
    overlay.appendChild(cubeWrap);
    cubes.push({ wrap: cubeWrap, cube });
    spins.push({ rx: 0, ry: 0, rz: 0 });
  });

  sim.bodies = bodies;
  sim.cubes  = cubes;

  // Phase 1: full 3D spin on all axes during throw
  const syncLoop = () => {
    bodies.forEach((b, i) => {
      const w = b.angularVelocity * 15;
      spins[i].rx += w;
      spins[i].ry += w * 1.3;
      spins[i].rz += w * 0.7;

      cubes[i].wrap.style.left = b.position.x + 'px';
      cubes[i].wrap.style.top  = b.position.y + 'px';
      cubes[i].cube.style.transform =
        `rotateX(${spins[i].rx}deg) rotateY(${spins[i].ry}deg) rotateZ(${spins[i].rz}deg)`;
    });
    sim.rafId = requestAnimationFrame(syncLoop);
  };
  sim.rafId = requestAnimationFrame(syncLoop);

  // Phase 1 end: freeze physics, instantly go flat 2D
  setTimeout(() => {
    cancelAnimationFrame(sim.rafId);

    bodies.forEach(b => {
      Body.setVelocity(b, { x: 0, y: 0 });
      Body.setAngularVelocity(b, 0);
      Body.setStatic(b, true);
    });

    // Instantly reset to flat — no transition, no 3D, always readable
    bodies.forEach((b, i) => {
      cubes[i].wrap.style.transition = 'none';
      cubes[i].cube.style.transition = 'none';
      cubes[i].wrap.style.left = b.position.x + 'px';
      cubes[i].wrap.style.top  = b.position.y + 'px';
      cubes[i].cube.style.transform = 'none';
    });

    // Phase 2: pause, then lineup — position only
    setTimeout(() => {
      const order = [...roll.keys()].sort((a, b) =>
        roll[a].id < roll[b].id ? -1 : roll[a].id > roll[b].id ? 1 : 0
      );

      const step    = Math.min((W - DIE * 2) / roll.length, DIE * 2 + 14);
      const totalW  = step * (roll.length - 1);
      const startX  = (W - totalW) / 2;
      const targetY = H / 2;

      order.forEach((origIdx, pos) => {
        cubes[origIdx].wrap.style.transition =
          `left ${LINEUP_MS}ms ease, top ${LINEUP_MS}ms ease`;
        cubes[origIdx].wrap.style.left = (startX + pos * step) + 'px';
        cubes[origIdx].wrap.style.top  = targetY + 'px';
      });

      setTimeout(onDone, LINEUP_MS + 80);
    }, PAUSE_MS);

  }, THROW_MS);
}

// ── Static lineup (initial / restart) ────────────────────────────────────────
export function showLineup(zoneId, roll, colors) {
  const sim = sims[zoneId];
  if (!sim) return;

  _clearDice(sim);

  const { overlay, W, H } = sim;
  const step   = Math.min((W - DIE * 2) / roll.length, DIE * 2 + 14);
  const totalW = step * (roll.length - 1);
  const startX = (W - totalW) / 2;

  roll.forEach((effect, i) => {
    const { wrap, cube } = makeCube(colors[i], effect.id);

    wrap.style.left = (startX + i * step) + 'px';
    wrap.style.top  = (H / 2) + 'px';
    cube.style.transform = 'none';

    overlay.appendChild(wrap);
    sim.cubes.push({ wrap, cube });
  });
}

export function destroyAll() {
  Object.keys(sims).forEach(_destroy);
}

function _clearDice(sim) {
  cancelAnimationFrame(sim.rafId);
  sim.bodies.forEach(b => Composite.remove(sim.engine.world, b));
  sim.bodies = [];
  sim.cubes.forEach(({ wrap }) => wrap.remove());
  sim.cubes = [];
  sim.overlay.innerHTML = '';
}

function _destroy(zoneId) {
  const sim = sims[zoneId];
  if (!sim) return;
  cancelAnimationFrame(sim.rafId);
  Runner.stop(sim.runner);
  World.clear(sim.engine.world);
  Engine.clear(sim.engine);
  delete sims[zoneId];
}
