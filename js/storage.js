/* localStorage wrapper: autosave, question bank, layout, language. Never throws. */
(function (root) {
  'use strict';

  var PREFIX = 'fairfield.';

  function get(key) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function del(key) {
    try { localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
  }

  root.Store = {
    loadGame: function () { return get('game'); },
    saveGame: function (g) { set('game', g); },
    clearGame: function () { del('game'); },
    loadBank: function () { return get('bank'); },
    saveBank: function (b) { set('bank', b); },
    loadLayout: function () { return get('layout'); },
    saveLayout: function (l) { set('layout', l); },
    loadLang: function () { return get('lang'); },
    saveLang: function (l) { set('lang', l); },
    loadSetup: function () { return get('setup'); },
    saveSetup: function (s) { set('setup', s); },
    resetContent: function () { del('bank'); del('layout'); }
  };
})(window);
