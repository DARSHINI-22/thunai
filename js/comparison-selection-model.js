(function () {
  'use strict';

  var STORAGE_KEY = 'thunai.comparison';
  var MAX_SELECTED = 3;
  var ID_PATTERN = /^[a-z0-9-]+$/i;
  var LIMIT_TEXT = 'You can compare up to 3 scholarships. Remove one to add another.';

  function cleanIds(list) {
    if (!Array.isArray(list)) {
      return [];
    }
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var id = list[i];
      if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
        continue;
      }
      if (out.indexOf(id) !== -1) {
        continue;
      }
      out.push(id);
      if (out.length >= MAX_SELECTED) {
        break;
      }
    }
    return out;
  }

  function parseSelection(raw) {
    if (typeof raw !== 'string') {
      return [];
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return [];
    }
    if (!Array.isArray(parsed)) {
      return [];
    }
    return cleanIds(parsed);
  }

  function loadSelection(store, schemes) {
    try {
      if (!store) {
        return [];
      }
      var raw;
      try {
        raw = store.getItem(STORAGE_KEY);
      } catch (e) {
        return [];
      }
      var ids = parseSelection(raw);
      if (!Array.isArray(schemes)) {
        return [];
      }
      var known = [];
      for (var i = 0; i < schemes.length; i++) {
        if (schemes[i] && typeof schemes[i].id === 'string') {
          known.push(schemes[i].id);
        }
      }
      return ids.filter(function (id) {
        return known.indexOf(id) !== -1;
      });
    } catch (err) {
      return [];
    }
  }

  function saveSelection(store, ids) {
    if (!store) {
      return { ok: false };
    }
    try {
      var wrote = store.setItem(STORAGE_KEY, JSON.stringify(cleanIds(ids)));
      return { ok: wrote !== false };
    } catch (e) {
      return { ok: false };
    }
  }

  function isSelected(ids, id) {
    return cleanIds(ids).indexOf(id) !== -1;
  }

  function addSelection(ids, id) {
    var current = cleanIds(ids);
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      return { ids: current, status: 'invalid' };
    }
    if (current.indexOf(id) !== -1) {
      return { ids: current, status: 'already' };
    }
    if (current.length >= MAX_SELECTED) {
      return { ids: current, status: 'full' };
    }
    return { ids: current.concat([id]), status: 'added' };
  }

  function removeSelection(ids, id) {
    return cleanIds(ids).filter(function (x) {
      return x !== id;
    });
  }

  function clearSelection() {
    return [];
  }

  function summaryText(count) {
    if (count === 0) {
      return 'No scholarships selected for comparison.';
    }
    if (count === 1) {
      return '1 scholarship selected for comparison';
    }
    return count + ' scholarships selected for comparison';
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    MAX_SELECTED: MAX_SELECTED,
    ID_PATTERN: ID_PATTERN,
    LIMIT_TEXT: LIMIT_TEXT,
    cleanIds: cleanIds,
    parseSelection: parseSelection,
    loadSelection: loadSelection,
    saveSelection: saveSelection,
    isSelected: isSelected,
    addSelection: addSelection,
    removeSelection: removeSelection,
    clearSelection: clearSelection,
    summaryText: summaryText
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_COMPARISON_SELECTION = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
