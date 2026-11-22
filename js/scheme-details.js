// THUNAI scholarship details view. Renders the detail model (js/scheme-details-model.js)
// on scheme-details.html. Plain ES2015; all text is set with textContent.
(function () {
  'use strict';

  // Loads the details model in the browser (window) or in Node (require).
  function loadModel() {
    if (typeof window !== 'undefined' && window.THUNAI_SCHEME_MODEL) {
      return window.THUNAI_SCHEME_MODEL;
    }
    if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
      try {
        return require('./scheme-details-model.js');
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  var model = loadModel();
  var NOT_CONFIRMED = model.NOT_CONFIRMED;
  var NO_SOURCE = model.NO_SOURCE;
  var NOT_FOUND = model.NOT_FOUND;

  // ---- Browser rendering (only runs when a document exists) ----

  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (content !== undefined && content !== null) {
      node.textContent = String(content);
    }
    return node;
  }

  function valueNode(value) {
    if (value) {
      return el('p', 'details-value', value);
    }
    return el('p', 'details-value not-confirmed', NOT_CONFIRMED);
  }

  function fillValue(box, value) {
    box.textContent = '';
    box.appendChild(valueNode(value));
  }

  function fillList(box, values) {
    box.textContent = '';
    if (!values || values.length === 0) {
      box.appendChild(valueNode(null));
      return;
    }
    var list = el('ul', 'criteria-list');
    values.forEach(function (value) {
      list.appendChild(el('li', null, value));
    });
    box.appendChild(list);
  }

  function badgeClass(status) {
    if (status === 'partially-verified') {
      return ' verification-partial';
    }
    if (status === 'unverified') {
      return ' verification-unverified';
    }
    return '';
  }

  function fillVerification(view, box) {
    box.textContent = '';
    box.appendChild(el('p', 'verification-badge' + badgeClass(view.verificationStatus), view.verificationLabel || NOT_CONFIRMED));
    box.appendChild(el('p', 'details-label', 'Verification notes'));
    box.appendChild(valueNode(view.verificationNotes));
    box.appendChild(el('p', 'details-label', 'Last verified'));
    box.appendChild(valueNode(view.lastVerified));
  }

  function fillSource(box, url) {
    box.textContent = '';
    if (!url) {
      box.appendChild(el('p', 'details-value', NO_SOURCE));
      return;
    }
    var link = el('a', null, 'Visit official source');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    var p = el('p', 'details-value');
    p.appendChild(link);
    box.appendChild(p);
  }

  function fillOverview(view, box) {
    box.textContent = '';
    box.appendChild(el('p', 'details-label', 'Description'));
    box.appendChild(valueNode(view.description));
    box.appendChild(el('p', 'details-label', 'Department'));
    box.appendChild(valueNode(view.department));
    box.appendChild(el('p', 'details-label', 'Disclaimers'));
    var list = el('ul', 'criteria-list');
    view.disclaimers.forEach(function (line) {
      list.appendChild(el('li', null, line));
    });
    box.appendChild(list);
  }

  // Section id in scheme-details.html, and how to fill it from the view.
  var SECTIONS = [
    { id: 'sec-overview', render: fillOverview },
    { id: 'sec-categories', render: function (v, b) { fillList(b, v.eligibleCategories); } },
    { id: 'sec-education', render: function (v, b) { fillList(b, v.educationRequirements); } },
    { id: 'sec-institution', render: function (v, b) { fillList(b, v.institutionRequirements); } },
    { id: 'sec-income', render: function (v, b) { fillList(b, v.incomeRequirements); } },
    { id: 'sec-other', render: function (v, b) { fillList(b, v.otherConditions); } },
    { id: 'sec-benefits', render: function (v, b) { fillValue(b, v.benefits); } },
    { id: 'sec-documents', render: function (v, b) { fillList(b, v.requiredDocuments); } },
    { id: 'sec-procedure', render: function (v, b) { fillList(b, v.applicationProcedure); } },
    { id: 'sec-deadline', render: function (v, b) { fillValue(b, v.applicationDeadline); } },
    { id: 'sec-status', render: function (v, b) { fillValue(b, v.applicationStatus); } },
    { id: 'sec-source', render: function (v, b) { fillSource(b, v.officialSource); } },
    { id: 'sec-verification', render: fillVerification },
    { id: 'sec-selection', render: function (v, b) { fillValue(b, v.selectionNotes); } }
  ];

  function renderView(view) {
    var title = document.getElementById('details-title');
    if (title) {
      title.textContent = view.name || NOT_CONFIRMED;
    }
    SECTIONS.forEach(function (section) {
      var box = document.getElementById(section.id);
      if (box) {
        section.render(view, box);
      }
    });
  }

  function showNotFound(statusEl, viewEl) {
    statusEl.textContent = '';
    statusEl.appendChild(document.createTextNode(NOT_FOUND + ' '));
    var link = el('a', 'btn btn-secondary', 'Back to results');
    link.href = 'results.html';
    statusEl.appendChild(link);
    statusEl.hidden = false;
    if (viewEl) {
      viewEl.hidden = true;
    }
  }

  function initDetailsPage() {
    var statusEl = document.getElementById('details-status');
    var viewEl = document.getElementById('details-view');
    var schemes = window.THUNAI_SCHEMES;
    var scheme = model.findSchemeById(schemes, model.getSchemeIdFromSearch(window.location.search));

    if (!scheme) {
      if (statusEl) {
        showNotFound(statusEl, viewEl);
      }
      return;
    }
    renderView(model.buildDetailsView(scheme));
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.hidden = true;
    }
    if (viewEl) {
      viewEl.hidden = false;
    }
  }

  var api = {
    getSchemeIdFromSearch: model.getSchemeIdFromSearch,
    findSchemeById: model.findSchemeById,
    buildDetailsView: model.buildDetailsView
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_SCHEME_DETAILS = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      initDetailsPage();
    } catch (error) {
      var statusEl = document.getElementById('details-status');
      var viewEl = document.getElementById('details-view');
      if (viewEl) {
        viewEl.hidden = true;
      }
      if (statusEl) {
        statusEl.textContent = 'Scholarship details cannot be displayed on this browser.';
        statusEl.hidden = false;
      }
    }
  }
})();
