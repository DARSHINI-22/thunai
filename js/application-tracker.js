// THUNAI application tracker: add control on scheme details, and the Application Tracker page.
// Uses textContent only. Logic lives in js/application-tracker-model.js. Plain ES2015.
(function () {
  'use strict';

  var ADD_TEXT = 'Track application';
  var TRACKED_TEXT = 'In your application tracker';
  var ADDED_TEXT = 'Added to your application tracker.';
  var ALREADY_TEXT = 'Already in your application tracker.';
  var SAVE_FAILED_TEXT = 'Could not save in this browser.';
  var STATUS_SAVED_TEXT = 'Status updated.';
  var STATUS_FAILED_TEXT = 'Could not save status in this browser.';
  var REMOVED_TEXT = 'Removed from your application tracker.';
  var REMOVE_FAILED_TEXT = 'Could not update your tracker in this browser.';

  // Returns the model when it has loaded, otherwise null. Every entry point does nothing without it.
  function getModel() {
    return (typeof window !== 'undefined' && window.THUNAI_TRACKER_MODEL) || null;
  }

  // Wraps window.localStorage so that no exception escapes. Returns null when storage is unavailable.
  function defaultStore() {
    try {
      if (!window.localStorage) {
        return null;
      }
    } catch (error) {
      return null;
    }
    return {
      getItem: function (key) {
        try {
          return window.localStorage.getItem(key);
        } catch (error) {
          return null;
        }
      },
      setItem: function (key, value) {
        try {
          window.localStorage.setItem(key, value);
          return true;
        } catch (error) {
          return false;
        }
      },
      removeItem: function (key) {
        try {
          window.localStorage.removeItem(key);
          return true;
        } catch (error) {
          return false;
        }
      }
    };
  }

  function getSchemes() {
    return Array.isArray(window.THUNAI_SCHEMES) ? window.THUNAI_SCHEMES : [];
  }

  // Reads the saved-scholarship state only. This never writes saved scholarships.
  function savedLineText(schemeId) {
    var savedModel = window.THUNAI_SAVED_MODEL;
    if (!savedModel) {
      return '';
    }
    var saved = savedModel.isSaved(savedModel.loadSaved(defaultStore(), getSchemes()), schemeId);
    return 'Saved scholarship: ' + (saved ? 'yes' : 'no');
  }

  function setPageStatus(text) {
    var statusLine = document.getElementById('tracker-status');
    if (statusLine) {
      statusLine.textContent = text;
    }
  }

  // Turns the slot into the add-to-tracker control for one scheme.
  function mountAddControl(slot, scheme, store, schemes) {
    var model = getModel();
    if (!model || !slot || !scheme) {
      return;
    }

    var id = scheme.id;
    var name = typeof scheme.name === 'string' && scheme.name ? scheme.name : String(id);
    var tracked = model.findEntry(model.loadTracker(store, schemes), id) !== null;
    var link = null;

    slot.textContent = '';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary tracker-add';

    var status = document.createElement('p');
    status.className = 'tracker-status';
    status.setAttribute('aria-live', 'polite');

    slot.appendChild(button);
    slot.appendChild(status);

    function paint() {
      button.textContent = tracked ? TRACKED_TEXT : ADD_TEXT;
      button.setAttribute('aria-pressed', tracked ? 'true' : 'false');
      button.setAttribute('aria-label', (tracked ? 'Tracked application for ' : 'Track application for ') + name);
      if (tracked) {
        if (!link) {
          link = document.createElement('a');
          link.className = 'btn btn-secondary';
          link.href = 'tracker.html';
          link.textContent = 'View tracker';
        }
        if (!link.parentNode) {
          slot.appendChild(link);
        }
      }
    }

    button.addEventListener('click', function () {
      if (tracked) {
        status.textContent = ALREADY_TEXT;
        return;
      }
      var result = model.saveTracker(store, model.addEntry(model.loadTracker(store, schemes), id));
      if (result.ok) {
        tracked = true;
        paint();
        status.textContent = ADDED_TEXT;
      } else {
        status.textContent = SAVE_FAILED_TEXT;
      }
    });

    paint();
  }

  function buildCard(root, item, index, store, schemes) {
    var model = getModel();
    var id = item.schemeId;
    var name = item.name;

    var article = document.createElement('article');
    article.className = 'scheme-card tracker-card';

    var heading = document.createElement('h2');
    heading.textContent = name;
    article.appendChild(heading);

    if (item.description) {
      var description = document.createElement('p');
      description.className = 'scheme-description';
      description.textContent = item.description;
      article.appendChild(description);
    }

    var row = document.createElement('div');
    row.className = 'tracker-row';

    var selectId = 'tracker-status-' + index;
    var label = document.createElement('label');
    label.setAttribute('for', selectId);
    label.textContent = 'Application status';
    row.appendChild(label);

    var select = document.createElement('select');
    select.id = selectId;
    select.className = 'tracker-select';
    select.setAttribute('aria-describedby', 'tracker-note');
    model.STATUSES.forEach(function (status) {
      var option = document.createElement('option');
      option.value = status;
      option.textContent = model.statusLabel(status);
      if (status === item.status) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.addEventListener('change', function () {
      var next = model.setStatus(model.loadTracker(store, schemes), id, select.value);
      var result = model.saveTracker(store, next);
      if (result.ok) {
        setPageStatus(STATUS_SAVED_TEXT);
      } else {
        renderTrackerPage(root, store, schemes);
        setPageStatus(STATUS_FAILED_TEXT);
      }
    });
    row.appendChild(select);
    article.appendChild(row);

    var savedLine = document.createElement('p');
    savedLine.className = 'tracker-saved-line';
    savedLine.textContent = savedLineText(id);
    article.appendChild(savedLine);

    var actions = document.createElement('div');
    actions.className = 'saved-actions';

    var link = document.createElement('a');
    link.className = 'btn btn-secondary';
    link.href = 'scheme-details.html?id=' + encodeURIComponent(id);
    link.textContent = 'View details';
    link.setAttribute('aria-label', 'View details for ' + name);
    actions.appendChild(link);

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-secondary tracker-remove';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + name + ' from your application tracker');
    remove.addEventListener('click', function () {
      var next = model.removeEntry(model.loadTracker(store, schemes), id);
      var result = model.saveTracker(store, next);
      if (result.ok) {
        renderTrackerPage(root, store, schemes);
        setPageStatus(REMOVED_TEXT);
      } else {
        setPageStatus(REMOVE_FAILED_TEXT);
      }
    });
    actions.appendChild(remove);

    article.appendChild(actions);
    return article;
  }

  // Renders the tracked applications into root and updates the count, note and empty-state elements.
  function renderTrackerPage(root, store, schemes) {
    var model = getModel();
    if (!model || !root) {
      return;
    }
    var emptyBox = document.getElementById('tracker-empty');
    var countLine = document.getElementById('tracker-count');
    var noteLine = document.getElementById('tracker-note');

    root.textContent = '';
    if (noteLine) {
      noteLine.textContent = model.STATUS_NOTE;
    }

    var items = model.resolveTracker(model.loadTracker(store, schemes), schemes);
    if (countLine) {
      countLine.textContent = model.summaryText(items.length);
    }

    if (items.length === 0) {
      if (emptyBox) {
        emptyBox.hidden = false;
      }
      root.hidden = true;
      return;
    }

    if (emptyBox) {
      emptyBox.hidden = true;
    }
    root.hidden = false;
    items.forEach(function (item, index) {
      root.appendChild(buildCard(root, item, index, store, schemes));
    });
  }

  var api = { mountAddControl: mountAddControl, renderTrackerPage: renderTrackerPage };

  function mountPages() {
    if (!getModel()) {
      return;
    }

    var list = document.getElementById('tracker-list');
    if (list) {
      try {
        renderTrackerPage(list, defaultStore(), getSchemes());
      } catch (error) {
        list.hidden = true;
      }
    }

    var slot = document.getElementById('tracker-slot');
    if (slot) {
      try {
        var schemeModel = window.THUNAI_SCHEME_MODEL;
        if (schemeModel) {
          var id = schemeModel.getSchemeIdFromSearch(window.location.search);
          var scheme = schemeModel.findSchemeById(getSchemes(), id);
          if (scheme) {
            mountAddControl(slot, scheme, defaultStore(), getSchemes());
          }
        }
      } catch (error) {
        slot.hidden = true;
      }
    }
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined' && getModel()) {
    window.THUNAI_TRACKER = api;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountPages);
    } else {
      mountPages();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
