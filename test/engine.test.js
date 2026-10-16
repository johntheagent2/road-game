// Run with: node test/engine.test.js
const assert = require('assert');
const Engine = require('../js/engine.js');

global.window = {};
require('../config/game-config.js');
const cfg = global.window.GAME_CONFIG;

function make(layout) {
  const e = new Engine({
    layout: layout || cfg.layout,
        bank: { main: cfg.questions, tiebreak: cfg.tiebreakQuestions }
  });
  e.start([
    { name: 'A', color: '#f00', icon: 'x' },
    { name: 'B', color: '#0f0', icon: 'y' },
    { name: 'C', color: '#00f', icon: 'z' }
  ], {});
  return e;
}
const pos = (e, i) => e.s.teams[i].pos;
let n = 0;
function test(name, fn) { fn(); n++; console.log('ok -', name); }

test('layout has 14 question + 10 function tiles and 26 tiles total', () => {
  assert.strictEqual(cfg.layout.length, 24);
  assert.strictEqual(cfg.layout.filter(t => t === 'question').length, 14);
  assert.strictEqual(cfg.layout.filter(t => t !== 'question').length, 10);
  const e = make();
  assert.strictEqual(e.tiles.length, 26);
  assert.strictEqual(e.finish, 25);
});

test('function counts match the sketch', () => {
  const c = {};
  cfg.layout.forEach(t => c[t] = (c[t] || 0) + 1);
  assert.deepStrictEqual([c.rollAgain, c.jump3, c.back1, c.back2, c.choose5], [2, 3, 3, 1, 1]);
});

test('roll moves forward and waits for tile click', () => {
  const e = make();
  e.roll(2);
  assert.strictEqual(pos(e, 0), 2);
  assert.strictEqual(e.s.phase, 'awaitTile');
  assert.strictEqual(e.roll(3), null); // cannot roll twice
});

test('correct answer stays, wrong answer goes back 1, then next team', () => {
  const e = make();
  e.roll(2); e.resolveTile();               // tile 2 = question
  assert.strictEqual(e.s.phase, 'question');
  e.answer(true);
  assert.strictEqual(pos(e, 0), 2);
  assert.strictEqual(e.s.current, 1);
  e.roll(1); e.resolveTile(); e.answer(false);
  assert.strictEqual(pos(e, 1), 0);         // 1 -> back 1 -> 0
  assert.strictEqual(e.s.current, 2);
});

test('moving back never goes below Start', () => {
  const e = make(['back2'].concat(cfg.layout.slice(1)));
  e.roll(1); e.resolveTile();
  assert.strictEqual(pos(e, 0), 0);
});

test('jump3 landing on another function tile chains into it', () => {
  const e = make();
  e.roll(5); e.resolveTile();               // tile 5 jump3 -> 8 (rollAgain) triggers too
  assert.strictEqual(pos(e, 0), 8);
  assert.strictEqual(e.s.phase, 'awaitTile');
  assert.strictEqual(e.s.tile, 8);
  e.resolveTile();                          // rollAgain -> extra roll for same team
  assert.strictEqual(e.s.phase, 'awaitRoll');
  assert.strictEqual(e.s.current, 0);
});

test('function tile landing on a question tile asks that question', () => {
  const e = make();
  e.roll(7); e.resolveTile();               // tile 7 back1 -> 6 (question)
  assert.strictEqual(pos(e, 0), 6);
  assert.strictEqual(e.s.phase, 'awaitTile');
  e.resolveTile();
  assert.strictEqual(e.s.phase, 'question');
  e.answer(true);                           // correct: stay on 6
  assert.strictEqual(pos(e, 0), 6);
  assert.strictEqual(e.s.current, 1);
});

test('wrong answer on a chained question moves back 1 and does not ask again', () => {
  const e = make();
  e.roll(7); e.resolveTile(); e.resolveTile(); // now answering tile 6
  e.answer(false);                          // 6 -> 5 (jump3 function tile triggers)
  assert.strictEqual(pos(e, 0), 5);
  assert.strictEqual(e.s.phase, 'awaitTile');
});

test('wrong answer landing on a function tile triggers it', () => {
  const e = make();
  e.s.teams[0].pos = 7;                     // 7 = back1; wrong answer elsewhere
  e.s.current = 0; e.s.phase = 'question'; e.s.question = { q: 'x', a: 'y' };
  e.answer(false);                          // 7 -> 6 (question) ends turn
  assert.strictEqual(pos(e, 0), 6);
  e.s.teams[1].pos = 5; e.s.phase = 'question'; e.s.current = 1; e.s.question = { q: 'x', a: 'y' };
  e.tiles[4] = 'back2';
  e.answer(false);                          // 5 -> 4 (back2) triggers
  assert.strictEqual(e.s.phase, 'awaitTile');
  e.resolveTile();
  assert.strictEqual(pos(e, 1), 2);
});

