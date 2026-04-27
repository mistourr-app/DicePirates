# Game Design Document — Pirate Ship Battle (Prototype)

## 1. Overview

| Field | Value |
|---|---|
| Genre | Turn-based dice battle |
| Platform | PWA (Progressive Web App) |
| Tech Stack | HTML5, JavaScript, CSS (adaptive layout), Matter.js (headless physics) |
| Language | English |
| Status | Rapid prototype |

---

## 2. Core Concept

Two pirate-era sailing ships face off in a turn-based battle. Each ship has a set of 6 colored cannons, each represented by a die. Players and AI take turns rolling their dice sets. Dice faces produce combat effects — attacks, fire damage, and shield boosts. The battle ends when one ship's health reaches 0.

---

## 3. Screen Layout

```
+------------------------------------------+
|                                          |
|   TOP 1/3 — Battle Scene                |
|   (two ships, health bars, shields)      |
|                                          |
+------------------------------------------+
|   Enemy Dice Zone (top half)             |
|   CSS 3D dice overlay                    |
|                ──────                    |
|   [turn flash label on divider]          |
|                ──────                    |
|   Player Dice Zone (bottom half)         |
|   CSS 3D dice overlay                    |
|   [ Roll Cannons button ]                |
+------------------------------------------+
```

### 3.1 Battle Scene (top third)
- Visual representation of two ships facing each other
- Prototype: emoji placeholder ships (⛵)
- Each ship displays: Health bar, Shield bar, Active fire damage indicator
- Ships reserved for future sprite/animation replacement

### 3.2 Dice Area (bottom two thirds)
- Split into two equal zones separated by a divider line
- **Enemy zone (top):** CSS 3D dice for AI roll
- **Player zone (bottom):** CSS 3D dice for player roll + Roll button
- Turn label flashes on the divider between zones at the start of each turn and stays visible until the turn ends
- No event log — all feedback is visual through dice and health/shield bars
- Matter.js canvas is hidden — physics runs headless, rendering is pure CSS/HTML

---

## 4. Ships & Stats

| Stat | Player Ship | AI Ship |
|---|---|---|
| Health | 100 | 100 |
| Shield | 30 | 30 |
| Cannons / Dice | 6 | 6 |

### 4.1 Damage Resolution Order
1. Incoming damage is subtracted from Shield first
2. Once Shield reaches 0, remaining damage is subtracted from Health
3. Shield can be restored by dice effects during the game
4. Shield does **not** regenerate between rounds on its own
5. Health is capped at 100 — cannot exceed starting value

### 4.2 Win / Loss Conditions
- Player Health reaches 0 → **Player loses**
- AI Health reaches 0 → **Player wins**

---

## 5. Dice

Each ship has 6 dice. Each die has 6 faces. Each face produces one effect.

### 5.1 Dice Colors (cannon identity)
| Die # | Color |
|---|---|
| 1 | Red |
| 2 | Orange |
| 3 | Yellow |
| 4 | Green |
| 5 | Blue |
| 6 | Purple |

### 5.2 Face Effects

| Effect | Icon | Face # | Description |
|---|---|---|---|
| Attack 5 | 💥 | 1 | Deal 5 damage to opponent ship |
| Attack 10 | 💣 | 2 | Deal 10 damage to opponent ship |
| Attack 20 | 🔥 | 3 | Deal 20 damage to opponent ship |
| Fire Cannonballs | ☄️ | 4 | Deal 5 damage per round for 3 rounds to opponent ship |
| Shield +5 | 🛡️ | 5 | Add 5 points to own ship's shield |
| Shield +10 | ⚔️ | 6 | Add 10 points to own ship's shield |

### 5.3 Die Face Distribution (per die, prototype default)

All 6 dice share the same face layout. Each face maps to a CSS 3D cube face:

| Face # | CSS face | Effect |
|---|---|---|
| 1 | Front | Attack 5 |
| 2 | Back | Attack 10 |
| 3 | Right | Attack 20 |
| 4 | Left | Fire Cannonballs |
| 5 | Top | Shield +5 |
| 6 | Bottom | Shield +10 |

> Individual die customization per cannon color is a future feature.

### 5.4 Combo Bonus (Matching Effects)

If multiple dice in a single roll produce the **same effect**, each die beyond the first adds **+5% to the base value** of that effect.

