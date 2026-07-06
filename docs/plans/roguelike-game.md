# Roguelike Dungeon Crawler — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Parallelize independent tasks.

**Goal:** Build a complete web-based roguelike dungeon crawler as a single self-contained `index.html` file with procedural dungeons, turn-based combat, items, fog of war, and taste-skill polished UI.

**Architecture:** Single HTML file with embedded CSS and vanilla JavaScript. No frameworks, no build step. Canvas-based game rendering + DOM-based HUD overlay. All game state in a single GameState object.

**Tech Stack:** HTML5 Canvas, vanilla JS, CSS Grid/Flexbox for HUD.

---

### Task 1: Project scaffold — HTML shell + Canvas + CSS

**Objective:** Create the index.html skeleton with dark theme CSS, canvas for game rendering, and sidebar HUD layout.

**Files:**
- Create: `index.html`

**Step 1: Write the shell**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dungeon Crawler</title>
  <style>
    /* Dark theme base */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #0a0a0f; color: #c8c8d0; 
      font-family: 'Courier New', monospace;
      display: flex; height: 100vh; overflow: hidden;
    }
    #game-container { 
      flex: 1; display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    canvas { 
      image-rendering: pixelated;
      border: 2px solid #2a2a3a;
      box-shadow: 0 0 40px rgba(100, 80, 200, 0.15);
    }
    #hud {
      width: 280px; background: #111118;
      border-left: 1px solid #2a2a3a;
      padding: 20px; display: flex; flex-direction: column; gap: 16px;
    }
    #hud h2 { 
      color: #a090d0; font-size: 14px; text-transform: uppercase;
      letter-spacing: 2px; border-bottom: 1px solid #2a2a3a; padding-bottom: 8px;
    }
    .stat { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
    .stat-label { color: #7a7a90; }
    .stat-value { color: #d0c0f0; font-weight: bold; }
    .hp-bar { 
      height: 6px; background: #2a1a1a; border-radius: 3px; margin-top: 4px;
    }
    .hp-fill { height: 100%; background: #c04040; border-radius: 3px; transition: width 0.3s; }
    #message-log {
      flex: 1; overflow-y: auto; font-size: 12px; color: #6a6a80;
      border-top: 1px solid #2a2a3a; padding-top: 12px;
    }
    #message-log .msg { margin: 2px 0; }
    #message-log .msg.combat { color: #c06060; }
    #message-log .msg.item { color: #60a060; }
    #message-log .msg.level { color: #c0a040; }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="game"></canvas>
  </div>
  <div id="hud">
    <h2>⚔️ Dungeon Crawler</h2>
    <div id="stats"></div>
    <div id="inventory-section">
      <h2>🎒 Inventory</h2>
      <div id="inventory"></div>
    </div>
    <div id="message-log"></div>
  </div>
  <script src="#" data-main></script>
</body>
</html>
```

**Step 2: Verify** — Open the file, confirm dark theme layout with canvas area and HUD sidebar.

---

### Task 2: Dungeon generator — BSP room placement + corridors

**Objective:** Procedurally generate dungeon floors with rooms connected by corridors.

**Files:**
- Modify: `index.html` (add JS dungeon generation)

**Spec:**
- Map size: 60x40 tiles
- BSP algorithm to partition space into rooms (6-12 per floor)
- Room size: 5-10 width × 4-8 height
- Connect rooms with L-shaped corridors
- Tile types: WALL(0), FLOOR(1), STAIRS(2), DOOR(3)
- Place stairs down in the furthest room from spawn

**Step 1: Add DungeonGen class**
- `generate(seed, floor)` returns 2D array
- `placeRooms()` — BSP partition
- `connectRooms()` — corridors between room centers
- `placeStairs()` — furthest room from player start
- `getRandomFloorTile()` — for item/enemy placement

**Step 2: Add `renderMap(ctx, map, visible)` function**
- Draw each tile at tileSize (16px)
- Wall = dark gray #1a1a2e, Floor = #222238
- Stairs = yellow ▼ marker
- Only render tiles in visible set (fog of war support later)

**Step 3: Verify** — Console log map array, confirm rooms + corridors + stairs.

---

### Task 3: Player entity + movement + fog of war

**Objective:** Player rendered on map, moves with arrow keys/WASD, line-of-sight fog of war.

**Files:**
- Modify: `index.html`

**Spec:**
- Player: `{x, y, hp: 100, maxHp: 100, attack: 10, defense: 5, level: 1, xp: 0}`
- Move: WASD/arrows, one tile per keypress, blocked by walls
- FOV: Bresenham raycasting, radius 8
- Visible tiles computed each move; only explored tiles shown dimmed, unseen tiles invisible
- Bump into enemy = attack

**Step 1: Add `Player` object and `movePlayer(dx, dy)`**
- Check target tile not wall
- Check if enemy on target → combat
- Update position, recompute FOV

**Step 2: Add `computeFOV(x, y, radius)`**
- Cast rays in all directions
- Use Bresenham line algorithm
- Stop when hitting wall
- Return Set of visible `{x,y}` strings

**Step 3: Update renderMap to use FOV**
- Visible tiles: full color
- Explored (previously visible) tiles: dim #111118
- Unexplored: solid black

**Step 4: Add `renderPlayer(ctx)`** — Draw @ symbol or character sprite in player color

**Step 5: Add keyboard handler** — Listen for arrow keys + WASD, prevent default, call movePlayer

---

### Task 4: Enemy entities + AI

**Objective:** Multiple enemy types spawn in rooms, move toward player when visible, attack on contact.

**Files:**
- Modify: `index.html`

**Spec:**
- Enemy types:
  - `rat`: hp 15, atk 3, def 1, xp 10, color #806040
  - `skeleton`: hp 30, atk 8, def 3, xp 25, color #c0c0c0
  - `dark_mage`: hp 20, atk 15, def 1, xp 40, color #8040c0
  - `demon`: hp 60, atk 20, def 8, xp 80, color #c02020 (deeper floors)
- Spawn 3-6 enemies per floor, in rooms (not corridors), not on player spawn
- AI: if player visible (in FOV range 6), move toward player (simple pathfinding: move along whichever axis has greater distance, avoid walls). Otherwise wander randomly every other turn.
- Bump-to-attack: when player moves into enemy tile, player attacks. Enemy counter-attacks on their turn.

**Step 1: Define `EnemyType` table and `spawnEnemy(type, x, y)**
**Step 2: Add `enemyTurn()` — each enemy acts after player moves**
**Step 3: Add `renderEnemies(ctx, enemies, visible)`**
**Step 4: Add scaling: deeper floors = more/harder enemies**

---

### Task 5: Combat system

**Objective:** Damage calculation, death handling, XP reward, level up.

**Files:**
- Modify: `index.html`

**Spec:**
- Damage = attacker.atk - defender.def (minimum 1)
- When enemy dies: grant XP, remove from array, log message
- When player HP ≤ 0: game over screen
- XP thresholds: 30/60/100/150/220/...
- Level up: +15 maxHP, full heal, +3 atk, +1 def
- Log combat messages to message log

**Step 1: `calculateDamage(attacker, defender)` function**
**Step 2: `playerAttack(enemy)` and `enemyAttack(enemy)` functions**
**Step 3: `checkLevelUp()` — compare xp to thresholds, level up**
**Step 4: `gameOver()` — show overlay with score (floor reached, enemies killed)**

---

### Task 6: Items + inventory

**Objective:** Items spawn in rooms, player picks up by walking over, inventory management.

**Files:**
- Modify: `index.html`

**Spec:**
- Items:
  - `health_potion`: heal 30 HP, consumable
  - `sword_+1`: +5 atk, equip
  - `sword_+2`: +10 atk, equip
  - `armor_+1`: +3 def, equip
  - `armor_+2`: +6 def, equip
- 2-4 items per floor, placed on random floor tiles in rooms
- Walk over to pick up → added to inventory
- Inventory: 10 slots max, displayed in HUD
- Use potion: click or press 1-9, auto-use when picked up if HP not full
- Equipment: auto-equip better items, show equipped weapon/armor in stats

**Step 1: `Item` class and item type definitions**
**Step 2: `pickupItem()` — detect player standing on item, add to inventory**
**Step 3: `useItem(index)` — equip weapon/armor or consume potion**
**Step 4: `renderInventory()` — update HUD inventory display**
**Step 5: Item pickup log messages**

---

### Task 7: Floor progression + stairs + game loop

**Objective:** Descend stairs to next floor, regenerate dungeon, increase difficulty.

**Files:**
- Modify: `index.html`

**Spec:**
- Player walks onto stairs tile → prompt "Descend to floor N+1?"
- Confirm: reset map with new seed, keep player stats/inventory, place player at spawn
- Floor number displayed in HUD
- Difficulty scaling: each floor adds +1 to enemy spawn count, enemy HP scales × 1.1 per floor
- Score = floor × 100 + enemies killed × 10 + items collected × 5

**Step 1: `descendStairs()` function**
**Step 2: `nextFloor()` — regenerate map, increase difficulty**
**Step 3: Floor counter in HUD**
**Step 4: Score tracking**

---

### Task 8: Taste-skill polish — animations, particles, typography

**Objective:** Add juice: smooth movement transitions, combat sparks, level-up particles, refined typography.

**Files:**
- Modify: `index.html`

**Spec:**
- Player movement: smooth slide animation (lerp over 100ms)
- Combat: damage numbers float up and fade
- Item pickup: brief glow effect
- Level up: screen flash + particles
- Death: screen shake + fade to black
- Font: import 'Fira Code' or use system mono
- Subtle scanline overlay on canvas for retro CRT feel
- Transitions with cubic-bezier easing

**Step 1: Add `Animator` class for tween management**
**Step 2: Add damage number particle system**
**Step 3: Add screen effects (flash, shake)**
**Step 4: Import Google Font + apply to HUD**
**Step 5: CRT scanline CSS overlay**

---

### Execution Order

```
Phase 1 (sequential): Task 1 → Task 2 → Task 3
Phase 2 (parallel):   Task 4 || Task 5 || Task 6
Phase 3 (sequential): Task 7
Phase 4 (final):      Task 8
```

Tasks 4, 5, 6 are independent (different code sections in the same file) — dispatch 3 subagents in parallel, then merge and resolve conflicts.
