// THUNAI document checklist model. Pure logic for per-scheme document checklists.
// No DOM access. Rendering lives in js/document-checklist.js. Plain ES2015.
(function () {
  'use strict';

  var NOT_CONFIRMED_TEXT = 'Document requirements not yet confirmed.';
  var RESET_LABEL = 'Reset checklist';
  var STORAGE_PREFIX = 'thunai.documentChecklist.';
  var SCHEME_ID_PATTERN = /^[a-z0-9-]+$/i;

  function storageKey(schemeId) {
    if (typeof schemeId !== 'string' || !SCHEME_ID_PATTERN.test(schemeId)) {
      return null;
    }
    return STORAGE_PREFIX + schemeId;
  }

  function uniqueStrings(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (out.indexOf(list[i]) === -1) {
        out.push(list[i]);
      }
    }
    return out;
  }

  // Verified-only gating: unverified or null data never produces items.
  function documentItems(scheme) {
    if (!scheme || typeof scheme !== 'object') {
      return [];
    }
    if (scheme.verificationStatus !== 'verified' || !Array.isArray(scheme.requiredDocuments)) {
      return [];
    }
    var cleaned = [];
    for (var i = 0; i < scheme.requiredDocuments.length; i++) {
      var entry = scheme.requiredDocuments[i];
      if (typeof entry === 'string' && entry.trim() !== '') {
        cleaned.push(entry.trim());
      }
    }
    return uniqueStrings(cleaned);
  }

  function isChecklistVisible(scheme) {
    return documentItems(scheme).length > 0;
  }

  function parseChecked(raw, items) {
    if (typeof raw !== 'string') {
      return [];
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return [];
    }
    if (!Array.isArray(parsed)) {
      return [];
    }
    var kept = parsed.filter(function (entry) {
      return typeof entry === 'string' && items.indexOf(entry) !== -1;
    });
    return uniqueStrings(kept);
  }

  function loadChecked(store, schemeId, items) {
    var key = storageKey(schemeId);
    if (key === null) {
      return [];
    }
    var raw;
    try {
      raw = store.getItem(key);
    } catch (error) {
      raw = null;
    }
    return parseChecked(raw, items);
  }

  function saveChecked(store, schemeId, items, checked) {
    var key = storageKey(schemeId);
    if (key === null) {
      return { ok: false };
    }
    var list = uniqueStrings(checked.filter(function (entry) {
      return items.indexOf(entry) !== -1;
    }));
    try {
      store.setItem(key, JSON.stringify(list));
      return { ok: true };
    } catch (error) {
      return { ok: false };
    }
  }

  function resetChecked(store, schemeId) {
    var key = storageKey(schemeId);
    if (key === null) {
      return { ok: false };
    }
    try {
      store.removeItem(key);
      return { ok: true };
    } catch (error) {
      return { ok: false };
    }
  }

  function setChecked(checked, label, on) {
    var next = checked.filter(function (entry) { return entry !== label; });
    if (on) {
      next.push(label);
    }
    return uniqueStrings(next);
  }

  function countReady(items, checked) {
    return items.filter(function (item) { return checked.indexOf(item) !== -1; }).length;
  }

  function progressText(ready, total) {
    if (total === 0) {
      return '';
    }
    return ready + ' of ' + total + (total === 1 ? ' document' : ' documents') + ' ready';
  }

  var api = {
    NOT_CONFIRMED_TEXT: NOT_CONFIRMED_TEXT,
    RESET_LABEL: RESET_LABEL,
    STORAGE_PREFIX: STORAGE_PREFIX,
    storageKey: storageKey,
    documentItems: documentItems,
    isChecklistVisible: isChecklistVisible,
    parseChecked: parseChecked,
    loadChecked: loadChecked,
    saveChecked: saveChecked,
    resetChecked: resetChecked,
    setChecked: setChecked,
    countReady: countReady,
    progressText: progressText
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_CHECKLIST_MODEL = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
