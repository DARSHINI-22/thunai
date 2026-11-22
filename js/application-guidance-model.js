// THUNAI application guidance model: pure logic for the per-scheme application guidance view.
// No DOM access. Reads only scheme.applicationGuidance. Plain ES2015.
(function () {
  'use strict';

  var NOT_CONFIRMED_TEXT = 'Application guidance not yet confirmed.';
  var NOT_VERIFIED_TEXT = 'Not verified against an official source.';
  var VERIFIED_TEXT = 'Verified against an official source.';
  var AVAILABILITY_UNKNOWN_TEXT = 'Current application availability: not confirmed.';
  var AVAILABILITY_NOTE = 'Verification shows how the application process was checked. It does not show whether applications are open now.';
  var METHOD_LABELS = {
    online: 'Online',
    institution: 'Through your college or institution',
    other: 'Other'
  };

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function trimmedText(value) {
    if (typeof value !== 'string') {
      return null;
    }
    var trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  function textList(value) {
    if (!Array.isArray(value)) {
      return null;
    }
    var out = [];
    value.forEach(function (item) {
      var text = trimmedText(item);
      if (text) {
        out.push(text);
      }
    });
    return out.length ? out : null;
  }

  // Accepts only http(s) URLs that the URL parser accepts. Never throws.
  function isSafeUrl(value) {
    if (typeof value !== 'string') {
      return false;
    }
    var trimmed = value.trim();
    if (!/^https?:\/\/\S+$/i.test(trimmed)) {
      return false;
    }
    try {
      var parsed = new URL(trimmed);
      return typeof parsed.href === 'string';
    } catch (error) {
      return false;
    }
  }

  function safeUrlOrNull(value) {
    return isSafeUrl(value) ? value.trim() : null;
  }

  function availabilityLabelFor(guidance) {
    var checkedOn = trimmedText(guidance.availabilityCheckedOn);
    if (checkedOn && guidance.availabilityStatus === 'open') {
      return 'Open for applications, confirmed on ' + checkedOn;
    }
    if (checkedOn && guidance.availabilityStatus === 'closed') {
      return 'Closed for applications, confirmed on ' + checkedOn;
    }
    return AVAILABILITY_UNKNOWN_TEXT;
  }

  // Builds the display view for one scheme. A scheme without applicationGuidance gets an empty view.
  function buildGuidanceView(scheme) {
    var hasGuidance = isObject(scheme) && isObject(scheme.applicationGuidance);
    var guidance = hasGuidance ? scheme.applicationGuidance : {};
    var verified = hasGuidance && guidance.verified === true && isSafeUrl(guidance.sourceUrl);
    var hasMethod = Object.prototype.hasOwnProperty.call(METHOD_LABELS, guidance.method);

    return {
      hasGuidance: hasGuidance,
      verified: verified,
      sourceUrl: safeUrlOrNull(guidance.sourceUrl),
      where: trimmedText(guidance.where),
      method: hasMethod ? METHOD_LABELS[guidance.method] : null,
      steps: textList(guidance.steps),
      portalUrl: safeUrlOrNull(guidance.portalUrl),
      notes: textList(guidance.notes),
      availabilityLabel: availabilityLabelFor(guidance),
      verifiedLabel: verified ? VERIFIED_TEXT : NOT_VERIFIED_TEXT
    };
  }

  var api = {
    NOT_CONFIRMED_TEXT: NOT_CONFIRMED_TEXT,
    NOT_VERIFIED_TEXT: NOT_VERIFIED_TEXT,
    VERIFIED_TEXT: VERIFIED_TEXT,
    AVAILABILITY_UNKNOWN_TEXT: AVAILABILITY_UNKNOWN_TEXT,
    AVAILABILITY_NOTE: AVAILABILITY_NOTE,
    METHOD_LABELS: METHOD_LABELS,
    isSafeUrl: isSafeUrl,
    buildGuidanceView: buildGuidanceView
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_APPLICATION_GUIDANCE_MODEL = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
