// THUNAI application guidance: renders the application guidance card on the scheme details page.
// Uses textContent only. Logic lives in js/application-guidance-model.js. Plain ES2015.
(function () {
  'use strict';

  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (content !== undefined && content !== null) {
      node.textContent = content;
    }
    return node;
  }

  function link(href, text) {
    var anchor = el('a', null, text);
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    return anchor;
  }

  function linkLine(href, text) {
    var line = el('p', 'details-value');
    line.appendChild(link(href, text));
    return line;
  }

  function notConfirmed(model) {
    return el('p', 'details-value not-confirmed', model.NOT_CONFIRMED_TEXT);
  }

  function appendLabelValue(body, label, value) {
    body.appendChild(el('p', 'details-label', label));
    body.appendChild(value);
  }

  function appendListValue(body, label, items, listTag, model) {
    var value = notConfirmed(model);
    if (items) {
      value = el(listTag, 'criteria-list');
      items.forEach(function (item) {
        value.appendChild(el('li', null, item));
      });
    }
    appendLabelValue(body, label, value);
  }

  function renderGuidance(body, view, model) {
    if (!view.hasGuidance) {
      body.appendChild(notConfirmed(model));
    } else {
      appendLabelValue(body, 'Where to apply',
        view.where ? el('p', 'details-value', view.where) : notConfirmed(model));
      appendLabelValue(body, 'Application method',
        view.method ? el('p', 'details-value', view.method) : notConfirmed(model));
      appendListValue(body, 'Step-by-step instructions', view.steps, 'ol', model);
      appendLabelValue(body, 'Official application portal',
        view.portalUrl ? linkLine(view.portalUrl, 'Open official application portal') : notConfirmed(model));
      appendListValue(body, 'Important notes', view.notes, 'ul', model);
    }

    body.appendChild(el('p', 'details-label', 'Official source verification'));
    body.appendChild(el('p', 'details-value', view.verifiedLabel));
    if (view.sourceUrl) {
      body.appendChild(linkLine(view.sourceUrl, 'View official source'));
    }

    body.appendChild(el('p', 'details-label', 'Current application availability'));
    body.appendChild(el('p', 'details-value', view.availabilityLabel));
    body.appendChild(el('p', 'details-value', model.AVAILABILITY_NOTE));
  }

  function mount(root, scheme) {
    var model = window.THUNAI_APPLICATION_GUIDANCE_MODEL;
    if (!model) {
      return;
    }
    var body = root.querySelector('#guidance-body');
    if (!body) {
      return;
    }
    body.textContent = '';
    renderGuidance(body, model.buildGuidanceView(scheme), model);
  }

  var api = { mount: mount };

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.THUNAI_APP_GUIDANCE = api;

    var root = null;
    try {
      var schemeModel = window.THUNAI_SCHEME_MODEL;
      var schemes = window.THUNAI_SCHEMES;
      var guidanceModel = window.THUNAI_APPLICATION_GUIDANCE_MODEL;
      root = document.getElementById('guidance-card');
      if (schemeModel && Array.isArray(schemes) && guidanceModel && root) {
        var schemeId = schemeModel.getSchemeIdFromSearch(window.location.search);
        var scheme = schemeModel.findSchemeById(schemes, schemeId);
        if (scheme) {
          mount(root, scheme);
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
