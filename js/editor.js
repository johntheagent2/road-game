/* Question manager + tile layout editor (modal). */
(function (root) {
  'use strict';

  var I = root.I18N, t = I.t;
  var ctx = null;            // { bank, layout, defaults, onChange(bank, layout), toast(msg) }
  var tab = 'main', search = '', editing = null; // editing: { pool, index } (index -1 = new)

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function modal() { return $('modal'); }
  function body() { return $('modal-body'); }

  function open(c) {
    ctx = c; tab = 'main'; search = ''; editing = null;
    body().className = 'modal-body wide';
    modal().classList.remove('hidden');
    render();
  }

  function close() {
    modal().classList.add('hidden');
    body().className = 'modal-body';
    body().innerHTML = '';
    ctx.onClose && ctx.onClose();
  }

  function pool() { return tab === 'tiebreak' ? 'tiebreak' : 'main'; }

  function valOf(v, lang) {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return lang === 'vi' ? String(v) : '';
    return v[lang] || '';
  }

  function render() {
    var h = '<h2>' + esc(t('ed_title')) + '</h2>';
    h += '<div class="tabs">' +
      tabBtn('main', 'ed_tab_main') + tabBtn('tiebreak', 'ed_tab_tb') + tabBtn('layout', 'ed_tab_layout') + '</div>';
    h += tab === 'layout' ? layoutHtml() : questionsHtml();
    h += '<div class="actions">' +
      '<button id="ed-import">' + esc(t('ed_import')) + '</button>' +
      '<button id="ed-export">' + esc(t('ed_export')) + '</button>' +
      '<button id="ed-reset" class="bad">' + esc(t('ed_reset')) + '</button>' +
      '<button id="ed-close" class="primary">' + esc(t('close')) + '</button></div>';
    body().innerHTML = h;
    wire();
  }

  function tabBtn(id, key) {
    return '<button data-tab="' + id + '" class="' + (tab === id ? 'active' : '') + '">' + esc(t(key)) + '</button>';
  }

  /* ---------- questions ---------- */

  function questionsHtml() {
    var list = ctx.bank[pool()], h = '';
    var q = search.toLowerCase();
    h += '<div class="row"><input id="ed-search" type="search" placeholder="' + esc(t('ed_search')) + '" value="' + esc(search) + '">' +
      '<button id="ed-add" class="primary">' + esc(t('ed_add')) + '</button>' +
      '<span class="muted">' + esc(t('ed_count', { n: list.length })) + '</span></div>';
    h += '<div class="q-list">';
    list.forEach(function (it, i) {
      var text = I.txt(it.q);
      var all = (valOf(it.q, 'vi') + ' ' + valOf(it.q, 'en') + ' ' + text).toLowerCase();
      if (q && all.indexOf(q) < 0) return;
      h += '<div class="q-item"><span class="muted">' + (i + 1) + '.</span><span class="t">' + esc(text) + '</span>' +
        '<span class="tag">' + esc(it.choices ? t('ed_choice_tag') : t('ed_open_tag')) + '</span>' +
        '<button data-edit="' + i + '">' + esc(t('ed_edit')) + '</button>' +
        '<button data-del="' + i + '">' + esc(t('ed_delete')) + '</button></div>';
    });
    h += '</div>';
    if (editing) h += formHtml();
    return h;
  }

  function formHtml() {
    var it = editing.index >= 0 ? ctx.bank[editing.pool][editing.index] : {};
    var choices = (it.choices || []).map(function (c) { return typeof c === 'object' ? (c.vi || c.en || '') : c; }).join('\n');
    return '<div class="form-grid">' +
      '<label>' + esc(t('ed_q_vi')) + '<textarea id="f-q-vi" rows="2">' + esc(valOf(it.q, 'vi')) + '</textarea></label>' +
      '<label>' + esc(t('ed_q_en')) + '<textarea id="f-q-en" rows="2">' + esc(valOf(it.q, 'en')) + '</textarea></label>' +
      '<label>' + esc(t('ed_a_vi')) + '<input id="f-a-vi" value="' + esc(valOf(it.a, 'vi')) + '"></label>' +
      '<label>' + esc(t('ed_a_en')) + '<input id="f-a-en" value="' + esc(valOf(it.a, 'en')) + '"></label>' +
      '<label>' + esc(t('ed_choices')) + '<textarea id="f-choices" rows="4">' + esc(choices) + '</textarea></label>' +
      '<label>' + esc(t('ed_correct_idx')) + '<input id="f-answer" type="number" min="1" value="' + (it.answer != null ? it.answer + 1 : '') + '"></label>' +
      '<label>' + esc(t('ed_timelimit')) + '<input id="f-limit" type="number" min="5" value="' + (it.timeLimit || '') + '"></label>' +
      '<div class="actions"><button id="f-cancel">' + esc(t('ed_cancel')) + '</button>' +
      '<button id="f-save" class="primary">' + esc(t('ed_save')) + '</button></div></div>';
  }

  function bi(vi, en) {
    vi = vi.trim(); en = en.trim();
    if (vi && en) return { vi: vi, en: en };
    return vi || en;
  }

  function saveForm() {
    var qvi = $('f-q-vi').value, qen = $('f-q-en').value;
    if (!qvi.trim() && !qen.trim()) { ctx.toast(t('ed_need_q')); return; }
    var item = { q: bi(qvi, qen) };
    var a = bi($('f-a-vi').value, $('f-a-en').value);
    if (a) item.a = a;
    var lines = $('f-choices').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (lines.length) {
      var idx = parseInt($('f-answer').value, 10) - 1;
      if (!(idx >= 0 && idx < lines.length)) { ctx.toast(t('ed_bad_choice')); return; }
      item.choices = lines; item.answer = idx;
      if (!item.a) item.a = lines[idx];
    }
    var lim = parseInt($('f-limit').value, 10);
    if (lim > 0) item.timeLimit = lim;
    var list = ctx.bank[editing.pool];
    if (editing.index >= 0) list[editing.index] = item; else list.push(item);
    editing = null;
    changed();
    render();
  }

  /* ---------- layout ---------- */

  function layoutHtml() {
    var h = '<p class="muted">' + esc(t('ed_layout_note')) + '</p><div class="layout-grid">';
    ctx.layout.forEach(function (type, i) {
      h += '<label><span class="muted">' + (i + 1) + '</span><select data-tile="' + i + '">';
      root.FFEngine.TILE_TYPES.forEach(function (tt) {
        h += '<option value="' + tt + '"' + (tt === type ? ' selected' : '') + '>' + esc(t('tile_' + tt)) + '</option>';
      });
      h += '</select></label>';
    });
    h += '</div><p id="layout-counts" class="muted">' + esc(countsText()) + '</p>';
    return h;
  }

  function countsText() {
    var q = ctx.layout.filter(function (x) { return x === 'question'; }).length;
    return t('ed_layout_counts', { q: q, f: ctx.layout.length - q });
  }

  /* ---------- import / export ---------- */

  function validQuestion(q) {
    if (!q || typeof q !== 'object' || q.q == null || q.q === '') throw new Error('question without "q"');
    if (q.choices) {
      if (!Array.isArray(q.choices) || !q.choices.length) throw new Error('"choices" must be a non-empty array');
      if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length)) throw new Error('"answer" must be a valid choice index (0-based)');
    }
  }

  function importData(data) {
    var main = null, tb = null, layout = null;
    if (Array.isArray(data)) { if (tab === 'tiebreak') tb = data; else main = data; }
    else if (data && typeof data === 'object') {
      main = data.questions || null; tb = data.tiebreakQuestions || null; layout = data.layout || null;
    } else throw new Error('unexpected format');
    if (main) main.forEach(validQuestion);
    if (tb) tb.forEach(validQuestion);
    if (layout) {
      if (!Array.isArray(layout) || layout.length !== ctx.layout.length) throw new Error('"layout" must have ' + ctx.layout.length + ' entries');
      layout.forEach(function (x) { if (root.FFEngine.TILE_TYPES.indexOf(x) < 0) throw new Error('unknown tile type: ' + x); });
    }
    if (!main && !tb && !layout) throw new Error('nothing to import');
    if (main) ctx.bank.main = main;
    if (tb) ctx.bank.tiebreak = tb;
    if (layout) ctx.layout = layout;
  }

  function exportData() {
    var data = { layout: ctx.layout, questions: ctx.bank.main, tiebreakQuestions: ctx.bank.tiebreak };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fairfield-questions.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function changed() { ctx.onChange(ctx.bank, ctx.layout); }

  /* ---------- wiring ---------- */

  function wire() {
    var b = body();
    [].forEach.call(b.querySelectorAll('[data-tab]'), function (x) {
      x.onclick = function () { tab = x.getAttribute('data-tab'); editing = null; search = ''; render(); };
    });
    var s = $('ed-search');
    if (s) s.oninput = function () {
      search = s.value; var pos = s.selectionStart; render();
      var n = $('ed-search'); n.focus(); n.setSelectionRange(pos, pos);
    };
    var add = $('ed-add');
    if (add) add.onclick = function () { editing = { pool: pool(), index: -1 }; render(); $('f-q-vi').focus(); };
    [].forEach.call(b.querySelectorAll('[data-edit]'), function (x) {
      x.onclick = function () { editing = { pool: pool(), index: +x.getAttribute('data-edit') }; render(); };
    });
    [].forEach.call(b.querySelectorAll('[data-del]'), function (x) {
      x.onclick = function () {
        if (!confirm(t('ed_confirm_delete'))) return;
        ctx.bank[pool()].splice(+x.getAttribute('data-del'), 1); editing = null; changed(); render();
      };
    });
    if ($('f-save')) { $('f-save').onclick = saveForm; $('f-cancel').onclick = function () { editing = null; render(); }; }
    [].forEach.call(b.querySelectorAll('[data-tile]'), function (x) {
      x.onchange = function () {
        ctx.layout[+x.getAttribute('data-tile')] = x.value; changed();
        $('layout-counts').textContent = countsText();
      };
    });
    $('ed-export').onclick = exportData;
    $('ed-import').onclick = function () { $('file-import').value = ''; $('file-import').click(); };
    $('ed-reset').onclick = function () {
      if (!confirm(t('ed_confirm_reset'))) return;
      var r = ctx.reset(); ctx.bank = r.bank; ctx.layout = r.layout; editing = null; render();
    };
    $('ed-close').onclick = close;
  }

  $('file-import').addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0];
    if (!f || !ctx) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        importData(JSON.parse(r.result));
        changed(); render(); ctx.toast(t('ed_import_ok'));
      } catch (e) { ctx.toast(t('ed_import_bad', { msg: e.message })); }
    };
    r.readAsText(f);
  });

  // drag a .json file onto the editor
  modal().addEventListener('dragover', function (e) { if (ctx && !modal().classList.contains('hidden')) e.preventDefault(); });
  modal().addEventListener('drop', function (e) {
    if (!ctx || modal().classList.contains('hidden') || !e.dataTransfer.files.length) return;
    e.preventDefault();
    var inp = $('file-import');
    inp.files = e.dataTransfer.files;
    inp.dispatchEvent(new Event('change'));
  });

  root.FFEditor = { open: open, refresh: function () { if (ctx && !modal().classList.contains('hidden') && body().classList.contains('wide')) render(); } };
})(window);
