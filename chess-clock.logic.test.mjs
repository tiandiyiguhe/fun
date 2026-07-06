import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadEngine() {
  const html = readFileSync(new URL("./chess-clock.html", import.meta.url), "utf8");
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, "script block exists");
  const sandbox = {
    console,
    performance: { now: () => 0 },
    window: {}
  };
  vm.runInNewContext(match[1], sandbox);
  assert.ok(sandbox.window.ChessClockEngine, "clock engine is exposed");
  return sandbox.window.ChessClockEngine;
}

test("required time presets are exposed", () => {
  const engine = loadEngine();

  assert.deepEqual(engine.PRESETS.map((preset) => preset.label), ["1+0", "3+2", "5+5", "10+0"]);
});

test("Fischer mode adds increment to the player who completed the turn", () => {
  const engine = loadEngine();
  let clock = engine.createClock({ baseSeconds: 180, incrementSeconds: 2, incrementMode: "fischer" });

  clock = engine.startClock(clock, 0, 1000);
  clock = engine.switchTurn(clock, 4000);

  assert.equal(clock.active, 1);
  assert.equal(clock.players[0].timeMs, 179000);
  assert.equal(clock.players[1].timeMs, 180000);
});

test("Bronstein mode restores up to the configured increment after a move", () => {
  const engine = loadEngine();
  let clock = engine.createClock({ baseSeconds: 300, incrementSeconds: 5, incrementMode: "bronstein" });

  assert.equal(clock.incrementMode, "bronstein");

  clock = engine.startClock(clock, 0, 0);
  clock = engine.switchTurn(clock, 3000);
  assert.equal(clock.players[0].timeMs, 300000);

  clock = engine.switchTurn(clock, 11000);
  assert.equal(clock.players[1].timeMs, 297000);
});

test("simple delay burns delay before main time", () => {
  const engine = loadEngine();
  let clock = engine.createClock({ baseSeconds: 60, incrementSeconds: 3, incrementMode: "delay" });

  clock = engine.startClock(clock, 0, 100);
  assert.equal(engine.applyTick(clock, 2100).players[0].timeMs, 60000);
  assert.equal(engine.applyTick(clock, 5100).players[0].timeMs, 58000);
});

test("flagged player is recorded when main time expires", () => {
  const engine = loadEngine();
  let clock = engine.createClock({ baseSeconds: 1, incrementSeconds: 0, incrementMode: "fischer" });

  clock = engine.startClock(clock, 0, 0);
  clock = engine.applyTick(clock, 1200);

  assert.equal(clock.running, false);
  assert.equal(clock.flagged, 0);
  assert.equal(clock.players[0].timeMs, 0);
});
