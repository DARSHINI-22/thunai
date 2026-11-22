// THUNAI comparison UI: compare toggles on results and details, and the comparison page.
// Uses textContent only. Logic lives in js/comparison-selection-model.js and js/comparison-model.js. Plain ES2015.
(function () {
  'use strict';

  var TOGGLE_CLASS = 'compare-toggle';
  var STATUS_CLASS = 'compare-status';
  var ADDED_TEXT = 'Added to comparison.';
  var REMOVED_TEXT = 'Removed from comparison.';
  var ALREADY_TEXT = 'This scholarship is already in your comparison.';
  var INVALID_TEXT = 'This scholarship cannot be added.';
  var SAVE_FAILED_TEXT = 'Could not save your comparison in this browser.';
  var PAGE_REMOVE_FAILED_TEXT = 'Could not update your comparison in this browser.';
  var CLEARED_TEXT = 'Comparison cleared.';
  var CLEAR_FAILED_TEXT = 'Could not clear your comparison in this browser.';

  // Each returns the loaded module, or null when it is missing. Every entry point does nothing without it.
  function selectionModel() {
    return (typeof window !== 'undefined' && window.THUNAI_COMPARISON_SELECTION) || null;
  }

  function comparisonModel() {
    return (typeof window !== 'undefined' && window.THUNAI_COMPARISON_MODEL) || null;
  }

  function schemeModel() {
    return (typeof window !== 'undefined' && window.THUNAI_SCHEME_MODEL) || null;
  }

  function guidanceModel() {
    return (typeof window !== 'undefined' && window.THUNAI_APPLICATION_GUIDANCE_MODEL) || null;
  }

  function getSchemes() {
    return (typeof window !== 'undefined' && Array.isArray(window.THUNAI_SCHEMES)) ? window.THUNAI_SCHEMES : [];
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
      }
    };
  }

  function deps() {
    var scheme = schemeModel() || {};
    var guidance = guidanceModel() || {};
    return {
      buildDetailsView: scheme.buildDetailsView,
      buildGuidanceView: guidance.buildGuidanceView,
      AVAILABILITY_UNKNOWN_TEXT: guidance.AVAILABILITY_UNKNOWN_TEXT
    };
  }

  function schemeName(scheme) {
    return scheme.name || scheme.id;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function clearChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  // Returns the status paragraph directly after the button, creating it once if needed.
  function ensureStatus(button) {
    var next = button.nextSibling;
    if (next && next.nodeType === 1 && next.classList.contains(STATUS_CLASS)) {
      return next;
    }
    var status = document.createElement('p');
    status.className = STATUS_CLASS;
    status.setAttribute('aria-live', 'polite');
    button.parentNode.insertBefore(status, button.nextSibling);
    return status;
  }

  // Sets the button text, aria-pressed and aria-label from the current selection. Returns the pressed state.
  function applyToggleState(button, scheme, selection) {
    var model = selectionModel();
    var pressed = model.isSelected(selection, scheme.id);
    var name = schemeName(scheme);
    button.textContent = pressed ? 'Remove from comparison' : 'Add to comparison';
    button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    button.setAttribute('aria-label', (pressed ? 'Remove ' : 'Add ') + name + (pressed ? ' from comparison' : ' to comparison'));
    return pressed;
  }

  function mountToggle(button, scheme, store, schemes) {
    var model = selectionModel();
    if (!model || !button || !scheme) {
      return;
    }
    button.type = 'button';
    button.classList.add(TOGGLE_CLASS);
    var status = ensureStatus(button);
    applyToggleState(button, scheme, model.loadSelection(store, schemes));

    button.addEventListener('click', function () {
      var sel = model.loadSelection(store, schemes);
      var next;
      var message;

      if (model.isSelected(sel, scheme.id)) {
        next = model.removeSelection(sel, scheme.id);
        message = REMOVED_TEXT;
      } else {
        var res = model.addSelection(sel, scheme.id);
        if (res.status === 'added') {
          next = res.ids;
          message = ADDED_TEXT;
        } else if (res.status === 'full') {
          status.textContent = model.LIMIT_TEXT;
          return;
        } else if (res.status === 'already') {
          status.textContent = ALREADY_TEXT;
          return;
        } else {
          status.textContent = INVALID_TEXT;
          return;
        }
      }

      var saved = model.saveSelection(store, next);
      if (!saved || !saved.ok) {
        status.textContent = SAVE_FAILED_TEXT;
        return;
      }
      applyToggleState(button, scheme, model.loadSelection(store, schemes));
      status.textContent = message;
    });
  }

  // Extracts and decodes the id from an href such as scheme-details.html?id=abc. Returns null when absent.
  function idFromHref(href) {
    var match = /[?&]id=([^&#]+)/.exec(href || '');
    if (!match) {
      return null;
    }
    try {
      return decodeURIComponent(match[1]);
    } catch (error) {
      return null;
    }
  }

  function findScheme(schemes, id) {
    var model = schemeModel();
    if (!model || !id) {
      return null;
    }
    return model.findSchemeById(schemes, id) || null;
  }

  // Adds a compare toggle after each a.scheme-details-link under root (default document). Never throws.
  function decorateResults(root) {
    if (!selectionModel()) {
      return;
    }
    var scope = root || document;
    var store = defaultStore();
    var schemes = getSchemes();
    var links = scope.querySelectorAll('a.scheme-details-link');

    for (var i = 0; i < links.length; i++) {
      try {
        var link = links[i];
        var parent = link.parentNode;
        if (!parent) {
          continue;
        }
        var id = idFromHref(link.getAttribute('href'));
        var scheme = findScheme(schemes, id);
        if (!scheme || parent.querySelector('.' + TOGGLE_CLASS)) {
          continue;
        }
        var button = document.createElement('button');
        parent.insertBefore(button, link.nextSibling);
        mountToggle(button, scheme, store, schemes);
      } catch (error) {
        // Never throw: skip links that cannot be decorated.
        continue;
      }
    }
  }

  function mountDetailsToggle(slot, scheme, store, schemes) {
    if (!selectionModel() || !slot || !scheme) {
      return;
    }
    clearChildren(slot);
    var button = document.createElement('button');
    var status = document.createElement('p');
    status.className = STATUS_CLASS;
    status.setAttribute('aria-live', 'polite');
    slot.appendChild(button);
    slot.appendChild(status);
    mountToggle(button, scheme, store, schemes);
  }

  // Header name for a column: the scheme name from the model cells, falling back to the id.
  function columnName(column) {
    var nameCell = column.cells && column.cells.name;
    if (Array.isArray(nameCell) && nameCell.length && nameCell[0]) {
      return nameCell[0];
    }
    return column.schemeId;
  }

  function appendCellValue(td, value, notConfirmedText) {
    if (Array.isArray(value)) {
      var list = document.createElement('ul');
      list.className = 'criteria-list';
      for (var i = 0; i < value.length; i++) {
        var item = document.createElement('li');
        item.textContent = value[i];
        list.appendChild(item);
      }
      td.appendChild(list);
      return;
    }
    if (value === null || value === undefined) {
      var span = document.createElement('span');
      span.className = 'not-confirmed';
      span.textContent = notConfirmedText;
      td.appendChild(span);
      return;
    }
    td.textContent = String(value);
  }

  function setPageStatus(text) {
    var statusEl = byId('compare-status');
    if (statusEl) {
      statusEl.textContent = text;
    }
  }

  function removeColumn(id, store, schemes) {
    var model = selectionModel();
    var next = model.removeSelection(model.loadSelection(store, schemes), id);
    var saved = model.saveSelection(store, next);
    if (saved && saved.ok) {
      renderComparisonPage(store, schemes);
      setPageStatus(REMOVED_TEXT);
    } else {
      setPageStatus(PAGE_REMOVE_FAILED_TEXT);
    }
  }

  function buildTable(table, columns, store, schemes) {
    var cm = comparisonModel();
    var notConfirmed = cm.NOT_CONFIRMED;
    clearChildren(table);

    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');
    var corner = document.createElement('th');
    corner.setAttribute('scope', 'col');
    corner.textContent = 'Criterion';
    headRow.appendChild(corner);

    for (var c = 0; c < columns.length; c++) {
      (function (column) {
        var name = columnName(column);
        var th = document.createElement('th');
        th.setAttribute('scope', 'col');

        var nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        th.appendChild(nameSpan);

        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn btn-secondary compare-remove';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', 'Remove ' + name + ' from comparison');
        remove.addEventListener('click', function () {
          removeColumn(column.schemeId, store, schemes);
        });
        th.appendChild(remove);

        var link = document.createElement('a');
        link.className = 'btn btn-secondary';
        link.setAttribute('href', 'scheme-details.html?id=' + encodeURIComponent(column.schemeId));
        link.setAttribute('aria-label', 'View details for ' + name);
        link.textContent = 'View details';
        th.appendChild(link);

        headRow.appendChild(th);
      })(columns[c]);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    var rows = cm.ROWS;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var tr = document.createElement('tr');
      var rowHead = document.createElement('th');
      rowHead.setAttribute('scope', 'row');
      rowHead.textContent = row.label;
      tr.appendChild(rowHead);

      for (var k = 0; k < columns.length; k++) {
        var td = document.createElement('td');
        appendCellValue(td, columns[k].cells ? columns[k].cells[row.key] : null, notConfirmed);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  }

  // Renders the comparison page from the saved selection. Does nothing when the page elements are absent.
  function renderComparisonPage(store, schemes) {
    var model = selectionModel();
    var cm = comparisonModel();
    if (!model || !cm) {
      return;
    }
    var countEl = byId('compare-count');
    var emptyEl = byId('compare-empty');
    var wrap = byId('compare-wrap');
    var table = byId('compare-table');
    var clearBtn = byId('compare-clear');

    var selection = model.loadSelection(store, schemes);
    var columns = cm.buildComparisonColumns(schemes, selection, deps());

    if (countEl) {
      countEl.textContent = model.summaryText(columns.length);
    }

    if (columns.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      if (wrap) wrap.hidden = true;
      if (clearBtn) clearBtn.hidden = true;
      if (table) clearChildren(table);
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (wrap) {
      wrap.hidden = false;
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', 'Scholarship comparison table');
    }
    if (clearBtn) clearBtn.hidden = false;
    if (table) buildTable(table, columns, store, schemes);
  }

  function clearComparison(store, schemes) {
    var model = selectionModel();
    if (!model) {
      return;
    }
    var saved = model.saveSelection(store, model.clearSelection());
    renderComparisonPage(store, schemes);
    setPageStatus(saved && saved.ok ? CLEARED_TEXT : CLEAR_FAILED_TEXT);
  }

  function bindClearButton() {
    var clearBtn = byId('compare-clear');
    if (!clearBtn) {
      return;
    }
    clearBtn.addEventListener('click', function () {
      clearComparison(defaultStore(), getSchemes());
    });
  }

  function hideAll(selector) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].hidden = true;
    }
  }

  function autoMount() {
    // (a) comparison.html: render the page and wire its clear button.
    if (byId('compare-table')) {
      try {
        bindClearButton();
        renderComparisonPage(defaultStore(), getSchemes());
      } catch (error) {
        var wrap = byId('compare-wrap');
        if (wrap) wrap.hidden = true;
      }
    }

    // (b) results.html and similar: add compare toggles after detail links.
    if (document.querySelector('a.scheme-details-link')) {
      try {
        decorateResults(document);
      } catch (error) {
        hideAll('.' + TOGGLE_CLASS);
      }
    }

    // (c) scheme-details.html: mount the toggle in #compare-slot for the scheme in the URL.
    var slot = byId('compare-slot');
    if (slot && schemeModel()) {
      try {
        var model = schemeModel();
        var id = model.getSchemeIdFromSearch(window.location.search);
        var scheme = model.findSchemeById(getSchemes(), id);
        if (scheme) {
          mountDetailsToggle(slot, scheme, defaultStore(), getSchemes());
        }
      } catch (error) {
        slot.hidden = true;
      }
    }
  }

  function init() {
    try {
      autoMount();
    } catch (error) {
      // Never throw from page load.
    }
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  var api = {
    getSchemes: getSchemes,
    defaultStore: defaultStore,
    deps: deps,
    mountToggle: mountToggle,
    decorateResults: decorateResults,
    mountDetailsToggle: mountDetailsToggle,
    renderComparisonPage: renderComparisonPage
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_COMPARISON_UI = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
