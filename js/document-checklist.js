// THUNAI document checklist: renders and persists the per-scheme document checklist.
// Uses textContent only. Logic lives in js/document-checklist-model.js. Plain ES2015.
(function () {
  'use strict';

  var SAVE_FAILED_TEXT = 'Progress could not be saved in this browser.';
  var RESET_FAILED_TEXT = 'Progress could not be cleared in this browser.';

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

  // The model reports failure through exceptions; turn a false return from the wrapper into one.
  function strictStore(store) {
    if (!store) {
      return null;
    }
    return {
      getItem: function (key) {
        return store.getItem(key);
      },
      setItem: function (key, value) {
        if (store.setItem(key, value) === false) {
          throw new Error('setItem failed');
        }
      },
      removeItem: function (key) {
        if (store.removeItem(key) === false) {
          throw new Error('removeItem failed');
        }
      }
    };
  }

  function progressMessage(model, ready, total, failure) {
    var text = model.progressText(ready, total);
    if (failure) {
      text = text ? text + ' ' + failure : failure;
    }
    return text;
  }

  function mount(root, scheme, store) {
    var model = window.THUNAI_CHECKLIST_MODEL;
    var body = root.querySelector('#checklist-body');
    var progress = root.querySelector('#checklist-progress');
    var resetButton = root.querySelector('#checklist-reset');
    var items = model.documentItems(scheme);

    if (items.length === 0) {
      body.textContent = '';
      var note = document.createElement('p');
      note.className = 'not-confirmed';
      note.textContent = model.NOT_CONFIRMED_TEXT;
      body.appendChild(note);
      progress.textContent = '';
      resetButton.hidden = true;
      return;
    }

    var schemeId = scheme.id;
    var safeStore = strictStore(store);
    var checked = model.loadChecked(safeStore, schemeId, items);
    var inputs = [];

    var list = document.createElement('ul');
    list.className = 'checklist';

    items.forEach(function (label, index) {
      var item = document.createElement('li');
      item.className = 'checklist-item';

      var input = document.createElement('input');
      input.type = 'checkbox';
      input.id = 'chk-' + index;
      input.checked = checked.indexOf(label) !== -1;

      var text = document.createElement('label');
      text.htmlFor = input.id;
      text.textContent = label;

      input.addEventListener('change', function () {
        checked = model.setChecked(checked, label, input.checked);
        var result = model.saveChecked(safeStore, schemeId, items, checked);
        progress.textContent = progressMessage(model, model.countReady(items, checked), items.length,
          result.ok ? '' : SAVE_FAILED_TEXT);
      });

      inputs.push(input);
      item.appendChild(input);
      item.appendChild(text);
      list.appendChild(item);
    });

    body.textContent = '';
    body.appendChild(list);

    resetButton.textContent = model.RESET_LABEL;
    resetButton.hidden = false;
    resetButton.onclick = function () {
      var result = model.resetChecked(safeStore, schemeId);
      checked = [];
      inputs.forEach(function (input) {
        input.checked = false;
      });
      progress.textContent = progressMessage(model, 0, items.length,
        result.ok ? '' : RESET_FAILED_TEXT);
    };

    progress.textContent = progressMessage(model, model.countReady(items, checked), items.length, '');
  }

  var api = { mount: mount };

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.THUNAI_DOC_CHECKLIST = api;

    var root = null;
    try {
      var model = window.THUNAI_CHECKLIST_MODEL;
      var schemeModel = window.THUNAI_SCHEME_MODEL;
      if (model && schemeModel && Array.isArray(window.THUNAI_SCHEMES)) {
        root = document.getElementById('checklist-card');
        var schemeId = schemeModel.getSchemeIdFromSearch(window.location.search);
        var scheme = schemeModel.findSchemeById(window.THUNAI_SCHEMES, schemeId);
        if (scheme && root) {
          mount(root, scheme, defaultStore());
        }
      }
    } catch (error) {
      if (root) {
        root.hidden = true;
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
