/*
 * Fairfield Road - rules engine. No DOM code: state + actions only.
 * Works in the browser (window.FFEngine) and in Node (module.exports) for tests.
 *
 * Phases: setup -> awaitRoll -> awaitTile -> (question | choose) -> awaitRoll ...
 *         -> tiebreak -> results
 */
(function (root) {
  'use strict';

  var EFFECTS = ['rollAgain', 'jump3', 'back1', 'back2', 'choose5'];
  var MAX_CHAIN = 8; // safety cap on chained function tiles in one turn
  var TILE_TYPES = ['question'].concat(EFFECTS);

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /**
   * opts: { layout: [24 tile types], bank: {main: [], tiebreak: []}, rng }
   */
  function Engine(opts) {
    this.rng = opts.rng || Math.random;
    this.setLayout(opts.layout);
    this.bank = { main: [], tiebreak: [] };
    this.setBank(opts.bank || {});
    this.s = { phase: 'setup' };
    this.anim = [];
  }

  Engine.prototype.setLayout = function (layout) {
    // unknown/removed tile types (e.g. old saves) fall back to plain question tiles
    var clean = layout.map(function (x) { return TILE_TYPES.indexOf(x) >= 0 ? x : 'question'; });
    this.tiles = ['start'].concat(clean, ['finish']);
    this.finish = this.tiles.length - 1;
  };

  Engine.prototype.setBank = function (bank) {
    if (bank.main) this.bank.main = bank.main;
    if (bank.tiebreak) this.bank.tiebreak = bank.tiebreak;
  };

  /* ---------- state ---------- */

  Engine.prototype.getState = function () { return JSON.parse(JSON.stringify(this.s)); };
  Engine.prototype.setState = function (st) {
    this.s = JSON.parse(JSON.stringify(st));
    this.anim = [];
    if (this.s.layout) this.setLayout(this.s.layout); // keep the layout the game started with
  };
  Engine.prototype.takeAnim = function () { var a = this.anim; this.anim = []; return a; };

  /** teams: [{id?, name, color, icon}]; settings: {timerEnabled, timerSeconds} */
  Engine.prototype.start = function (teams, settings, shuffleOrder) {
    var list = teams.map(function (t, i) {
      return { id: t.id != null ? t.id : i, name: t.name, color: t.color, icon: t.icon, pos: 0 };
    });
    if (shuffleOrder) list = shuffle(list, this.rng);
    this.s = {
      phase: 'awaitRoll',
      layout: this.tiles.slice(1, -1),
      teams: list,
      current: 0,
      rerolled: false,
      chain: 0,
      lastRoll: null,
      tile: null,
      options: [],
      question: null,
      tb: null,
      winner: null,
      second: null,
      decks: { main: {}, tiebreak: {} },
      settings: { timerEnabled: !!(settings && settings.timerEnabled),
                  timerSeconds: (settings && settings.timerSeconds) || 30 },
      log: []
    };
    this.anim = [];
    this._log('log_start', { name: list[0].name });
  };

  Engine.prototype.team = function () { return this.s.teams[this.s.current]; };
  Engine.prototype.teamById = function (id) {
    for (var i = 0; i < this.s.teams.length; i++) if (this.s.teams[i].id === id) return this.s.teams[i];
    return null;
  };

  Engine.prototype._log = function (key, p) {
    this.s.log.push({ key: key, p: p || {} });
    if (this.s.log.length > 80) this.s.log.shift();
  };

  Engine.prototype._moveTo = function (team, to, kind) {
    to = Math.max(0, Math.min(this.finish, to));
    if (to !== team.pos) this.anim.push({ team: team.id, from: team.pos, to: to, kind: kind || 'step' });
    team.pos = to;
  };

  Engine.prototype._draw = function (pool) {
    var list = this.bank[pool];
    // no dedicated tie-break questions: reuse the normal ones
    if (pool === 'tiebreak' && !list.length) list = this.bank.main;
    var n = list.length;
    if (!n) return null;
    var d = this.s.decks[pool];
    if (!d.order || d.order.length !== n || d.ptr >= n) {
      var idx = []; for (var i = 0; i < n; i++) idx.push(i);
      d.order = shuffle(idx, this.rng);
      d.ptr = 0;
    }
    return JSON.parse(JSON.stringify(list[d.order[d.ptr++]]));
  };

  Engine.prototype._endTurn = function () {
    var s = this.s;
    s.current = (s.current + 1) % s.teams.length;
    s.rerolled = false;
    s.chain = 0;
    s.tile = null;
    s.options = [];
    s.question = null;
    s.phase = 'awaitRoll';
    this._log('log_turn', { name: this.team().name });
  };

  /** Returns true if the team has reached Finish (and starts the tie-break). */
  Engine.prototype._checkFinish = function (team) {
    if (team.pos < this.finish) return false;
    var s = this.s;
    s.winner = team.id;
    s.tile = null;
    s.options = [];
    s.question = null;
    this._log('log_win', { name: team.name });
    var n = s.teams.length, start = s.teams.indexOf(team), queue = [];
    for (var k = 1; k < n; k++) queue.push(s.teams[(start + k) % n].id);
    s.tb = { queue: queue, idx: 0 };
    var q = this._draw('tiebreak');
    if (!q) { this._finishTiebreak(null); return true; }
    s.question = q;
    s.phase = 'tiebreak';
    return true;
  };

  /**
   * After a team is moved by an effect or a wrong answer: finish check, then
   * if it landed on a function tile that tile triggers too (chain); landing on
   * a question/start tile ends the turn.
   */
  Engine.prototype._afterMove = function (team, askQuestion) {
    if (this._checkFinish(team)) return;
    var s = this.s, type = this.tiles[team.pos];
    if (askQuestion && type === 'question') {
      // moved here by a function tile: the question must be answered too
      s.tile = team.pos;
      s.options = [];
      s.question = null;
      s.phase = 'awaitTile';
      this._log('log_chain', { name: team.name, tile: type });
      return;
    }
    if (EFFECTS.indexOf(type) >= 0 && s.chain < MAX_CHAIN) {
      s.chain++;
      s.tile = team.pos;
      s.options = [];
      s.question = null;
      s.phase = 'awaitTile';
      this._log('log_chain', { name: team.name, tile: type });
      return;
    }
    this._endTurn();
  };

  Engine.prototype._finishTiebreak = function (secondId) {
    var s = this.s, self = this;
    if (secondId == null) {
      // nobody answered correctly: furthest along the board takes 2nd place
      var best = null;
      s.tb.queue.forEach(function (id) {
        var t = self.teamById(id);
        if (!best || t.pos > best.pos) best = t;
      });
      secondId = best ? best.id : null;
    }
    s.second = secondId;
    s.question = null;
    s.phase = 'results';
    if (secondId != null) this._log('log_second', { name: this.teamById(secondId).name });
  };

  /* ---------- actions ---------- */

  /** Roll the die and move. `force` (1-6) is for tests only. */
  Engine.prototype.roll = function (force) {
    var s = this.s;
    if (s.phase !== 'awaitRoll') return null;
    var v = force || (1 + Math.floor(this.rng() * 6));
    var team = this.team();
    s.lastRoll = v;
    s.chain = 0;
    this._log('log_roll', { name: team.name, n: v });
    this._moveTo(team, team.pos + v, 'step');
    if (this._checkFinish(team)) return v;
    s.tile = team.pos;
    s.phase = 'awaitTile';
    return v;
  };

  /** The host clicks the tile the team landed on. */
  Engine.prototype.resolveTile = function () {
    var s = this.s;
    if (s.phase !== 'awaitTile') return;
    var team = this.team(), type = this.tiles[team.pos];
    switch (type) {
      case 'question':
        var q = this._draw('main');
        if (!q) { this._log('log_noquestion'); this._endTurn(); return; }
        s.question = q;
        s.phase = 'question';
        return;
      case 'rollAgain':
        if (s.rerolled) { this._log('log_rerollcap', { name: team.name }); this._endTurn(); return; }
        s.rerolled = true;
        s.tile = null;
        s.phase = 'awaitRoll';
        this._log('log_rollagain', { name: team.name });
        return;
      case 'jump3':
        this._log('log_jump3', { name: team.name });
        this._moveTo(team, team.pos + 3, 'step');
        break;
      case 'back1':
        this._log('log_back', { name: team.name, n: 1 });
        this._moveTo(team, team.pos - 1, 'step');
        break;
      case 'back2':
        this._log('log_back', { name: team.name, n: 2 });
        this._moveTo(team, team.pos - 2, 'step');
        break;
      case 'choose5':
        s.options = [];
        for (var k = 1; k <= 5 && team.pos + k <= this.finish; k++) s.options.push(team.pos + k);
        if (!s.options.length) { this._endTurn(); return; }
        s.phase = 'choose';
        this._log('log_choose', { name: team.name });
        return;
      default:
        break;
    }
    this._afterMove(team, true); // moves chain onto the next function / question tile
  };

  /** "Pick 1 of the next 5". */
  Engine.prototype.chooseTile = function (n) {
    var s = this.s;
    if (s.phase !== 'choose' || s.options.indexOf(n) < 0) return false;
    var team = this.team();
    this._log('log_chosen', { name: team.name, n: n });
    this._moveTo(team, n, 'step');
    this._afterMove(team, true);
    return true;
  };

  /** Resolve the current question: correct = stay, wrong (or timeout) = back 1. */
  Engine.prototype.answer = function (correct) {
    var s = this.s;
    if (s.phase === 'tiebreak') return this._tiebreakAnswer(correct);
    if (s.phase !== 'question') return;
    var team = this.team();
    if (correct) {
      this._log('log_correct', { name: team.name });
    } else {
      this._log('log_wrong', { name: team.name });
      this._moveTo(team, team.pos - 1, 'step');
      this._afterMove(team);
      return;
    }
    this._endTurn();
  };

  Engine.prototype.answerChoice = function (i) {
    var q = this.s.question;
    if (!q || q.answer == null) return null;
    var ok = (i === q.answer);
    this.answer(ok);
    return ok;
  };

  Engine.prototype.timeout = function () { this.answer(false); };

  Engine.prototype._tiebreakAnswer = function (correct) {
    var s = this.s, tb = s.tb;
    var team = this.teamById(tb.queue[tb.idx]);
    if (correct) {
      this._log('log_tb_correct', { name: team.name });
      this._finishTiebreak(team.id);
      return;
    }
    this._log('log_tb_wrong', { name: team.name });
    tb.idx++;
    if (tb.idx >= tb.queue.length) { this._finishTiebreak(null); return; }
    var q = this._draw('tiebreak');
    if (!q) { this._finishTiebreak(null); return; }
    s.question = q;
  };

  Engine.prototype.tiebreakTeam = function () {
    var tb = this.s.tb;
    return tb ? this.teamById(tb.queue[tb.idx]) : null;
  };

  Engine.TILE_TYPES = TILE_TYPES;
  Engine.EFFECTS = EFFECTS;
  Engine.shuffle = shuffle;

  root.FFEngine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
