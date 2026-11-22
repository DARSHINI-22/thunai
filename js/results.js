// THUNAI results view. Turns eligibility results into display data and renders
// them on results.html. Plain ES2015, no DOM access outside the browser entry.
(function () {
  'use strict';

  var FALLBACK_STATUS = {
    LIKELY: 'Likely Eligible',
    MORE_INFO: 'More Information Required',
    NOT_ELIGIBLE: 'Not Eligible Based on Available Information'
  };

  // Loads the eligibility engine in the browser (window) or in Node (require).
  function loadEligibility() {
    if (typeof window !== 'undefined' && window.THUNAI_ELIGIBILITY) {
      return window.THUNAI_ELIGIBILITY;
    }
    if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
      try {
        return require('./eligibility.js');
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  var engine = loadEligibility();
  var STATUS = (engine && engine.STATUS) || FALLBACK_STATUS;
  var GROUP_ORDER = [STATUS.LIKELY, STATUS.MORE_INFO, STATUS.NOT_ELIGIBLE];

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function textList(value) {
    return Array.isArray(value)
      ? value.filter(function (entry) { return typeof entry === 'string'; })
      : [];
  }

  function findScheme(schemes, id) {
    for (var i = 0; i < schemes.length; i++) {
      if (schemes[i] && schemes[i].id === id) {
        return schemes[i];
      }
    }
    return null;
  }

  function buildItem(result, scheme) {
    var s = scheme || {};
    return {
      schemeId: result.schemeId,
      name: text(result.schemeName) || text(s.name) || 'Unnamed scheme',
      description: text(s.description),
      department: text(s.department),
      verificationStatus: text(s.verificationStatus) || 'Not available',
      verificationNotes: text(s.verificationNotes) || 'Not available',
      isDemo: result.isDemo === true || s.isDemo === true,
      lastVerified: text(s.lastVerified) || 'Not available',
      deadline: typeof s.deadline === 'string' && s.deadline.trim() ? s.deadline.trim() : null,
      officialUrl: text(s.officialUrl) || null,
      requiredDocuments: textList(s.requiredDocuments),
      selectionNote: text(s.selectionNote) || null,
      matched: textList(result.matchedCriteria),
      failed: textList(result.failedCriteria),
      missing: textList(result.missingInformation),
      explanation: text(result.explanation)
    };
  }

  // Pure: groups eligibility results by status, in display order.
  function buildResultsView(results, schemes) {
    var resultList = Array.isArray(results) ? results : [];
    var schemeList = Array.isArray(schemes) ? schemes : [];
    var groups = GROUP_ORDER.map(function (status) {
      return { status: status, label: status, items: [] };
    });

    resultList.forEach(function (result) {
      if (!result || typeof result !== 'object') {
        return;
      }
      groups.forEach(function (group) {
        if (group.status === result.status) {
          group.items.push(buildItem(result, findScheme(schemeList, result.schemeId)));
        }
      });
    });

    return { groups: groups };
  }

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

  function statusClass(status) {
    if (status === STATUS.LIKELY) {
      return 'status-likely';
    }
    if (status === STATUS.MORE_INFO) {
      return 'status-more-info';
    }
    return 'status-not-eligible';
  }

  function listBlock(heading, values) {
    var wrap = el('div', 'criteria-block');
    wrap.appendChild(el('h4', null, heading));
    var list = el('ul', 'criteria-list');
    if (values.length === 0) {
      list.appendChild(el('li', null, 'None'));
    } else {
      values.forEach(function (value) {
        list.appendChild(el('li', null, value));
      });
    }
    wrap.appendChild(list);
    return wrap;
  }

  function sourceParagraph(url) {
    var p = el('p', 'scheme-meta');
    if (url && /^https?:\/\//i.test(url)) {
      p.appendChild(document.createTextNode('Official source: '));
      var link = el('a', null, 'Visit official source');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      p.appendChild(link);
    } else {
      p.textContent = 'Official source not yet available';
    }
    return p;
  }

  function buildCard(item, group) {
    var article = el('article', 'card scheme-card');
    article.appendChild(el('h3', null, item.name));
    article.appendChild(el('p', 'status-badge ' + statusClass(group.status), group.label));
    article.appendChild(el('p', 'scheme-description', item.description));
    article.appendChild(el('p', 'scheme-meta', 'Department: ' + (item.department || 'Not available')));
    article.appendChild(el('p', 'scheme-meta', 'Verification status: ' + item.verificationStatus));
    article.appendChild(el('p', 'scheme-meta', 'Last verified: ' + item.lastVerified));
    article.appendChild(el('p', 'scheme-meta', 'Verification notes: ' + item.verificationNotes));
    article.appendChild(el('p', 'scheme-meta', 'Deadline: ' + (item.deadline === null || item.deadline === undefined ? 'Not published in the source' : item.deadline)));
    article.appendChild(sourceParagraph(item.officialUrl));
    if (Array.isArray(item.requiredDocuments)) {
      article.appendChild(listBlock('Required documents', item.requiredDocuments));
    } else {
      var docsWrap = el('div', 'criteria-block');
      docsWrap.appendChild(el('h4', null, 'Required documents'));
      docsWrap.appendChild(el('p', 'scheme-meta', 'Not published in the source'));
      article.appendChild(docsWrap);
    }
    article.appendChild(listBlock('Matched criteria', item.matched));
    article.appendChild(listBlock('Failed criteria', item.failed));
    article.appendChild(listBlock('Missing information', item.missing));
    article.appendChild(el('p', 'scheme-explanation', item.explanation));
    article.appendChild(el('p', 'scheme-note', 'This is not a guarantee of approval.'));
    if (item.selectionNote !== null && item.selectionNote !== undefined) {
      var selectionWrap = el('div', 'criteria-block');
      selectionWrap.appendChild(el('h4', null, 'Final scholarship selection'));
      selectionWrap.appendChild(el('p', 'scheme-meta', item.selectionNote));
      selectionWrap.appendChild(el('p', 'scheme-note', 'Meeting these criteria does not guarantee an award.'));
      article.appendChild(selectionWrap);
    }
    return article;
  }

  function renderGroups(listEl, view) {
    view.groups.forEach(function (group, index) {
      var section = el('section', 'results-group');
      var headingId = 'results-group-' + index;
      var heading = el('h2', 'results-group-title', group.label);
      heading.id = headingId;
      heading.appendChild(el('span', 'results-count', ' (' + group.items.length + ')'));
      section.setAttribute('aria-labelledby', headingId);
      section.appendChild(heading);

      if (group.items.length === 0) {
        section.appendChild(el('p', 'results-empty', 'No schemes in this group.'));
      } else {
        var grid = el('div', 'results-list');
        group.items.forEach(function (item) {
          grid.appendChild(buildCard(item, group));
        });
        section.appendChild(grid);
      }
      listEl.appendChild(section);
    });
  }

  function hideList(listEl) {
    if (listEl) {
      listEl.textContent = '';
      listEl.hidden = true;
    }
  }

  function showNoProfile(statusEl) {
    statusEl.textContent = '';
    statusEl.appendChild(document.createTextNode('No student profile found. '));
    var link = el('a', null, 'Create your profile');
    link.href = 'profile.html';
    statusEl.appendChild(link);
    statusEl.appendChild(document.createTextNode(' to see eligibility results.'));
  }

  function initResultsPage() {
    var statusEl = document.getElementById('results-status');
    var listEl = document.getElementById('results-list');
    if (!engine) {
      throw new Error('Eligibility engine not loaded.');
    }

    var storage = null;
    try {
      storage = window.localStorage;
    } catch (error) {
      storage = null;
    }

    var profile = engine.getSavedProfile(storage);
    if (!profile) {
      hideList(listEl);
      if (statusEl) {
        showNoProfile(statusEl);
      }
      return;
    }

    var schemes = Array.isArray(window.THUNAI_SCHEMES) ? window.THUNAI_SCHEMES : [];
    var view = buildResultsView(engine.evaluateAll(profile, schemes), schemes);
    if (!listEl) {
      return;
    }
    listEl.textContent = '';
    renderGroups(listEl, view);
    listEl.hidden = false;
    if (statusEl) {
      statusEl.textContent = '';
    }
  }

  var api = {
    buildResultsView: buildResultsView
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_RESULTS = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      initResultsPage();
    } catch (error) {
      var statusEl = document.getElementById('results-status');
      hideList(document.getElementById('results-list'));
      if (statusEl) {
        statusEl.textContent = 'Results cannot be displayed on this browser.';
      }
    }
  }
})();
