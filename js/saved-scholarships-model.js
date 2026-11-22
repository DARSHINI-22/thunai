// THUNAI saved scholarships model: pure logic for the saved-scholarship list. No DOM access.
// Plain ES2015. Storage is accessed only through a store object with getItem/setItem.
(function () {
  'use strict';

  var STORAGE_KEY = 'thunai.savedScholarships';
  var ID_PATTERN = /^[a-z0-9-]+$/i;

  // Keeps only valid, trimmed, unique ids in their original order.
  function cleanIds(list) {
    var result = [];
    if (!Array.isArray(list)) {
      return result;
    }
    list.forEach(function (entry) {
      if (typeof entry !== 'string') {
        return;
      }
      var id = entry.trim();
      if (!ID_PATTERN.test(id)) {
        return;
      }
      if (result.indexOf(id) === -1) {
        result.push(id);
      }
    });
    return result;
  }

  // Parses the raw stored string. Anything malformed yields an empty list.
  function parseSaved(raw) {
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
    return cleanIds(parsed);
  }

  // Returns the scheme whose own id equals the given id, or null.
  function findScheme(schemes, id) {
    if (!Array.isArray(schemes)) {
      return null;
    }
    for (var i = 0; i < schemes.length; i++) {
      var scheme = schemes[i];
      if (scheme && typeof scheme === 'object' &&
          Object.prototype.hasOwnProperty.call(scheme, 'id') && scheme.id === id) {
        return scheme;
      }
    }
    return null;
  }

  // Maps saved ids to scheme objects in id order. Unknown or invalid ids are skipped.
  function resolveSaved(ids, schemes) {
    var result = [];
    try {
      cleanIds(ids).forEach(function (id) {
        var scheme = findScheme(schemes, id);
        if (scheme) {
          result.push(scheme);
        }
      });
    } catch (error) {
      return [];
    }
    return result;
  }

  // Reads saved ids from the store, keeping only ids that still exist in the scheme list.
  function loadSaved(store, schemes) {
    if (!store) {
      return [];
    }
    var raw;
    try {
      raw = store.getItem(STORAGE_KEY);
    } catch (error) {
      return [];
    }
    return parseSaved(raw).filter(function (id) {
      return findScheme(schemes, id) !== null;
    });
  }

  // Writes the cleaned id list. Reports ok:false when storage is unavailable or the write fails.
  function saveSaved(store, ids) {
    if (!store) {
      return { ok: false };
    }
    try {
      var written = store.setItem(STORAGE_KEY, JSON.stringify(cleanIds(ids)));
      return { ok: written !== false };
    } catch (error) {
      return { ok: false };
    }
  }

  function isSaved(ids, id) {
    return Array.isArray(ids) && ids.indexOf(id) !== -1;
  }

  // Returns a new list with id removed, then appended at the end when on is true.
  function setSaved(ids, id, on) {
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      return cleanIds(ids);
    }
    var result = cleanIds(ids).filter(function (existing) {
      return existing !== id;
    });
    if (on) {
      result.push(id);
    }
    return result;
  }

  function summaryText(count) {
    if (count === 0) {
      return 'No saved scholarships yet.';
    }
    if (count === 1) {
      return '1 saved scholarship';
    }
    return count + ' saved scholarships';
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    ID_PATTERN: ID_PATTERN,
    cleanIds: cleanIds,
    parseSaved: parseSaved,
    findScheme: findScheme,
    resolveSaved: resolveSaved,
    loadSaved: loadSaved,
    saveSaved: saveSaved,
    isSaved: isSaved,
    setSaved: setSaved,
    summaryText: summaryText
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_SAVED_MODEL = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