**Formula:** `total = base × (1 + 0.05 × (count - 1))`

**Examples:**
- 2× Attack 10 → `10 × 1.05 = 10.5` → rounds to 11
- 3× Attack 10 → `10 × 1.10 = 11`
- 3× Shield +5 → `5 × 1.10 = 5.5` → rounds to 6

> Combo bonus applies per effect group within a single roll. Fire Cannonballs combo increases the per-round damage value of that stack entry.

---

## 6. Turn Structure

### 6.1 Turn Order
1. **Player turn** always goes first
2. Alternates: Player → AI → Player → AI → ...
3. Round counter increments after each full Player + AI cycle

### 6.2 Player Turn Flow
1. Turn label **"⚓ Player's Turn"** fades in on the divider and stays visible
2. Roll button activates
3. Player presses **Roll Cannons**
4. Fire damage ticks on the player ship (before effects resolve)
5. Dice throw animation plays in the player zone (see Section 9)
6. After dice settle and line up, effects resolve:
   - Shield effects applied to player ship
   - Attack effects applied to AI ship
   - Fire Cannonballs registered as a new stack on AI ship
7. Health/shield bars update; game over check runs
8. Turn label fades out; short pause; AI turn begins

### 6.3 AI Turn Flow
1. Turn label **"💀 Enemy's Turn"** fades in and stays visible
2. Short delay (~400ms), then AI rolls automatically
3. Fire damage ticks on the AI ship
4. Dice throw animation plays in the enemy zone
5. Same effect resolution as player turn, targeting player ship
6. Turn label fades out; round counter increments; player turn begins

### 6.4 Fire Damage Tick Timing
- Ticks at the **start of the affected ship's turn**, before dice effects resolve
- Duration: **3 rounds** (a round = one full Player + AI cycle)
- Multiple fire stacks tracked independently, summed each tick
- Stack removed when `rounds` reaches 0

---

## 7. Effects Resolution Detail

### 7.1 Damage Application
```
// Fire ticks first, separately, at turn start
// Then attack damage from dice:

incoming_damage = total attack damage from this roll

if ship.shield >= incoming_damage:
    ship.shield -= incoming_damage
else:
    overflow = incoming_damage - ship.shield
    ship.shield = 0
    ship.health -= overflow

if ship.health <= 0:
    trigger game over
```

### 7.2 Fire Cannonballs Stack
- Each Fire Cannonballs effect creates: `{ damage: 5, rounds: 3 }`
- Multiple stacks tracked independently, summed on each tick
- Combo bonus increases the `damage` value of that stack entry
- Stack removed when `rounds` reaches 0

---

## 8. UI Elements

| Element | Description |
|---|---|
| Ship health bar | Green bar, shows current/max HP (e.g. 87/100) |
| Ship shield bar | Blue bar, shows current shield value |
| Fire indicator | Badge on ship panel showing total fire damage/round |
| Turn flash label | Fades in at turn start, stays until turn ends, fades out |
| Enemy dice zone | Top half of dice area — CSS 3D dice for AI |
| Player dice zone | Bottom half of dice area — CSS 3D dice for player |
| Roll button | Activates on player turn only; disabled otherwise |
| Game over screen | Full-screen overlay: "🏴☠️ Victory!" or "💀 Defeated!" + restart |

---

## 9. Dice Physics & Animation

### 9.1 Architecture
- **Matter.js** runs headless (no canvas renderer) — computes positions and collisions only
- **CSS 3D cubes** rendered as HTML `div` elements in an overlay on top of the zone
- Each die = one Matter.js rectangle body + one CSS 3D cube element
- Gravity is **disabled** (`y: 0`) — top-down table view, dice scatter horizontally

### 9.2 Cube Structure
- Each cube is a `div` with `transform-style: preserve-3d` and 6 face `div` children
- Face transforms: front `translateZ`, back `rotateY(180°)`, right `rotateY(90°)`, left `rotateY(-90°)`, top `rotateX(90°)`, bottom `rotateX(-90°)`
- Result face has brighter background (`#1e3a5f`) and stronger inset glow
- Non-result faces use dark background (`#1a2540`) with subtle glow
- All faces are fully opaque

### 9.3 Throw Animation — 3 Phases

