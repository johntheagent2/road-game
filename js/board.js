/* SVG board: a winding asphalt road whose tiles are highway signs, plus title gantry, scenery, animated tokens. */
(function (root) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var CW = 112, CH = 138, M = 14;
  var SIGN_LIFT = 11; // signs sit this far above the cell centre, leaving room for tokens below
  var COLS = 9, ROWS = 5;

  /* bonus tiles are yellow warning diamonds, setbacks are orange work-zone diamonds */
  var DIAMOND = { rollAgain: 'bonus', jump3: 'bonus', choose5: 'bonus', back1: 'setback', back2: 'setback' };

  /* token offsets from the tile centre: first three line up under the sign, the rest stack above */
  var SLOTS = [[-38, 46], [0, 46], [38, 46], [-19, 27], [19, 27], [0, 8]];

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

  function cellCenter(c) {
    return { x: M + c[0] * CW + CW / 2, y: M + c[1] * CH + CH / 2 };
  }

  function Board(svg, I18N) {
    this.svg = svg;
    this.i18n = I18N;
    this.onTileClick = null;
    this.tokens = {};
    this.tileEls = [];
  }

  Board.prototype.center = function (tile, slot) {
    var c = cellCenter(this.path[tile]);
    var s = SLOTS[slot % SLOTS.length];
    return { x: c.x + s[0], y: c.y + s[1] };
  };

  /* ---- sign pieces ---- */

  function diamond(g, cx, cy, kind) {
    el('polygon', { class: 'dia-face dia-' + kind, points: ptsDiamond(cx, cy, 38) }, g);
    el('polygon', { class: 'dia-rule', points: ptsDiamond(cx, cy, 31) }, g);
  }
  function ptsDiamond(cx, cy, r) {
    return [cx, cy - r, cx + r, cy, cx, cy + r, cx - r, cy].join(' ');
  }

  /* the pictogram inside a diamond; chevron count = number of tiles moved */
  function symbol(g, type, cx, cy) {
    var s = el('g', { class: 'sym', transform: 'translate(' + cx + ',' + cy + ')' }, g);
    var i;
    if (type === 'rollAgain') {
      el('rect', { x: -13, y: -13, width: 26, height: 26, rx: 6, class: 'sym-line' }, s);
      [[-6, -6], [6, -6], [0, 0], [-6, 6], [6, 6]].forEach(function (p) {
        el('circle', { cx: p[0], cy: p[1], r: 2.4, class: 'sym-fill' }, s);
      });
    } else if (type === 'jump3' || type === 'back1' || type === 'back2') {
      var n = type === 'jump3' ? 3 : type === 'back1' ? 1 : 2;
      var dir = type === 'jump3' ? 1 : -1;
      var step = 10, start = -((n - 1) * step) / 2;
      for (i = 0; i < n; i++) {
        var x = start + i * step;
        el('polyline', { points: (x - 4 * dir) + ',-10 ' + (x + 4 * dir) + ',0 ' + (x - 4 * dir) + ',10', class: 'sym-line chevron' }, s);
      }
    } else if (type === 'choose5') {
      for (i = 0; i < 5; i++) {
        el('circle', { cx: -16 + i * 8, cy: 0, r: 3.3, class: i === 2 ? 'sym-fill' : 'sym-line dot' }, s);
      }
      el('polyline', { points: '-5,-11 0,-17 5,-11', class: 'sym-line chevron' }, s);
    }
  }

  function plaque(g, cx, y, text) {
    el('rect', { x: cx - 42, y: y, width: 84, height: 17, rx: 4, class: 'plaque' }, g);
    var t = el('text', { x: cx, y: y + 12.5, class: 'plaque-text', 'text-anchor': 'middle' }, g);
    t.textContent = text;
    var n = text.length;
    t.setAttribute('font-size', n > 12 ? 10 : n > 9 ? 11 : 12);
  }

  function guideSign(g, cx, cy, extraClass) {
    el('rect', { x: cx - 46, y: cy - 54, width: 92, height: 74, rx: 10, class: 'sign-edge' }, g);
    el('rect', { x: cx - 42.5, y: cy - 50.5, width: 85, height: 67, rx: 7, class: 'sign-face ' + (extraClass || '') }, g);
  }

  function numberTab(g, cx, cy, n) {
    el('rect', { x: cx - 52, y: cy - 58, width: 28, height: 18, rx: 4, class: 'tab' }, g);
    var t = el('text', { x: cx - 38, y: cy - 44.5, class: 'tab-text', 'text-anchor': 'middle' }, g);
    t.textContent = n;
  }

  function checker(g, cx, cy) {
    var x0 = cx - 40, y0 = cy - 48, r, c;
    for (r = 0; r < 4; r++) for (c = 0; c < 10; c++) {
      el('rect', { x: x0 + c * 8, y: y0 + r * 8, width: 8, height: 8, class: (r + c) % 2 ? 'chk-w' : 'chk-b' }, g);
    }
  }

  /** Draw the static board. tiles = engine.tiles (start, 24 types, finish). */
  Board.prototype.build = function (tiles) {
    var t = this.i18n.t, self = this, svg = this.svg;
    var W = COLS * CW + 2 * M, H = ROWS * CH + 2 * M;
    this.tiles = tiles;
    this.path = buildPath(tiles.length);
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    el('rect', { x: 0, y: 0, width: W, height: H, rx: 22, class: 'board-verge' }, svg);

    // road: white edge lines, asphalt, yellow centre dashes
    var pts = this.path.map(function (c) { var p = cellCenter(c); return p.x + ',' + p.y; });
    var end = cellCenter(this.path[this.path.length - 1]);
    pts.push((end.x + CW / 2) + ',' + end.y);
    pts = pts.join(' ');
    el('polyline', { points: pts, class: 'road-edge' }, svg);
    el('polyline', { points: pts, class: 'road-surface' }, svg);
    el('polyline', { points: pts, class: 'road-centre' }, svg);

    this.scenery(svg);
    this.gantry(svg);

    this.tileEls = [];
    tiles.forEach(function (type, i) {
      var c = cellCenter(self.path[i]), cx = c.x, cy = c.y - SIGN_LIFT;
      var g = el('g', { class: 'tile tile-' + type, 'data-i': i }, svg);
      el('rect', { x: cx - CW / 2, y: c.y - CH / 2, width: CW, height: CH, class: 'hit' }, g);
      var key = (type === 'start' || type === 'finish' || type === 'question') ? 'tile_' + type : 'tile_short_' + type;
      var label = t(key);
      var last = i === tiles.length - 1;

      if (type === 'start') {
        guideSign(g, cx, cy);
        var st = el('text', { x: cx, y: cy - 22, class: 'sign-text big', 'text-anchor': 'middle' }, g);
        st.textContent = label;
        el('path', { d: 'M' + (cx - 20) + ',' + (cy - 2) + ' H' + (cx + 18) + ' M' + (cx + 8) + ',' + (cy - 11) + ' L' + (cx + 19) + ',' + (cy - 2) + ' L' + (cx + 8) + ',' + (cy + 7), class: 'sign-arrow' }, g);
      } else if (last) {
        el('rect', { x: cx - 46, y: cy - 54, width: 92, height: 74, rx: 10, class: 'finish-sign' }, g);
        checker(g, cx, cy);
        var ft = el('text', { x: cx, y: cy + 10, class: 'finish-text', 'text-anchor': 'middle' }, g);
        ft.textContent = label;
      } else if (type === 'question') {
        guideSign(g, cx, cy);
        numberTab(g, cx, cy, i);
        var q = el('text', { x: cx, y: cy - 8, class: 'sign-q', 'text-anchor': 'middle' }, g);
        q.textContent = '?';
        var ql = el('text', { x: cx, y: cy + 10, class: 'sign-text', 'text-anchor': 'middle' }, g);
        ql.textContent = label;
      } else {
        diamond(g, cx, cy - 18, DIAMOND[type] || 'bonus');
        symbol(g, type, cx, cy - 18);
        numberTab(g, cx, cy, i);
        plaque(g, cx, cy + 17, label);
      }
      g.addEventListener('click', function () { if (self.onTileClick) self.onTileClick(i); });
      self.tileEls.push(g);
    });

    this.tokenLayer = el('g', { class: 'tokens' }, svg);
    this.tokens = {};
  };

  /* overhead title sign across the free strip beside the road */
  Board.prototype.gantry = function (svg) {
    var cx = M + 4 * CW, cy = M + 1 * CH + CH / 2, w = 600, h = 78;
    var g = el('g', { class: 'gantry' }, svg);
    el('rect', { x: cx - w / 2 + 40, y: cy + h / 2 - 2, width: 12, height: 22, class: 'post' }, g);
    el('rect', { x: cx + w / 2 - 52, y: cy + h / 2 - 2, width: 12, height: 22, class: 'post' }, g);
    el('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 12, class: 'sign-edge' }, g);
    el('rect', { x: cx - w / 2 + 4, y: cy - h / 2 + 4, width: w - 8, height: h - 8, rx: 8.5, class: 'sign-face' }, g);
    var title = el('text', { x: cx, y: cy + 15, class: 'title-text', 'text-anchor': 'middle' }, g);
    title.textContent = "Let's rock the road";
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d) {
      el('circle', { cx: cx + d[0] * (w / 2 - 14), cy: cy + d[1] * (h / 2 - 14), r: 2.6, class: 'bolt' }, g);
    });
  };

  function cactusShape(parent, x, y, scale, arms) {
    var g = el('g', { class: 'cactus', transform: 'translate(' + x + ',' + y + ') scale(' + scale + ')' }, parent);
    var parts = [['M0,0 V-58', 20], ['M0,-20 H-17 V-38', 10]];
    if (arms > 1) parts.push(['M0,-32 H17 V-48', 10]);
    parts.forEach(function (a) { el('path', { d: a[0], class: 'cactus-line', 'stroke-width': a[1] + 5 }, g); });
    parts.forEach(function (a) { el('path', { d: a[0], class: 'cactus-fill', 'stroke-width': a[1] }, g); });
  }

  /* square bale, origin at bottom centre */
  function squareBale(parent, x, y) {
    var g = el('g', { class: 'bale', transform: 'translate(' + x + ',' + y + ')' }, parent);
    el('rect', { x: -30, y: -34, width: 60, height: 34, rx: 5, class: 'bale-body' }, g);
    [-24, -14, 14, 24].forEach(function (lx) { el('line', { x1: lx, y1: -29, x2: lx, y2: -5, class: 'bale-straw' }, g); });
    el('rect', { x: -14, y: -34, width: 4, height: 34, class: 'bale-strap' }, g);
    el('rect', { x: 10, y: -34, width: 4, height: 34, class: 'bale-strap' }, g);
  }

  /* round bale seen end-on, origin at bottom centre */
  function roundBale(parent, x, y) {
    var g = el('g', { class: 'bale', transform: 'translate(' + x + ',' + y + ')' }, parent);
    el('circle', { cx: 0, cy: -26, r: 26, class: 'bale-body' }, g);
    [19, 12, 5].forEach(function (r) { el('circle', { cx: 0, cy: -26, r: r, class: 'bale-ring' }, g); });
  }

  /* cactus, suitcase and hay bales, drawn flat to match the signs */
  Board.prototype.scenery = function (svg) {
    var low = M + 4 * CH + CH - 34;   // ground line in the bottom row
    var mid = M + 3 * CH + CH - 40;   // ground line in the connector row
    cactusShape(svg, M + 8.05 * CW, low, 1, 2);

    var sx = M + 6.95 * CW;
    var bag = el('g', { class: 'suitcase', transform: 'translate(' + sx + ',' + low + ')' }, svg);
    el('path', { d: 'M-9,-40 V-48 H9 V-40', class: 'bag-handle' }, bag);
    el('rect', { x: -28, y: -40, width: 56, height: 40, rx: 7, class: 'bag-body' }, bag);
    el('rect', { x: -16, y: -40, width: 6, height: 40, class: 'bag-strap' }, bag);
    el('rect', { x: 10, y: -40, width: 6, height: 40, class: 'bag-strap' }, bag);

    cactusShape(svg, M + 2.3 * CW, mid, 0.7, 1);
    squareBale(svg, M + 4.15 * CW, mid);
    squareBale(svg, M + 5.1 * CW, mid);
    squareBale(svg, M + 4.62 * CW, mid - 34);
    roundBale(svg, M + 6.55 * CW, mid);
    roundBale(svg, M + 7.6 * CW, mid);
  };

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
        el('circle', { r: 19, fill: tm.color, class: 'token-ring' }, g);
        var tx = el('text', { class: 'token-icon', 'text-anchor': 'middle', y: 9 }, g);
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