test('chains are capped so a looping layout cannot hang a turn', () => {
  const e = make();
  e.tiles[1] = 'jump3'; e.tiles[4] = 'back2'; e.tiles[2] = 'back1'; // cycle 1 -> 4 -> 2 -> 1 ...
  e.s.teams[0].pos = 1; e.s.phase = 'awaitTile'; e.s.tile = 1;
  let guard = 0;
  while (e.s.phase === 'awaitTile' && guard++ < 100) e.resolveTile();
  assert.ok(guard < 100, 'loop never ended');
  assert.strictEqual(e.s.phase, 'awaitRoll');
  assert.strictEqual(e.s.current, 1);       // turn passed on after the cap
});

test('rollAgain gives exactly one extra roll', () => {
  const e = make();
  e.roll(4); e.resolveTile();               // tile 4 rollAgain
  assert.strictEqual(e.s.current, 0);
  assert.strictEqual(e.s.phase, 'awaitRoll');
  e.roll(4); e.resolveTile();               // tile 8 rollAgain again -> capped, turn ends
  assert.strictEqual(pos(e, 0), 8);
  assert.strictEqual(e.s.current, 1);
});

test('choose5 offers next five tiles only', () => {
  const e = make();
  e.s.teams[0].pos = 9;
  e.roll(4); e.resolveTile();               // 13 choose5
  assert.strictEqual(e.s.phase, 'choose');
  assert.deepStrictEqual(e.s.options, [14, 15, 16, 17, 18]);
  assert.strictEqual(e.chooseTile(20), false);
  e.chooseTile(17);
  assert.strictEqual(pos(e, 0), 17);
  assert.strictEqual(e.s.phase, 'awaitTile'); // 17 is a question tile: must be answered
  e.resolveTile(); e.answer(true);
  assert.strictEqual(e.s.current, 1);
});

test('first home takes 1st and leaves the race; second home ends the game', () => {
  const e = make();
  e.s.teams[0].pos = 23; e.s.teams[1].pos = 5; e.s.teams[2].pos = 9;
  e.roll(6);
  assert.strictEqual(pos(e, 0), 25);
  assert.strictEqual(e.s.winner, 0);
  assert.strictEqual(e.s.phase, 'awaitRoll');
  assert.strictEqual(e.team().name, 'B');
  e.roll(1); e.resolveTile(); e.answer(true);
  assert.strictEqual(e.team().name, 'C');       // A is skipped from now on
  e.s.teams[2].pos = 24;
  e.roll(1);
  assert.strictEqual(e.s.phase, 'results');
  assert.strictEqual(e.s.second, 2);
});

test('jump onto Finish wins', () => {
  const e = make();
  e.s.teams[0].pos = 22;
  e.s.current = 0; e.s.phase = 'awaitTile';
  e.tiles[22] = 'jump3';
  e.resolveTile();
  assert.strictEqual(e.s.winner, 0);
});

test('multiple-choice answers are auto-marked', () => {
  const e = make();
  e.roll(2); e.resolveTile();
  e.s.question = { q: 'x', choices: ['a', 'b'], answer: 1 };
  assert.strictEqual(e.answerChoice(1), true);
  assert.strictEqual(pos(e, 0), 2);
});

test('questions are drawn without repeats until the pool is exhausted', () => {
  const e = make();
  const seen = new Set();
  for (let i = 0; i < cfg.questions.length; i++) seen.add(JSON.stringify(e._draw('main')));
  assert.strictEqual(seen.size, cfg.questions.length);
  assert.ok(e._draw('main')); // reshuffles
});

test('state survives a JSON round trip', () => {
  const e = make();
  e.roll(3);
  const e2 = make();
  e2.setState(JSON.parse(JSON.stringify(e.getState())));
  assert.strictEqual(e2.s.teams[0].pos, 3);
  assert.strictEqual(e2.s.phase, 'awaitTile');
});

test('animation queue records step moves', () => {
  const e = make();
  e.roll(3);
  const a = e.takeAnim();
  assert.deepStrictEqual(a.map(m => [m.from, m.to]), [[0, 3]]);
  assert.strictEqual(e.takeAnim().length, 0);
});

console.log('\n' + n + ' tests passed');
