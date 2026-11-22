(function () {
  'use strict';

  var PROFILE_KEY = 'thunai.studentProfile';
  var NOT_AVAILABLE = 'Not available on this browser.';
  var CORRUPT_TEXT = 'Some saved data on this device could not be read. Those items are shown as empty.';
  var LOAD_FAIL_TEXT = 'Your dashboard cannot be displayed on this browser.';
  var EMPTY_PROFILE_ROWS_TEXT = 'Profile saved, but no summary fields are filled in.';
  var MATCH_NEEDS_PROFILE_TEXT = 'Eligibility results need a saved profile. Create your profile to see matched scholarships.';
  var MATCH_NOTE = 'Eligibility results are based only on the information in your profile and do not guarantee an award.';
  var TRACKER_NOTE = 'Status is self-reported by you and is not verified by the scholarship provider.';

  function getGlobal(name) {
    try {
      return typeof window !== 'undefined' && window ? window[name] : undefined;
    } catch (e) {
      return undefined;
    }
  }

  function makeStore() {
    var ls = null;
    try {
      ls = window.localStorage;
    } catch (e) {
      ls = null;
    }
    function wrap(method) {
      return function () {
        try {
          if (!ls) { return null; }
          return ls[method].apply(ls, arguments);
        } catch (e) {
          return null;
        }
      };
    }
    return {
      getItem: wrap('getItem'),
      setItem: wrap('setItem'),
      removeItem: wrap('removeItem')
    };
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = String(text); }
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function notAvailable(node) {
    if (!node) { return; }
    clear(node);
    var tag = (node.tagName === 'UL' || node.tagName === 'OL') ? 'li' : 'p';
    node.appendChild(el(tag, 'details-value', NOT_AVAILABLE));
  }

  function asArray(x) {
    if (Array.isArray(x)) { return x; }
    if (x && Array.isArray(x.items)) { return x.items; }
    return [];
  }

  function setStatus(text) {
    var status = byId('dash-status');
    if (!status) { return; }
    status.textContent = text;
    status.hidden = false;
  }

  function schemesArray() {
    var schemes = getGlobal('THUNAI_SCHEMES');
    return Array.isArray(schemes) ? schemes : [];
  }

  function readProfile(store, profileModel) {
    var raw = store.getItem(PROFILE_KEY);
    var parsed = null;
    var corrupt = false;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        corrupt = true;
        parsed = null;
      }
    }
    var profile = null;
    if (!corrupt && parsed !== null && parsed !== undefined) {
      if (profileModel && typeof profileModel.normalizeSaved === 'function') {
        profile = profileModel.normalizeSaved(parsed) || null;
      }
    }
    return { profile: profile, corrupt: corrupt };
  }

  function renderProfile(state, dash, profileModel) {
    var body = byId('dash-profile-body');
    if (!body) { return; }
    clear(body);
    if (!dash || !profileModel) { notAvailable(body); return; }

    if (!state.profile) {
      body.appendChild(el('p', 'details-value not-confirmed', dash.NO_PROFILE_TEXT));
      var linkP = document.createElement('p');
      var link = el('a', 'btn btn-primary', 'Create your profile');
      link.href = 'profile.html';
      linkP.appendChild(link);
      body.appendChild(linkP);
      return;
    }

    var summary = dash.buildProfileSummary(state.profile);
    var rows = (summary && Array.isArray(summary.rows)) ? summary.rows : [];
    if (rows.length === 0) {
      body.appendChild(el('p', 'details-value', EMPTY_PROFILE_ROWS_TEXT));
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      body.appendChild(el('p', 'details-label', rows[i].label));
      body.appendChild(el('p', 'details-value', rows[i].value));
    }
  }

  function renderOverview(dash, savedCount, trackerEntries) {
    var list = byId('dash-overview-list');
    var note = byId('dash-submitted-note');
    if (!list) { return; }
    clear(list);
    if (!dash) {
      notAvailable(list);
      if (note) { note.textContent = NOT_AVAILABLE; }
      return;
    }

    var o = dash.buildOverview(savedCount, trackerEntries);
    var lines = [
      'Saved scholarships: ' + o.saved,
      'Tracked applications: ' + o.tracked,
      'In Progress: ' + o.inProgress,
      'Submitted (self-reported): ' + o.submitted
    ];
    for (var j = 0; j < lines.length; j++) {
      list.appendChild(el('li', null, lines[j]));
    }
    if (note) { note.textContent = o.submittedNote; }
  }



  function renderMatches(state, dash, eligibility, schemes) {
    var body = byId('dash-matches-body');
    if (!body) { return; }
    clear(body);
    if (!dash || !eligibility || typeof eligibility.evaluateAll !== 'function') {
      notAvailable(body);
      return;
    }
    if (!state.profile) {
      body.appendChild(el('p', 'details-value not-confirmed', MATCH_NEEDS_PROFILE_TEXT));
      return;
    }

    var results = eligibility.evaluateAll(state.profile, schemes);
    var summary = dash.buildMatchSummary(state.profile, results) || {};
    if (summary.state === 'unavailable') {
      body.appendChild(el('p', 'details-value', NOT_AVAILABLE));
    } else {

      body.appendChild(el('p', null, 'Likely eligible: ' + summary.likely));
      body.appendChild(el('p', null, 'More information required: ' + summary.moreInfo));
      body.appendChild(el('p', null, 'Not eligible based on available information: ' + summary.notEligible));
      var top = asArray(summary.top);
      if (top.length) {
        var ul = el('ul', 'criteria-list');
        for (var i = 0; i < top.length; i++) {
          var item = top[i] || {};
          ul.appendChild(el('li', null, item.name + ' - ' + item.status));
        }
        body.appendChild(ul);
      }
    }

    body.appendChild(el('p', 'details-value', MATCH_NOTE));
  }

  function renderSaved(dash, savedModel, savedIds, schemes) {
    var body = byId('dash-saved-body');
    if (!body) { return; }
    clear(body);
    if (!dash || !savedModel || typeof savedModel.resolveSaved !== 'function') {
      notAvailable(body);
      return;
    }

    var resolved = savedModel.resolveSaved(savedIds, schemes);
    var preview = dash.buildSavedPreview(resolved, dash.PREVIEW_LIMIT);
    var items = preview.items;
    var total = preview.total;


    if (total === 0) {
      body.appendChild(el('p', 'details-value', 'No saved scholarships yet.'));
      var p = document.createElement('p');
      var findLink = el('a', 'btn btn-secondary', 'Find scholarships');
      findLink.href = 'results.html';
      p.appendChild(findLink);
      body.appendChild(p);
      return;
    }

    var ul = el('ul', 'criteria-list');
    for (var i = 0; i < items.length; i++) {
      var item = items[i] || {};
      var li = document.createElement('li');
      var a = el('a', null, item.name);
      a.href = 'scheme-details.html?id=' + encodeURIComponent(String(item.schemeId));
      a.setAttribute('aria-label', 'View details for ' + item.name);
      li.appendChild(a);
      ul.appendChild(li);
    }
    body.appendChild(ul);
    if (total > items.length) {
      body.appendChild(el('p', null, 'and ' + (total - items.length) + ' more.'));
    }
  }

  function renderTracker(dash, trackerModel, trackerEntries, schemes) {
    var body = byId('dash-tracker-body');
    if (!body) { return; }
    clear(body);
    if (!dash || !trackerModel || typeof trackerModel.resolveTracker !== 'function') {
      notAvailable(body);
      return;
    }

    var resolved = trackerModel.resolveTracker(trackerEntries, schemes);
    var list = dash.buildTrackerPreview(resolved, trackerModel.STATUS_LABELS);
    if (!Array.isArray(list)) { list = []; }


    if (list.length === 0) {
      body.appendChild(el('p', 'details-value', 'You are not tracking any applications yet.'));
      return;
    }

    var ul = el('ul', 'criteria-list');
    for (var i = 0; i < list.length; i++) {
      var item = list[i] || {};
      var li = document.createElement('li');
      var a = el('a', null, item.name);
      a.href = 'scheme-details.html?id=' + encodeURIComponent(String(item.schemeId));
      li.appendChild(a);
      li.appendChild(document.createTextNode(' - ' + item.statusLabel));
      ul.appendChild(li);
    }
    body.appendChild(ul);
    body.appendChild(el('p', 'details-value', TRACKER_NOTE));
  }

  function renderActions(dash) {
    var list = byId('dash-actions-list');
    if (!list) { return; }
    clear(list);
    if (!dash || typeof dash.buildActionsList !== 'function') {
      notAvailable(list);
      return;
    }
    var actions = asArray(dash.buildActionsList());
    for (var i = 0; i < actions.length; i++) {
      var item = actions[i] || {};
      var li = document.createElement('li');
      var a = el('a', 'btn btn-secondary', item.label);
      a.href = item.href;
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  function safeCall(fn, fallback) {
    try {
      var value = fn();
      return value === undefined ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function render() {
    try {
      var store = makeStore();
      var dash = getGlobal('THUNAI_DASHBOARD_MODEL');
      var profileModel = getGlobal('THUNAI_PROFILE_MODEL');
      var eligibility = getGlobal('THUNAI_ELIGIBILITY');
      var savedModel = getGlobal('THUNAI_SAVED_MODEL');
      var trackerModel = getGlobal('THUNAI_TRACKER_MODEL');
      var schemes = schemesArray();

      var raw = safeCall(function () { return store.getItem(PROFILE_KEY); }, null);
      var state = { profile: null, corrupt: false };
      try {
        state = readProfile({ getItem: function () { return raw; } }, profileModel);
      } catch (e) {
        state = { profile: null, corrupt: true };
      }

      var savedIds = [];
      if (savedModel && typeof savedModel.loadSaved === 'function') {
        savedIds = asArray(safeCall(function () { return savedModel.loadSaved(store, schemes); }, []));
      }
      var trackerEntries = [];
      if (trackerModel && typeof trackerModel.loadTracker === 'function') {
        trackerEntries = asArray(safeCall(function () { return trackerModel.loadTracker(store, schemes); }, []));
      }

      renderProfile(state, dash, profileModel);
      renderOverview(dash, savedIds.length, trackerEntries);
      renderMatches(state, dash, eligibility, schemes);
      renderSaved(dash, savedModel, savedIds, schemes);
      renderTracker(dash, trackerModel, trackerEntries, schemes);
      renderActions(dash);

      if (state.corrupt) {
        setStatus(CORRUPT_TEXT);
      }
    } catch (e) {
      try {
        setStatus(LOAD_FAIL_TEXT);
      } catch (e2) {
        // Nothing more can be done without a DOM.
      }
    }
  }

  function mount() {
    try {
      render();
    } catch (e) {
      try {
        setStatus(LOAD_FAIL_TEXT);
      } catch (e2) {
        // Nothing more can be done without a DOM.
      }
    }
  }

  var api = { render: render };

  try {
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && document && byId('dash-profile-body')) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
      } else {
        mount();
      }
    }
  } catch (e) {
    try {
      setStatus(LOAD_FAIL_TEXT);
    } catch (e2) {
      // Nothing more can be done without a DOM.
    }
  }

  if (typeof window !== 'undefined') { window.THUNAI_DASHBOARD = api; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
})();
