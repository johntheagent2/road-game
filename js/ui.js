/* UI glue: setup screen, turn flow, dice, question pop-ups, results. */
(function (root) {
  'use strict';

  var I = root.I18N, t = I.t, Engine = root.FFEngine, Store = root.Store, cfg = root.GAME_CONFIG;
  var ICONS = ['🧑‍🌾', '👨‍🌾', '👩‍🌾', '👨🏽‍🌾', '👩🏻‍🌾', '🧑🏾‍🌾', '👨🏻‍🌾', '👩🏿‍🌾'];
  var COLORS = ['#ef4444', '#3b82f6', '#16a34a', '#f59e0b', '#a855f7', '#0891b2'];
  var MIN_TEAMS = 2, MAX_TEAMS = 6;

  function $(id) { return document.getElementById(id); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- sound ---------- */

  var Sound = (function () {
    var dir = 'assets/sounds/', muted = false, bgWanted = false;
    try { muted = localStorage.getItem('fairfield.muted') === '1'; } catch (e) { /* ignore */ }
    function make(file, loop) { var a = new Audio(dir + file); a.loop = !!loop; a.preload = 'auto'; return a; }
    var bg = make('background-music.mp3', true); bg.volume = 0.3;
    var fx = {
      right: make('right-answer.mp3'), wrong: make('wrong-answer.mp3'),
      finish: make('first-place-finish-line.mp3'), board: make('score-board.mp3')
    };
    function safe(a) { try { var p = a.play(); if (p && p.catch) p.catch(function () { /* blocked until a click */ }); } catch (e) { /* ignore */ } }
    function stopFx() { Object.keys(fx).forEach(function (k) { fx[k].pause(); fx[k].currentTime = 0; }); }
    function syncBtn() {
      var b = $('btn-sound'); if (!b) return;
      b.textContent = muted ? '🔇' : '🔊'; b.classList.toggle('muted', muted);
    }
    return {
      play: function (name) { if (muted) return; stopFx(); safe(fx[name]); },
      startMusic: function () { bgWanted = true; if (!muted) safe(bg); },
      stopAll: function () { bgWanted = false; bg.pause(); stopFx(); },
      /** scoreboard: silence everything, then only the scoreboard track */
      scoreboard: function () { bgWanted = false; bg.pause(); stopFx(); if (!muted) safe(fx.board); },
      toggle: function () {
        muted = !muted;
        try { localStorage.setItem('fairfield.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
        if (muted) { bg.pause(); stopFx(); } else if (bgWanted) safe(bg);
        syncBtn();
      },
      syncBtn: syncBtn
    };
  })();

  function setDice(v) { $('dice').setAttribute('data-v', v); }

  /* ---------- content (defaults, overridden by saved edits) ---------- */

  function defaultBank() { return { main: clone(cfg.questions || []), tiebreak: clone(cfg.tiebreakQuestions || []) }; }
  function defaultLayout() { return cfg.layout.slice(); }

  var bank = Store.loadBank() || defaultBank();
  if (!Array.isArray(bank.main) || !Array.isArray(bank.tiebreak)) bank = defaultBank();
  var layout = Store.loadLayout();
  if (!Array.isArray(layout) || layout.length !== cfg.layout.length) layout = defaultLayout();
layout = layout.map(function (x) { return Engine.TILE_TYPES.indexOf(x) >= 0 ? x : 'question'; });

  var engine = new Engine({ layout: layout, bank: bank });
  var board = new root.FFBoard($('board'), I);

  var setup = Store.loadSetup() || {
    teams: [], shuffle: false,
    timerEnabled: !!(cfg.timer && cfg.timer.enabled), seconds: (cfg.timer && cfg.timer.seconds) || 30
  };
  if (!setup.teams || setup.teams.length < MIN_TEAMS) {
    setup.teams = [];
    for (var k = 0; k < 3; k++) setup.teams.push({ name: '', icon: ICONS[k], color: COLORS[k] });
  }
  // saved setups from before the farmer icons still hold vehicle emoji
  setup.teams.forEach(function (tm, i) { if (ICONS.indexOf(tm.icon) < 0) tm.icon = ICONS[i % ICONS.length]; });

  var busy = false, editorOpen = false, shownKey = null, timerHandle = null, boardBuilt = false;

  /* ---------- helpers ---------- */

  function toast(msg) {
    var el = $('toast');
    el.textContent = msg; el.classList.remove('hidden');
    clearTimeout(toast.h);
    toast.h = setTimeout(function () { el.classList.add('hidden'); }, 3200);
  }

  function teamName(tm, i) { return tm.name && tm.name.trim() ? tm.name.trim() : t('default_team', { n: i + 1 }); }

  function showScreen(name) {
    $('screen-setup').classList.toggle('hidden', name !== 'setup');
    $('screen-game').classList.toggle('hidden', name !== 'game');
  }

  /* ---------- setup screen ---------- */

  function renderSetup() {
    var h = '';
    setup.teams.forEach(function (tm, i) {
      h += '<div class="team-row" data-i="' + i + '">' +
        '<input class="t-name" maxlength="24" placeholder="' + esc(t('default_team', { n: i + 1 })) + '" value="' + esc(tm.name) + '" aria-label="' + esc(t('team_name')) + '">' +
        '<select class="t-icon" aria-label="icon">' +
        ICONS.map(function (ic) { return '<option' + (ic === tm.icon ? ' selected' : '') + '>' + ic + '</option>'; }).join('') +
        '</select>' +
        '<input class="t-color" type="color" value="' + esc(tm.color) + '" aria-label="color">' +
        '<button class="remove ghost" ' + (setup.teams.length <= MIN_TEAMS ? 'disabled' : '') + '>' + esc(t('remove')) + '</button></div>';
    });
    $('team-list').innerHTML = h;
    $('btn-add-team').disabled = setup.teams.length >= MAX_TEAMS;
    $('opt-shuffle').checked = !!setup.shuffle;
    $('opt-timer').checked = !!setup.timerEnabled;
    $('opt-seconds').value = setup.seconds;
    $('opt-seconds').disabled = !setup.timerEnabled;
  }

  $('team-list').addEventListener('input', function (e) {
    var row = e.target.closest('.team-row'); if (!row) return;
    var tm = setup.teams[+row.getAttribute('data-i')];
    if (e.target.classList.contains('t-name')) tm.name = e.target.value;
    if (e.target.classList.contains('t-color')) tm.color = e.target.value;
  });
  $('team-list').addEventListener('change', function (e) {
    var row = e.target.closest('.team-row'); if (!row) return;
    if (e.target.classList.contains('t-icon')) setup.teams[+row.getAttribute('data-i')].icon = e.target.value;
  });
  $('team-list').addEventListener('click', function (e) {
    if (!e.target.classList.contains('remove')) return;
    var i = +e.target.closest('.team-row').getAttribute('data-i');
    if (setup.teams.length > MIN_TEAMS) { setup.teams.splice(i, 1); renderSetup(); }
  });
  $('btn-add-team').onclick = function () {
    if (setup.teams.length >= MAX_TEAMS) return;
    var used = setup.teams.map(function (x) { return x.color; });
    var color = COLORS.filter(function (c) { return used.indexOf(c) < 0; })[0] || COLORS[setup.teams.length % COLORS.length];
    setup.teams.push({ name: '', icon: ICONS[setup.teams.length % ICONS.length], color: color });
    renderSetup();
  };
  $('opt-shuffle').onchange = function () { setup.shuffle = this.checked; };
  $('opt-timer').onchange = function () { setup.timerEnabled = this.checked; $('opt-seconds').disabled = !this.checked; };
  $('opt-seconds').onchange = function () { setup.seconds = Math.max(5, Math.min(600, parseInt(this.value, 10) || 30)); this.value = setup.seconds; };

  $('btn-start').onclick = function () {
    setup.teams.forEach(function (tm, i) { tm.name = teamName(tm, i); });
    Store.saveSetup(setup);
    engine.setLayout(layout);
    engine.setBank(bank);
    engine.start(setup.teams.map(function (tm, i) { return { id: i, name: tm.name, color: tm.color, icon: tm.icon }; }),
      { timerEnabled: setup.timerEnabled, timerSeconds: setup.seconds }, setup.shuffle);
    shownKey = null; boardBuilt = false;
    Sound.startMusic();
    render();
  };

  /* ---------- game flow ---------- */

  function closeGameModal() {
    stopTimer();
    if (!editorOpen) { $('modal').classList.add('hidden'); $('modal-body').innerHTML = ''; }
  }

  function finishers() { return (engine.s.winner != null ? 1 : 0) + (engine.s.second != null ? 1 : 0); }

  async function act(fn) {
    if (busy) return;
    busy = true;
    try {
      var homeBefore = finishers();
      fn();
      if (finishers() > homeBefore) Sound.play('finish');
      await board.play(engine.takeAnim());
    } finally { busy = false; }
    render();
  }

  async function doRoll() {
    if (busy || engine.s.phase !== 'awaitRoll') return;
    busy = true;
    $('btn-roll').disabled = true;
    var dice = $('dice');
    dice.classList.remove('settle');
    dice.classList.add('rolling');
    for (var i = 0; i < 14; i++) { setDice(1 + Math.floor(Math.random() * 6)); await wait(90); }
    dice.classList.remove('rolling');
    var homeBefore = finishers();
    var v = engine.roll();
    setDice(v);
    dice.classList.add('settle');
    if (finishers() > homeBefore) Sound.play('finish');
    await wait(350);
    try { await board.play(engine.takeAnim()); } finally { busy = false; }
    render();
  }

  $('btn-roll').onclick = doRoll;

  board.onTileClick = function (i) {
    if (busy) return;
    var s = engine.s;
    if (s.phase === 'awaitTile' && i === s.tile) act(function () { engine.resolveTile(); });
    else if (s.phase === 'choose' && s.options.indexOf(i) >= 0) act(function () { engine.chooseTile(i); });
  };

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (!$('modal').classList.contains('hidden')) return;
    if ($('screen-game').classList.contains('hidden')) return;
    if (e.code === 'Space') { e.preventDefault(); doRoll(); }
    else if (e.key === 'Enter' && engine.s.phase === 'awaitTile' && !busy) {
      e.preventDefault(); act(function () { engine.resolveTile(); });
    }
  });

  /* ---------- rendering ---------- */

  function render() {
    var s = engine.s;
    if (s.phase === 'setup') { showScreen('setup'); renderSetup(); closeGameModal(); return; }
    showScreen('game');

    if (!boardBuilt) { board.build(engine.tiles); boardBuilt = true; }
    board.syncTokens(s.teams);
    board.setHighlights(s.phase === 'awaitTile' ? 'click' : s.phase === 'choose' ? 'choose' : null, s.tile, s.options || []);

    // banner
    var cur = s.phase === 'results' ? engine.teamById(s.second != null ? s.second : s.winner) : engine.team();
    $('turn-banner').innerHTML = '<span class="chip" style="background:' + esc(cur.color) + '">' + esc(cur.icon) + '</span>' + esc(cur.name);

    // dice + hint
    if (s.lastRoll) setDice(s.lastRoll);
    $('btn-roll').disabled = busy || s.phase !== 'awaitRoll';
    var hints = { awaitRoll: 'hint_roll', awaitTile: 'hint_tile', choose: 'hint_choose', question: 'hint_question', results: 'hint_results' };
    $('hint').textContent = t(hints[s.phase] || 'hint_roll');

    // scoreboard
    $('scoreboard').innerHTML = s.teams.map(function (tm) {
      var where = tm.pos === 0 ? t('at_start') : tm.pos >= engine.finish ? t('at_finish') : t('tile_n', { n: tm.pos });
      var active = (s.phase !== 'results' && tm.id === cur.id) ? ' active' : '';
      return '<li class="' + active + '"><span class="chip" style="background:' + esc(tm.color) + '">' + esc(tm.icon) + '</span>' +
        '<span>' + esc(tm.name) + '</span><span class="where">' + esc(where) + '</span></li>';
    }).join('');

    // log (newest first)
    $('log').innerHTML = s.log.slice().reverse().map(function (l) {
      var p = l.p && l.p.tile ? Object.assign({}, l.p, { tile: t('tile_' + l.p.tile) }) : l.p;
      return '<li>' + esc(t(l.key, p)) + '</li>';
    }).join('');

    renderModal();
    $('btn-questions').disabled = busy;
    Store.saveGame({ state: engine.getState() });
  }

  function renderModal() {
    if (editorOpen) return;
    var s = engine.s, key;
    if (s.phase === 'question') key = 'q|' + s.current + '|' + JSON.stringify(s.question) + '|' + s.log.length;
    else if (s.phase === 'results') key = 'res';
    else { shownKey = null; closeGameModal(); return; }
    if (key === shownKey) return;
    shownKey = key;
    if (s.phase === 'results') resultsModal(); else questionModal();
  }

  /* ---------- question pop-up ---------- */

  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }

  function questionModal() {
    var s = engine.s, q = s.question;
    var team = engine.team();
    var body = $('modal-body');
    body.className = 'modal-body';
    var h = '<h2>' + esc(t('question_for', { name: team.name })) + '</h2>';

    var limit = q.timeLimit || (s.settings.timerEnabled ? s.settings.timerSeconds : 0);
    if (limit) h += '<div class="timer-label" id="timer-label"></div><div class="timer" id="timer"><div style="width:100%"></div></div>';

    h += '<div class="q-text">' + esc(I.txt(q.q)) + '</div>';
    var answerText = q.a != null ? I.txt(q.a) : (q.choices ? I.txt(q.choices[q.answer]) : '');
    if (q.choices) {
      h += '<div class="choices">' + q.choices.map(function (c, i) {
        return '<button data-c="' + i + '">' + String.fromCharCode(65 + i) + '. ' + esc(I.txt(c)) + '</button>';
      }).join('') + '</div>';
    } else {
      h += '<div id="ans" class="q-answer hidden"><strong>' + esc(t('answer_label')) + ':</strong> ' + esc(answerText || '—') + '</div>' +
        '<div class="actions" id="act-reveal"><button id="btn-reveal" class="primary big">' + esc(t('reveal')) + '</button></div>' +
        '<div class="actions hidden" id="act-judge"><span class="muted" style="margin-right:auto">' + esc(t('correct_hint')) + ' · ' + esc(t('wrong_hint')) + '</span>' +
        '<button id="btn-correct" class="ok big">✔ ' + esc(t('correct')) + '</button>' +
        '<button id="btn-wrong" class="bad big">✘ ' + esc(t('wrong')) + '</button></div>';
    }
    body.innerHTML = h;
    $('modal').classList.remove('hidden');

    function submit(correct) {
      closeGameModal();
      act(function () { engine.answer(correct); });
    }
    function judged(correct) { Sound.play(correct ? 'right' : 'wrong'); submit(correct); }

    if (q.choices) {
      [].forEach.call(body.querySelectorAll('[data-c]'), function (b) {
        b.onclick = function () {
          stopTimer();
          var pick = +b.getAttribute('data-c'), ok = pick === q.answer;
          Sound.play(ok ? 'right' : 'wrong');
          [].forEach.call(body.querySelectorAll('[data-c]'), function (x) {
            x.disabled = true;
            if (+x.getAttribute('data-c') === q.answer) x.classList.add('right');
          });
          if (!ok) b.classList.add('miss');
          wait(1400).then(function () { submit(ok); });
        };
      });
    } else {
      $('btn-reveal').onclick = function () {
        $('ans').classList.remove('hidden'); $('act-reveal').classList.add('hidden'); $('act-judge').classList.remove('hidden');
      };
      $('btn-correct').onclick = function () { judged(true); };
      $('btn-wrong').onclick = function () { judged(false); };
    }

    stopTimer();
    if (limit) {
      var left = limit, label = $('timer-label'), bar = $('timer');
      var tick = function () {
        label.textContent = t('time_left', { n: left });
        bar.firstChild.style.width = (100 * left / limit) + '%';
        bar.classList.toggle('low', left <= 5);
      };
      tick();
      timerHandle = setInterval(function () {
        left--;
        if (left > 0) { tick(); return; }
        stopTimer();
        label.textContent = t('time_up'); bar.firstChild.style.width = '0%';
        Sound.play('wrong');
        [].forEach.call(body.querySelectorAll('button'), function (x) { x.disabled = true; });
        wait(1200).then(function () { closeGameModal(); act(function () { engine.timeout(); }); });
      }, 1000);
    }
  }

  /* ---------- results ---------- */

  function resultsModal() {
    var s = engine.s, body = $('modal-body');
    body.className = 'modal-body rank';
    var ranked = [engine.teamById(s.winner)];
    if (s.second != null) ranked.push(engine.teamById(s.second));
    var rest = s.teams.filter(function (tm) { return tm.id !== s.winner && tm.id !== s.second; })
      .sort(function (x, y) { return y.pos - x.pos; });
    // podium order: 2nd | 1st | 3rd | 4th ...
    var order = ranked.map(function (tm, i) { return { tm: tm, rank: i + 1 }; })
      .concat(rest.map(function (tm) { return { tm: tm, rank: 3 }; })); // everyone else shares 3rd
    if (order.length >= 2) order.splice(1, 0, order.shift());
    var cls = ['', 'first', 'second', 'third'];
    var h = '<div class="rank-title"><h2>' + esc(t('results_title')) + '</h2></div><div class="rank-cards">';
    order.forEach(function (o, k) {
      var tm = o.tm, where = tm.pos >= engine.finish ? t('rank_finished') : t('tile_n', { n: tm.pos });
      h += '<div class="rank-card ' + (cls[o.rank] || '') + '" style="animation-delay:' + (0.12 * k) + 's">' +
        '<div class="art" data-rank="' + o.rank + '" style="background:linear-gradient(160deg,' + esc(tm.color) + ',' + esc(tm.color) + 'aa)">' +
        '<span>' + esc(tm.icon) + '</span></div>' +
        '<div class="info"><strong>' + esc(tm.name) + '</strong><span>' + esc(where) + '</span></div></div>';
    });
    h += '</div><div class="actions"><button id="res-close">' + esc(t('close')) + '</button>' +
      '<button id="res-again" class="primary big">' + esc(t('play_again')) + '</button></div>';
    body.innerHTML = h;
    $('modal').classList.remove('hidden');
    $('res-close').onclick = function () { $('modal').classList.add('hidden'); };
    $('res-again').onclick = toSetup;
    Sound.scoreboard();
  }

  function toSetup() {
    stopTimer();
    Sound.stopAll();
    engine.setState({ phase: 'setup' });
    Store.clearGame();
    shownKey = null; boardBuilt = false;
    $('modal').classList.add('hidden');
    render();
  }

  /* ---------- top bar ---------- */

  $('btn-newgame').onclick = function () {
    var p = engine.s.phase;
    if (p !== 'setup' && p !== 'results' && !confirm(t('confirm_newgame'))) return;
    toSetup();
  };

  $('btn-sound').onclick = function () { Sound.toggle(); };

  $('btn-fullscreen').onclick = function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch (e) { /* unsupported */ }
  };

  $('btn-questions').onclick = function () {
    if (busy) return;
    editorOpen = true;
    FFEditor.open({
      bank: bank, layout: layout.slice(),
      toast: toast,
      onChange: function (b, l) {
        bank = b; layout = l;
        Store.saveBank(bank); Store.saveLayout(layout);
        engine.setBank(bank);
      },
      reset: function () {
        Store.resetContent();
        bank = defaultBank(); layout = defaultLayout();
        engine.setBank(bank);
        return { bank: bank, layout: layout.slice() };
      },
      onClose: function () { editorOpen = false; shownKey = null; if (engine.s.phase !== 'setup') render(); }
    });
  };

  function setLang(l) {
    I.lang = l;
    Store.saveLang(l);
    $('lang-vi').classList.toggle('active', l === 'vi');
    $('lang-en').classList.toggle('active', l === 'en');
    I.applyStatic();
    if (engine.s.phase === 'setup') renderSetup();
    else { boardBuilt = false; shownKey = null; render(); }
    FFEditor.refresh();
  }
  $('lang-vi').onclick = function () { setLang('vi'); };
  $('lang-en').onclick = function () { setLang('en'); };

  /* ---------- boot ---------- */

  var saved = Store.loadGame();
  if (saved && saved.state && saved.state.phase && saved.state.phase !== 'setup' && saved.state.teams) {
    engine.setState(saved.state);
    toast(t('resume_hint'));
    if (saved.state.phase !== 'results') {
      document.addEventListener('click', function once() { document.removeEventListener('click', once); Sound.startMusic(); });
    }
  }
  Sound.syncBtn();
  setLang(Store.loadLang() || 'vi');
})(window);
