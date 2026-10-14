/* SVG board: winding road of tiles, title, decorations, animated tokens. */
(function (root) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var CW = 108, CH = 96, M = 12, GAP = 4;
  var COLS = 9, ROWS = 5;

  var ICONS = {
    start: '🏁', finish: '🏆', question: '❓',
    rollAgain: '🎲', jump3: '⏩', back1: '⏪', back2: '⏪', choose5: '👆'
  };
  var SLOTS = [[-32, 0], [0, 0], [32, 0], [-32, -26], [0, -26], [32, -26]];

  /* grid cell (col,row) for each tile index: a serpentine road.
     row 0 left->right, connector down the right edge, row 2 right->left,
     connector down the left edge, row 4 left->right (Finish ends it). */
  function buildPath(total) {
    var p = [], c;
    for (c = 0; c < COLS; c++) p.push([c, 0]);
    p.push([COLS - 1, 1]);
    for (c = COLS - 1; c >= 0; c--) p.push([c, 2]);
    p.push([0, 3]);
    c = 0;
    while (p.length < total) p.push([c++, 4]);
    return p.slice(0, total);
  }

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function Board(svg, I18N) {
    this.svg = svg;
    this.i18n = I18N;
    this.onTileClick = null;
    this.tokens = {};
    this.tileEls = [];
  }

  Board.prototype.center = function (tile, slot) {
    var c = this.path[tile];
    var x = M + c[0] * CW + CW / 2, y = M + c[1] * CH + CH / 2;
    var s = SLOTS[slot % SLOTS.length];
    return { x: x + s[0], y: y + 28 + s[1] };
  };

  /** Draw the static board. tiles = engine.tiles (start, 24 types, finish). */
  Board.prototype.build = function (tiles) {
    var t = this.i18n.t, self = this, svg = this.svg;
    this.tiles = tiles;
    this.path = buildPath(tiles.length);
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 ' + (COLS * CW + 2 * M) + ' ' + (ROWS * CH + 2 * M));

    // backdrop road strip
    var bg = el('g', {}, svg);
    el('rect', { x: 0, y: 0, width: COLS * CW + 2 * M, height: ROWS * CH + 2 * M, rx: 22, class: 'board-bg' }, bg);

    // title panel in the free strip of row 1
    var tx = M + 1 * CW + 6, ty = M + 1 * CH + 8, tw = (COLS - 2) * CW - 12, th = CH - 16;
    el('rect', { x: tx, y: ty, width: tw, height: th, rx: 18, class: 'title-panel' }, svg);
    var title = el('text', { x: tx + tw / 2, y: ty + th / 2 + 16, class: 'title-text', 'text-anchor': 'middle' }, svg);
    title.textContent = 'Fairfield Road';

    // decorations (cactus + suitcase + sun) in the free strips
    var d1 = el('text', { x: M + 6.6 * CW, y: M + 4 * CH + 70, class: 'deco' }, svg); d1.textContent = '🌵';
    var d2 = el('text', { x: M + 7.9 * CW, y: M + 4 * CH + 66, class: 'deco small' }, svg); d2.textContent = '🧳';
    var d3 = el('text', { x: M + 1.2 * CW, y: M + 3 * CH + 62, class: 'deco small' }, svg); d3.textContent = '🏜️';
    var d4 = el('text', { x: M + 3.2 * CW, y: M + 3 * CH + 62, class: 'deco small' }, svg); d4.textContent = '🚗 🛣️';

    this.tileEls = [];
    tiles.forEach(function (type, i) {
      var c = self.path[i];
      var x = M + c[0] * CW + GAP / 2, y = M + c[1] * CH + GAP / 2;
      var g = el('g', { class: 'tile tile-' + type, 'data-i': i }, svg);
      var rect = el('rect', { x: x, y: y, width: CW - GAP, height: CH - GAP, rx: 10 }, g);
      var num = el('text', { x: x + 8, y: y + 17, class: 'tile-num' }, g);
      num.textContent = (i === 0 || i === tiles.length - 1) ? '' : i;
      var icon = el('text', { x: x + (CW - GAP) / 2, y: y + 40, class: 'tile-icon', 'text-anchor': 'middle' }, g);
      icon.textContent = ICONS[type] || '';
      var label = el('text', { x: x + (CW - GAP) / 2, y: y + 56, class: 'tile-label', 'text-anchor': 'middle' }, g);
      var key = (type === 'start' || type === 'finish' || type === 'question') ? 'tile_' + type : 'tile_short_' + type;
      label.textContent = t(key);
      shrinkLabel(label);
      g.addEventListener('click', function () { if (self.onTileClick) self.onTileClick(i); });
      self.tileEls.push(g);
    });

    this.tokenLayer = el('g', { class: 'tokens' }, svg);
    this.tokens = {};
  };

  function shrinkLabel(label) {
    var n = label.textContent.length;
    label.setAttribute('font-size', n > 12 ? 10 : n > 9 ? 11.5 : 13);
  }

  /** Update tile highlight classes. mode: 'click' | 'choose' | null. */
  Board.prototype.setHighlights = function (mode, tile, options) {
    this.tileEls.forEach(function (g, i) {
      g.classList.remove('pulse', 'option', 'current');
      if (mode === 'click' && i === tile) g.classList.add('pulse');
      if (mode === 'choose' && options.indexOf(i) >= 0) g.classList.add('option');
    });
  };

  /** Create/refresh tokens from engine state (no animation). */
  Board.prototype.syncTokens = function (teams) {
    var self = this;
    var ids = {};
    teams.forEach(function (tm, idx) {
      ids[tm.id] = true;
      var tok = self.tokens[tm.id];
      if (!tok) {
        var g = el('g', { class: 'token' }, self.tokenLayer);
        el('circle', { r: 15, fill: tm.color, class: 'token-ring' }, g);
        var tx = el('text', { class: 'token-icon', 'text-anchor': 'middle', y: 6 }, g);
        tok = self.tokens[tm.id] = { g: g, text: tx, slot: idx };
      }
      tok.slot = idx;
      tok.text.textContent = tm.icon;
      tok.g.firstChild.setAttribute('fill', tm.color);
      self.place(tm.id, tm.pos, false);
    });
    Object.keys(this.tokens).forEach(function (id) {
      if (!ids[id]) { self.tokens[id].g.remove(); delete self.tokens[id]; }
    });
  };

  Board.prototype.place = function (teamId, tile, animate) {
    var tok = this.tokens[teamId];
    if (!tok) return;
    var p = this.center(tile, tok.slot);
    tok.g.style.transition = animate ? 'transform 0.22s ease-in-out' : 'none';
    tok.g.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
    tok.tile = tile;
  };

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /** Play queued moves one after another; tokens hop tile by tile. */
  Board.prototype.play = async function (moves) {
    for (var m = 0; m < moves.length; m++) {
      var mv = moves[m], tok = this.tokens[mv.team];
      if (!tok) continue;
      tok.g.parentNode.appendChild(tok.g); // bring to front
      if (mv.kind === 'warp') {
        tok.g.classList.add('warping');
        this.place(mv.team, mv.to, true);
        await wait(520);
        tok.g.classList.remove('warping');
      } else {
        var dir = mv.to > mv.from ? 1 : -1;
        for (var i = mv.from + dir; dir > 0 ? i <= mv.to : i >= mv.to; i += dir) {
          this.place(mv.team, i, true);
          await wait(260);
        }
      }
      await wait(120);
    }
  };

  root.FFBoard = Board;
})(window);