**Phase 1 — Scatter** (`THROW_MS = 2200ms`)
- All 6 dice spawn near the center of the zone with small random offset
- Each die gets a random outward velocity (speed 10–22 px/frame, random angle)
- Angular velocity: random ±0.3 rad/frame
- Physics parameters: `restitution 0.65`, `friction 0.04`, `frictionAir 0.018`
- Boundary walls on all 4 sides keep dice inside the zone (`WALL_T = 60px`)
- CSS 3D spin accumulates each frame proportional to `angularVelocity × 18`
- Spin axes: ry accumulates every frame, rx flips direction randomly per frame

**Phase 2 — Freeze** (`PAUSE_MS = 400ms`)
- Physics frozen: velocities and angular velocity set to 0, bodies made static
- Dice remain at their scattered positions
- No animation — player sees the result positions briefly

**Phase 3 — Lineup** (`LINEUP_MS = 500ms`)
- Dice animate to an evenly spaced row at vertical center of the zone
- Sorted by effect ID so matching effects group together
- Each cube rotates to show its result face toward the camera
- Rotation target is normalized: `round(accumulated° / 360) × 360 + faceAngle`
  — this ensures the cube always rotates to the face via the shortest clean path, never snapping through an edge or corner

### 9.4 Tunable Parameters

| Parameter | Value | Effect |
|---|---|---|
| `DIE` | 22 | Half-size of die body and cube (px). Cube renders at 44×44px |
| `THROW_MS` | 2200 | Duration of scatter phase (ms) |
| `PAUSE_MS` | 400 | Pause between scatter end and lineup start (ms) |
| `LINEUP_MS` | 500 | Duration of lineup animation (ms) |
| `restitution` | 0.65 | Bounciness on wall/die collision (0 = no bounce, 1 = perfect) |
| `friction` | 0.04 | Surface friction |
| `frictionAir` | 0.018 | Air resistance — how quickly dice slow down |
| `speed` | 10–22 | Initial scatter speed range (px/frame) |
| `angularVelocity` | ±0.3 | Initial spin intensity |
| `spin multiplier` | 18 | How fast CSS faces change during scatter |
| `gravity.y` | 0 | Top-down view — no vertical gravity |

### 9.5 Initial State (before first roll)
- Both zones show a static lineup of 6 placeholder dice (all Shield +5 face)
- No physics active — pure CSS positioning

---

## 10. Prototype Scope (In / Out)

### In Scope
- Full turn-based battle loop (async/await sequential flow)
- All 6 dice effects
- Combo bonus mechanic
- Fire damage over time with stacking
- Shield / Health damage resolution
- AI random dice roll
- Win / Loss detection and restart
- CSS 3D dice with Matter.js headless physics
- Adaptive layout (mobile + desktop)
- PWA manifest + service worker (offline capable)

### Out of Scope (future)
- Ship sprite art and animations
- Sound effects and music
- Different die face distributions per cannon color
- AI strategy (non-random)
- Multiple levels or enemy ships
- Player progression / unlocks
- Custom die graphics (replacing emoji faces)

---

## 11. File Structure

```
/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── style.css
├── js/
│   ├── game.js       — core game state (ships, health, shield, fire stacks, log)
│   ├── dice.js       — dice definitions, roll logic, combo bonus formula
│   ├── combat.js     — damage resolution, shield absorption, fire stack ticks
│   ├── physics.js    — CSS 3D cubes + Matter.js headless physics per zone
│   ├── ui.js         — ship bar rendering, turn flash label, game over overlay
│   └── app.js        — entry point, async turn loop, event listeners
└── assets/
    └── icons/        — PWA icons (placeholder)
```

> `ai.js` is present but unused — AI logic is now inline in `app.js`.

---

## 12. Open Questions / Future Decisions

| # | Question | Status |
|---|---|---|
| 1 | Individual die face distributions per cannon color | Deferred |
| 2 | AI strategy beyond random rolling | Deferred |
| 3 | Ship sprite art style and animation format | Deferred |
| 4 | Sound effects and music | Deferred |
| 5 | Shield regeneration between rounds | **No — dice effects only** |
| 6 | Health cap | **Capped at 100** |
| 7 | Replace emoji die faces with custom sprite graphics | **Pending — designer ready** |
