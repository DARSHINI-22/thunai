// THUNAI scholarship details model. Builds a detail model from one scheme record.
// Pure: no DOM access. Rendering lives in js/scheme-details.js. Plain ES2015.
(function () {
  'use strict';

  var CATEGORY_FIELD = 'category';
  var EDUCATION_FIELDS = ['educationLevel', 'eligibleCourseListed', 'fullTimeCourse', 'coursePrescribed', 'regularCourse', 'droppedAfterXii'];
  var INSTITUTION_FIELDS = ['institution', 'institutionListed'];
  var INCOME_FIELDS = ['incomeRange', 'annualFamilyIncome'];
  var VERIFICATION_LABELS = {
    'partially-verified': 'Partially verified',
    'unverified': 'Unverified',
    'verified': 'Verified'
  };
  var DISCLAIMERS = [
    'Meeting the eligibility criteria does not guarantee an award.',
    'Check the official source before you apply.'
  ];
  var NOT_CONFIRMED = 'Not yet confirmed';
  var NO_SOURCE = 'Official source not yet available';
  var NOT_FOUND = 'Scholarship not found.';

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function textOrNull(value) {
    return text(value) || null;
  }

  function stringList(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map(text).filter(function (entry) { return entry !== ''; });
  }

  function listOrNull(value) {
    var list = stringList(value);
    return list.length > 0 ? list : null;
  }

  function hasOwn(object, key) {
    return typeof key === 'string' && Object.prototype.hasOwnProperty.call(object, key);
  }

  // Rules usable for display: must have a string field and a non-empty label.
  function usableRules(scheme) {
    if (!Array.isArray(scheme.rules)) {
      return [];
    }
    return scheme.rules.filter(function (rule) {
      return rule && typeof rule === 'object' && typeof rule.field === 'string' && text(rule.label) !== '';
    });
  }

  function labelsFor(rules, fields) {
    return rules
      .filter(function (rule) { return fields.indexOf(rule.field) !== -1; })
      .map(function (rule) { return text(rule.label); });
  }

  function otherLabels(rules) {
    var known = [CATEGORY_FIELD].concat(EDUCATION_FIELDS, INSTITUTION_FIELDS, INCOME_FIELDS);
    return rules
      .filter(function (rule) { return known.indexOf(rule.field) === -1; })
      .map(function (rule) { return text(rule.label); });
  }

  function decode(value) {
    try {
      return decodeURIComponent(value.replace(/\+/g, ' '));
    } catch (error) {
      return value;
    }
  }

  // Returns the trimmed "id" query parameter, or null when it is missing or empty.
  function getSchemeIdFromSearch(search) {
    if (typeof search !== 'string') {
      return null;
    }
    var query = search.charAt(0) === '?' ? search.slice(1) : search;
    var pairs = query.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var eq = pairs[i].indexOf('=');
      var key = decode(eq === -1 ? pairs[i] : pairs[i].slice(0, eq));
      if (key === 'id') {
        return textOrNull(eq === -1 ? '' : decode(pairs[i].slice(eq + 1)));
      }
    }
    return null;
  }

  function findSchemeById(schemes, id) {
    if (!Array.isArray(schemes) || typeof id !== 'string') {
      return null;
    }
    for (var i = 0; i < schemes.length; i++) {
      if (schemes[i] && schemes[i].id === id) {
        return schemes[i];
      }
    }
    return null;
  }

  // Pure: returns display data taken only from the record. Nothing is invented.
  function buildDetailsView(scheme) {
    var s = scheme && typeof scheme === 'object' ? scheme : {};
    var rules = usableRules(s);
    var status = text(s.applicationStatus);
    var url = text(s.officialUrl);
    var verification = textOrNull(s.verificationStatus);

    return {
      name: textOrNull(s.name),
      description: textOrNull(s.description),
      department: textOrNull(s.department),
      eligibleCategories: labelsFor(rules, [CATEGORY_FIELD]),
      educationRequirements: labelsFor(rules, EDUCATION_FIELDS),
      institutionRequirements: labelsFor(rules, INSTITUTION_FIELDS),
      incomeRequirements: labelsFor(rules, INCOME_FIELDS),
      otherConditions: otherLabels(rules),
      benefits: null,
      requiredDocuments: listOrNull(s.requiredDocuments),
      applicationProcedure: listOrNull(s.applicationSteps),
      applicationDeadline: textOrNull(s.deadline),
      applicationStatus: status && status.toLowerCase() !== 'unknown' ? status : null,
      officialSource: /^https?:\/\//i.test(url) ? url : null,
      verificationStatus: verification,
      verificationLabel: verification && hasOwn(VERIFICATION_LABELS, verification) ? VERIFICATION_LABELS[verification] : null,
      verificationNotes: textOrNull(s.verificationNotes),
      lastVerified: textOrNull(s.lastVerified),
      selectionNotes: textOrNull(s.selectionNote),
      disclaimers: DISCLAIMERS.slice()
    };
  }

  var api = {
    getSchemeIdFromSearch: getSchemeIdFromSearch,
    findSchemeById: findSchemeById,
    buildDetailsView: buildDetailsView,
    NOT_CONFIRMED: NOT_CONFIRMED,
    NO_SOURCE: NO_SOURCE,
    NOT_FOUND: NOT_FOUND
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_SCHEME_MODEL = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
