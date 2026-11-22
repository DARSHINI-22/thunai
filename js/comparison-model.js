/*
 * THUNAI scholarship comparison model.
 * Pure logic: no DOM access. Builds side-by-side comparison columns from
 * scheme data using the details and guidance view builders passed in as deps.
 */
(function () {
  'use strict';

  var NOT_CONFIRMED = 'Not yet confirmed';

  var ROWS = [
    { key: 'name', label: 'Scheme name' },
    { key: 'description', label: 'Description' },
    { key: 'provider', label: 'Provider' },
    { key: 'category', label: 'Target category' },
    { key: 'education', label: 'Education level' },
    { key: 'course', label: 'Course eligibility' },
    { key: 'income', label: 'Family income criteria' },
    { key: 'institution', label: 'Institution requirements' },
    { key: 'method', label: 'Application method' },
    { key: 'benefits', label: 'Benefits' },
    { key: 'documents', label: 'Required documents' },
    { key: 'deadline', label: 'Application deadline' },
    { key: 'verification', label: 'Verification status' },
    { key: 'availability', label: 'Application availability' }
  ];

  // Returns [trimmed] for a non-empty string, otherwise null.
  function textCell(value) {
    if (typeof value !== 'string') return null;
    var trimmed = value.trim();
    return trimmed ? [trimmed] : null;
  }

  // Collects trimmed labels of rules whose `field` is in fields.
  function ruleLabels(scheme, fields) {
    if (!Array.isArray(scheme.rules)) return null;
    var labels = [];
    for (var i = 0; i < scheme.rules.length; i++) {
      var rule = scheme.rules[i];
      if (!rule || typeof rule !== 'object') continue;
      if (typeof rule.field !== 'string' || fields.indexOf(rule.field) === -1) continue;
      if (typeof rule.label !== 'string') continue;
      var trimmed = rule.label.trim();
      if (trimmed) labels.push(trimmed);
    }
    return labels.length ? labels : null;
  }

  function findSchemeById(schemes, id) {
    for (var i = 0; i < schemes.length; i++) {
      var scheme = schemes[i];
      if (!scheme || typeof scheme !== 'object') continue;
      if (Object.prototype.hasOwnProperty.call(scheme, 'id') && scheme.id === id) {
        return scheme;
      }
    }
    return null;
  }

  function buildCells(scheme, view, guidance, deps) {
    var documents = null;
    if (Array.isArray(view.requiredDocuments)) {
      var docs = [];
      for (var i = 0; i < view.requiredDocuments.length; i++) {
        var doc = textCell(view.requiredDocuments[i]);
        if (doc) docs.push(doc[0]);
      }
      documents = docs.length ? docs : null;
    }

    var availability = null;
    var availabilityText = textCell(guidance.availabilityLabel);
    if (availabilityText && availabilityText[0] !== deps.AVAILABILITY_UNKNOWN_TEXT) {
      availability = availabilityText;
    }

    return {
      name: textCell(view.name),
      description: textCell(view.description),
      provider: textCell(view.department),
      category: ruleLabels(scheme, ['category']),
      education: ruleLabels(scheme, ['educationLevel']),
      course: ruleLabels(scheme, ['eligibleCourseListed', 'fullTimeCourse', 'coursePrescribed', 'regularCourse', 'droppedAfterXii']),
      income: ruleLabels(scheme, ['incomeRange', 'annualFamilyIncome']),
      institution: ruleLabels(scheme, ['institution', 'institutionListed']),
      method: textCell(guidance.method),
      benefits: textCell(view.benefits),
      documents: documents,
      deadline: textCell(view.applicationDeadline),
      verification: textCell(view.verificationLabel),
      availability: availability
    };
  }

  function buildComparisonColumns(schemes, ids, deps) {
    if (!Array.isArray(schemes) || !Array.isArray(ids)) return [];
    if (!deps || typeof deps !== 'object') deps = {};

    var columns = [];
    var seen = {};

    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var seenKey = typeof id + ':' + String(id);
      if (Object.prototype.hasOwnProperty.call(seen, seenKey)) continue;
      seen[seenKey] = true;

      var scheme = findSchemeById(schemes, id);
      if (!scheme) continue;

      try {
        var view = deps.buildDetailsView(scheme) || {};
        var guidance = deps.buildGuidanceView(scheme) || {};
        columns.push({
          schemeId: scheme.id,
          cells: buildCells(scheme, view, guidance, deps)
        });
      } catch (err) {
        // Never throw: skip schemes whose views cannot be built.
        continue;
      }
    }

    return columns;
  }

  var api = {
    ROWS: ROWS,
    NOT_CONFIRMED: NOT_CONFIRMED,
    buildComparisonColumns: buildComparisonColumns
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_COMPARISON_MODEL = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
