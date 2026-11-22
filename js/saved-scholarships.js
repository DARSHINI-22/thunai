// THUNAI saved scholarships: save toggles on results and details, and the Saved Scholarships page.
// Uses textContent only. Logic lives in js/saved-scholarships-model.js. Plain ES2015.
(function () {
  'use strict';

  var SAVE_FAILED_TEXT = 'Could not save in this browser.';
  var PAGE_FAILED_TEXT = 'Could not update saved scholarships in this browser.';

  // Returns the model when it has loaded, otherwise null. Every entry point does nothing without it.
  function getModel() {
    return (typeof window !== 'undefined' && window.THUNAI_SAVED_MODEL) || null;
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

  function schemeName(model, schemes, schemeId) {
    var scheme = model.findScheme(schemes, schemeId);
    return scheme && typeof scheme.name === 'string' && scheme.name ? scheme.name : schemeId;
  }

  function paintToggle(button, name, saved) {
    button.textContent = saved ? 'Saved' : 'Save scholarship';
    button.setAttribute('aria-pressed', saved ? 'true' : 'false');
    button.setAttribute('aria-label', (saved ? 'Remove ' : 'Save ') + name + ' from saved scholarships');
  }

  function createToggleButton() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary';
    return button;
  }

  // Turns a button into the save toggle for one scheme and adds its status line after it.
  function mountToggle(button, schemeId, store, schemes) {
    var model = getModel();
    if (!model || !button || !button.parentNode) {
      return;
    }

    var name = schemeName(model, schemes, schemeId);
    button.type = 'button';
    button.classList.add('save-toggle');

    var status = document.createElement('p');
    status.className = 'saved-status';
    status.setAttribute('aria-live', 'polite');
    button.parentNode.insertBefore(status, button.nextSibling);

    var saved = model.isSaved(model.loadSaved(store, schemes), schemeId);
    paintToggle(button, name, saved);

    button.addEventListener('click', function () {
      var ids = model.loadSaved(store, schemes);
      var next = !model.isSaved(ids, schemeId);
      var result = model.saveSaved(store, model.setSaved(ids, schemeId, next));
      if (result.ok) {
        paintToggle(button, name, next);
        status.textContent = '';
      } else {
        status.textContent = SAVE_FAILED_TEXT;
      }
    });
  }

  // Adds a save toggle after each scheme details link inside root that does not already have one.
  function decorateResults(root, store, schemes) {
    var model = getModel();
    if (!model) {
      return;
    }
    var scope = root || document;
    var list = Array.isArray(schemes) ? schemes : getSchemes();
    var links = scope.querySelectorAll('a.scheme-details-link');
    Array.prototype.forEach.call(links, function (link) {
      try {
        var match = /[?&]id=([^&#]+)/.exec(link.getAttribute('href') || '');
        if (!match) {
          return;
        }
        var id = decodeURIComponent(match[1]);
        if (!model.ID_PATTERN.test(id)) {
          return;
        }
        var parent = link.parentNode;
        if (!parent || parent.querySelector('.save-toggle')) {
          return;
        }
        var button = createToggleButton();
        parent.insertBefore(button, link.nextSibling);
        mountToggle(button, id, store, list);
      } catch (error) {
        // Skip this link; the rest of the results page is unaffected.
      }
    });
  }

  // Shows a status line directly above the saved list, replacing any earlier one.
  function showPageStatus(root, text) {
    clearPageStatus(root);
    var status = document.createElement('p');
    status.className = 'saved-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = text;
    root.parentNode.insertBefore(status, root);
  }

  function clearPageStatus(root) {
    var previous = root.previousSibling;
    if (previous && previous.nodeType === 1 && previous.classList.contains('saved-status')) {
      previous.parentNode.removeChild(previous);
    }
  }

  function buildCard(root, scheme, store, schemes) {
    var model = getModel();
    var id = String(scheme.id);
    var name = typeof scheme.name === 'string' && scheme.name ? scheme.name : id;

    var article = document.createElement('article');
    article.className = 'scheme-card saved-card';

    var heading = document.createElement('h2');
    heading.textContent = name;
    article.appendChild(heading);

    if (typeof scheme.description === 'string' && scheme.description) {
      var description = document.createElement('p');
      description.className = 'scheme-description';
      description.textContent = scheme.description;
      article.appendChild(description);
    }

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
    remove.className = 'btn btn-secondary saved-remove';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + name + ' from saved scholarships');
    remove.addEventListener('click', function () {
      var next = model.setSaved(model.loadSaved(store, schemes), id, false);
      var result = model.saveSaved(store, next);
      if (result.ok) {
        renderSavedPage(root, store, schemes);
      } else {
        showPageStatus(root, PAGE_FAILED_TEXT);
      }
    });
    actions.appendChild(remove);

    article.appendChild(actions);
    return article;
  }

  // Renders the saved schemes into root and updates the count and empty-state elements on the page.
  function renderSavedPage(root, store, schemes) {
    var model = getModel();
    if (!model || !root) {
      return;
    }
    var emptyBox = document.getElementById('saved-empty');
    var countLine = document.getElementById('saved-count');

    clearPageStatus(root);
    root.textContent = '';

    var items = model.resolveSaved(model.loadSaved(store, schemes), schemes);
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
    items.forEach(function (scheme) {
      root.appendChild(buildCard(root, scheme, store, schemes));
    });
  }

  var api = { mountToggle: mountToggle, renderSavedPage: renderSavedPage };

  function mountPage() {
    try {
      var model = getModel();
      if (!model) {
        return;
      }
      var store = defaultStore();
      var schemes = getSchemes();

      var list = document.getElementById('saved-list');
      if (list) {
        renderSavedPage(list, store, schemes);
      }

      decorateResults(document, store, schemes);

      var slot = document.getElementById('saved-toggle-slot');
      var schemeModel = window.THUNAI_SCHEME_MODEL;
      if (slot && schemeModel) {
        var id = schemeModel.getSchemeIdFromSearch(window.location.search);
        var scheme = model.findScheme(schemes, id);
        if (scheme) {
          var button = createToggleButton();
          slot.textContent = '';
          slot.appendChild(button);
          mountToggle(button, scheme.id, store, schemes);
        }
      }
    } catch (error) {
      // Leave the page as it was rendered; saving is an enhancement, not required content.
    }
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.THUNAI_SAVED = api;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountPage);
    } else {
      mountPage();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
