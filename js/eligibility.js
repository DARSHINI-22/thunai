// THUNAI eligibility engine. Deterministic, rule-based, holds no scheme data.
(function () {
  'use strict';

  var STORAGE_KEY = 'thunai.studentProfile';
  var STATUS = {
    LIKELY: 'Likely Eligible',
    MORE_INFO: 'More Information Required',
    NOT_ELIGIBLE: 'Not Eligible Based on Available Information'
  };
  var STATUS_ORDER = [STATUS.LIKELY, STATUS.MORE_INFO, STATUS.NOT_ELIGIBLE];
  var NO_RULES = 'No eligibility rules are defined for this scheme.';

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // Reads a profile key. Returns undefined when the value is missing or unusable.
  function fieldValue(profile, field) {
    if (!isObject(profile) || typeof field !== 'string') {
      return undefined;
    }
    var value = profile[field];
    if (field === 'age') {
      var age = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value;
      return typeof age === 'number' && age % 1 === 0 && age >= 14 && age <= 60 ? age : undefined;
    }
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'number' && isNaN(value)) {
      return undefined;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value;
  }

  // Returns 'pass', 'fail' or 'missing' (unknown or malformed rules are missing).
  function testRule(value, rule) {
    var expected = rule.value;
    switch (rule.operator) {
      case 'equals': return value === expected ? 'pass' : 'fail';
      case 'notEquals': return value !== expected ? 'pass' : 'fail';
      case 'in':
        if (!Array.isArray(expected)) { return 'missing'; }
        return expected.indexOf(value) !== -1 ? 'pass' : 'fail';
      case 'notIn':
        if (!Array.isArray(expected)) { return 'missing'; }
        return expected.indexOf(value) === -1 ? 'pass' : 'fail';
      case 'minNumber':
        if (typeof expected !== 'number') { return 'missing'; }
        return typeof value === 'number' && value >= expected ? 'pass' : 'fail';
      case 'maxNumber':
        if (typeof expected !== 'number') { return 'missing'; }
        return typeof value === 'number' && value <= expected ? 'pass' : 'fail';
      case 'nonEmpty': return 'pass';
      default: return 'missing';
    }
  }

  // Returns the saved profile object, or null when missing, corrupt or unavailable.
  function getSavedProfile(storage) {
    try {
      var store = storage === undefined
        ? (typeof window !== 'undefined' ? window.localStorage : null)
        : storage;
      if (!store) {
        return null;
      }
      var raw = store.getItem(STORAGE_KEY);
      if (typeof raw !== 'string') {
        return null;
      }
      var parsed = JSON.parse(raw);
      return isObject(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function evaluateScheme(profile, scheme) {
    var s = isObject(scheme) ? scheme : {};
    var rules = Array.isArray(s.rules) ? s.rules : null;
    var result = {
      schemeId: s.id === undefined ? null : s.id,
      schemeName: typeof s.name === 'string' ? s.name : '',
      isDemo: s.isDemo === true,
      status: STATUS.MORE_INFO,
      matchedCriteria: [],
      failedCriteria: [],
      missingInformation: [],
      explanation: ''
    };
    if (!rules || rules.length === 0) {
      result.explanation = NO_RULES;
      return result;
    }

    var missingLabels = [];
    rules.forEach(function (rule) {
      var r = isObject(rule) ? rule : {};
      var label = r.label || r.field || r.id || 'Unnamed criterion';
      var value = fieldValue(profile, r.field);
      var outcome = value === undefined ? 'missing' : testRule(value, r);
      if (outcome === 'pass') {
        result.matchedCriteria.push(label);
      } else if (outcome === 'fail') {
        result.failedCriteria.push(label);
      } else {
        missingLabels.push(label);
        var field = typeof r.field === 'string' ? r.field : label;
        if (result.missingInformation.indexOf(field) === -1) {
          result.missingInformation.push(field);
        }
      }
    });

    if (result.failedCriteria.length > 0) {
      result.status = STATUS.NOT_ELIGIBLE;
    } else if (missingLabels.length > 0) {
      result.status = STATUS.MORE_INFO;
    } else {
      result.status = STATUS.LIKELY;
    }

    var parts = [];
    if (result.isDemo) {
      parts.push('DEMO scheme.');
    }
    parts.push('Matched ' + result.matchedCriteria.length + ' of ' + rules.length + ' criteria.');
    if (result.failedCriteria.length > 0) {
      parts.push('Not met: ' + result.failedCriteria.join('; ') + '.');
    }
    if (missingLabels.length > 0) {
      parts.push('Not enough information to check: ' + missingLabels.join('; ') + '.');
    }
    if (result.status === STATUS.LIKELY) {
      parts.push('Based only on the information in your profile, this scheme looks likely to apply; it does not guarantee approval.');
    } else if (result.status === STATUS.MORE_INFO) {
      parts.push('Add the missing details to check this scheme further; it does not guarantee approval.');
    } else {
      parts.push('Based only on the information in your profile, this scheme does not appear to apply.');
    }
    result.explanation = parts.join(' ');
    return result;
  }

  function evaluateAll(profile, schemes) {
    if (!Array.isArray(schemes)) {
      return [];
    }
    return schemes
      .map(function (scheme) { return evaluateScheme(profile, scheme); })
      .sort(function (a, b) {
        return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      });
  }

  var api = {
    STATUS: STATUS,
    getSavedProfile: getSavedProfile,
    evaluateScheme: evaluateScheme,
    evaluateAll: evaluateAll
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_ELIGIBILITY = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
