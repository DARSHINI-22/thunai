// THUNAI application tracker model: pure logic for the application tracker. No DOM access.
// Plain ES2015. Storage is accessed only through a store object with getItem/setItem/removeItem.
(function () {
  'use strict';

  var STORAGE_KEY = 'thunai.applicationTracker';
  var ID_PATTERN = /^[a-z0-9-]+$/i;
  var STATUSES = ['not-started', 'in-progress', 'submitted'];
  var STATUS_LABELS = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'submitted': 'Submitted'
  };
  var DEFAULT_STATUS = 'not-started';
  var STATUS_NOTE = 'Status is self-reported by you and is not verified by the scholarship provider.';
  var EMPTY_TEXT = 'You are not tracking any applications yet.';

  function isValidId(id) {
    return typeof id === 'string' && ID_PATTERN.test(id);
  }

  function isValidStatus(status) {
    return STATUSES.indexOf(status) !== -1;
  }

  // Returns the entry for schemeId, or null.
  function findEntry(entries, schemeId) {
    if (!Array.isArray(entries)) {
      return null;
    }
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry && typeof entry === 'object' && entry.schemeId === schemeId) {
        return entry;
      }
    }
    return null;
  }

  // Returns a copy holding only valid entries, first occurrence per scheme id, in original order.
  function cleanEntries(list) {
    var result = [];
    if (!Array.isArray(list)) {
      return result;
    }
    list.forEach(function (entry) {
      if (!entry || typeof entry !== 'object') {
        return;
      }
      if (!isValidId(entry.schemeId) || !isValidStatus(entry.status)) {
        return;
      }
      if (findEntry(result, entry.schemeId) !== null) {
        return;
      }
      result.push({ schemeId: entry.schemeId, status: entry.status });
    });
    return result;
  }

  // Parses the raw stored string. Anything malformed yields an empty list.
  function parseTracker(raw) {
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
    return cleanEntries(parsed);
  }

  // Returns true when a scheme with this id exists in the scheme list.
  function schemeExists(schemes, id) {
    return schemes.some(function (scheme) {
      return scheme && typeof scheme === 'object' && scheme.id === id;
    });
  }

  // Reads entries from the store, dropping entries whose scheme no longer exists.
  function loadTracker(store, schemes) {
    if (!store) {
      return [];
    }
    var raw;
    try {
      raw = store.getItem(STORAGE_KEY);
    } catch (error) {
      return [];
    }
    var entries = parseTracker(raw);
    if (!Array.isArray(schemes)) {
      return [];
    }
    return entries.filter(function (entry) {
      return schemeExists(schemes, entry.schemeId);
    });
  }

  // Writes the cleaned entries. Reports ok:false when storage is unavailable or the write fails.
  function saveTracker(store, entries) {
    if (!store) {
      return { ok: false };
    }
    try {
      var written = store.setItem(STORAGE_KEY, JSON.stringify(cleanEntries(entries)));
      return { ok: written !== false };
    } catch (error) {
      return { ok: false };
    }
  }

  // Adds a new entry with the default status. An existing entry is kept unchanged, so no duplicates.
  function addEntry(entries, schemeId) {
    var list = cleanEntries(entries);
    if (!isValidId(schemeId) || findEntry(list, schemeId) !== null) {
      return list;
    }
    return list.concat([{ schemeId: schemeId, status: DEFAULT_STATUS }]);
  }

  // Replaces the status of an existing entry. Invalid status or unknown scheme leaves the list unchanged.
  function setStatus(entries, schemeId, status) {
    var list = cleanEntries(entries);
    if (!isValidStatus(status) || findEntry(list, schemeId) === null) {
      return list;
    }
    return list.map(function (entry) {
      return entry.schemeId === schemeId ? { schemeId: entry.schemeId, status: status } : entry;
    });
  }

  // Returns a copy without the given scheme id.
  function removeEntry(entries, schemeId) {
    return cleanEntries(entries).filter(function (entry) {
      return entry.schemeId !== schemeId;
    });
  }

  function statusLabel(status) {
    return Object.prototype.hasOwnProperty.call(STATUS_LABELS, status) ? STATUS_LABELS[status] : '';
  }

  // Joins each entry with its scheme record for display. Entries without a matching scheme are skipped.
  function resolveTracker(entries, schemes) {
    var result = [];
    if (!Array.isArray(schemes)) {
      return result;
    }
    cleanEntries(entries).forEach(function (entry) {
      var scheme = null;
      for (var i = 0; i < schemes.length; i++) {
        if (schemes[i] && typeof schemes[i] === 'object' && schemes[i].id === entry.schemeId) {
          scheme = schemes[i];
          break;
        }
      }
      if (!scheme) {
        return;
      }
      result.push({
        schemeId: entry.schemeId,
        name: typeof scheme.name === 'string' ? scheme.name : entry.schemeId,
        description: typeof scheme.description === 'string' ? scheme.description : '',
        status: entry.status,
        statusLabel: STATUS_LABELS[entry.status]
      });
    });
    return result;
  }

  function summaryText(count) {
    if (count === 0) {
      return 'No applications tracked yet.';
    }
    if (count === 1) {
      return '1 application tracked';
    }
    return count + ' applications tracked';
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    ID_PATTERN: ID_PATTERN,
    STATUSES: STATUSES,
    STATUS_LABELS: STATUS_LABELS,
    DEFAULT_STATUS: DEFAULT_STATUS,
    STATUS_NOTE: STATUS_NOTE,
    EMPTY_TEXT: EMPTY_TEXT,
    isValidId: isValidId,
    isValidStatus: isValidStatus,
    cleanEntries: cleanEntries,
    parseTracker: parseTracker,
    loadTracker: loadTracker,
    saveTracker: saveTracker,
    findEntry: findEntry,
    addEntry: addEntry,
    setStatus: setStatus,
    removeEntry: removeEntry,
    resolveTracker: resolveTracker,
    statusLabel: statusLabel,
    summaryText: summaryText
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_TRACKER_MODEL = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
