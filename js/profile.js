(function () {
  'use strict';

  var STORAGE_KEY = 'thunai.studentProfile';
  var STORAGE_ERROR = 'Your profile cannot be saved on this browser.';
  var YES_NO_LABELS = { yes: 'Yes', no: 'No', notSure: 'Not sure' };
  var YES_NO_KEYS = ['regularCourse', 'otherScholarship', 'droppedAfterXii', 'fullTimeCourse', 'coursePrescribed', 'eligibleCourseListed'];

  var form = document.getElementById('profile-form');
  if (!form) {
    return;
  }

  // Validation, normalising and profile building live in profile-model.js.
  var model = window.THUNAI_PROFILE_MODEL;
  var statusEl = document.getElementById('form-status');
  var summaryEl = document.getElementById('saved-summary');
  var clearButton = document.getElementById('clear-profile');

  // Field order matches the form. Each entry maps a profile key to its control
  // ids, error paragraph id and summary dd id. Radio groups set radioName.
  var FIELDS = [
    { key: 'name', ids: ['name'], errorId: 'name-error', summaryId: 'summary-name' },
    { key: 'age', ids: ['age'], errorId: 'age-error', summaryId: 'summary-age' },
    { key: 'district', ids: ['district'], errorId: 'district-error', summaryId: 'summary-district' },
    { key: 'educationLevel', ids: ['education-level'], errorId: 'education-level-error',
      summaryId: 'summary-education-level' },
    { key: 'course', ids: ['course'], errorId: 'course-error', summaryId: 'summary-course' },
    { key: 'collegeType', ids: ['college-type'], errorId: 'college-type-error',
      summaryId: 'summary-college-type' },
    { key: 'academicYear', ids: ['academic-year'], errorId: 'academic-year-error',
      summaryId: 'summary-academic-year' },
    { key: 'incomeRange', ids: ['income-range'], errorId: 'income-range-error',
      summaryId: 'summary-income-range' },
    { key: 'firstGeneration', radioName: 'first-generation',
      ids: ['first-generation-yes', 'first-generation-no'],
      errorId: 'first-generation-error', summaryId: 'summary-first-generation' },
    { key: 'category', ids: ['category'], errorId: 'category-error', summaryId: 'summary-category' },
    { key: 'tnDomicile', radioName: 'tn-domicile',
      ids: ['tn-domicile-yes', 'tn-domicile-no', 'tn-domicile-not-sure'],
      errorId: 'tn-domicile-error', summaryId: 'summary-tn-domicile' },
    { key: 'institution', ids: ['institution'], errorId: 'institution-error',
      summaryId: 'summary-institution' },
    { key: 'institutionListed', radioName: 'institution-listed',
      ids: ['institution-listed-yes', 'institution-listed-no', 'institution-listed-not-sure'],
      errorId: 'institution-listed-error', summaryId: 'summary-institution-listed' },
    { key: 'annualFamilyIncome', ids: ['annual-family-income'],
      errorId: 'annual-family-income-error', summaryId: 'summary-annual-income' },
    { key: 'classXiiPercentileRank', ids: ['class-xii-percentile-rank'],
      errorId: 'class-xii-percentile-rank-error', summaryId: 'summary-class-xii-percentile-rank' },
    { key: 'regularCourse', radioName: 'regular-course',
      ids: ['regular-course-yes', 'regular-course-no', 'regular-course-not-sure'],
      errorId: 'regular-course-error', summaryId: 'summary-regular-course' },
    { key: 'otherScholarship', radioName: 'other-scholarship',
      ids: ['other-scholarship-yes', 'other-scholarship-no', 'other-scholarship-not-sure'],
      errorId: 'other-scholarship-error', summaryId: 'summary-other-scholarship' },
    { key: 'droppedAfterXii', radioName: 'dropped-after-xii',
      ids: ['dropped-after-xii-yes', 'dropped-after-xii-no', 'dropped-after-xii-not-sure'],
      errorId: 'dropped-after-xii-error', summaryId: 'summary-dropped-after-xii' },
    { key: 'fullTimeCourse', radioName: 'full-time-course',
      ids: ['full-time-course-yes', 'full-time-course-no', 'full-time-course-not-sure'],
      errorId: 'full-time-course-error', summaryId: 'summary-full-time-course' },
    { key: 'coursePrescribed', radioName: 'course-prescribed',
      ids: ['course-prescribed-yes', 'course-prescribed-no', 'course-prescribed-not-sure'],
      errorId: 'course-prescribed-error', summaryId: 'summary-course-prescribed' },
    { key: 'eligibleCourseListed', radioName: 'eligible-course-listed',
      ids: ['eligible-course-listed-yes', 'eligible-course-listed-no', 'eligible-course-listed-not-sure'],
      errorId: 'eligible-course-listed-error', summaryId: 'summary-eligible-course-listed' },
    { key: 'classXiiMarks', ids: ['class-xii-marks'],
      errorId: 'class-xii-marks-error', summaryId: 'summary-class-xii-marks' }
  ];

  function getElement(id) {
    return document.getElementById(id);
  }

  function getControls(spec) {
    return spec.ids.map(getElement).filter(Boolean);
  }

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message || '';
    }
  }

  function readValues() {
    var values = {};
    FIELDS.forEach(function (spec) {
      if (spec.radioName) {
        var checked = form.querySelector('input[name="' + spec.radioName + '"]:checked');
        values[spec.key] = checked ? checked.value : '';
        return;
      }
      var el = getElement(spec.ids[0]);
      values[spec.key] = el ? el.value : '';
      // Browsers report an empty value for typed text that is not a number;
      // flag it so the model rejects it instead of treating it as absent.
      if (el && el.validity && el.validity.badInput) {
        values[spec.key] = 'not a number';
      }
    });
    return values;
  }

  function writeValues(values) {
    FIELDS.forEach(function (spec) {
      var value = values[spec.key] === undefined ? '' : String(values[spec.key]);
      if (spec.radioName) {
        getControls(spec).forEach(function (radio) {
          radio.checked = radio.value === value;
        });
        return;
      }
      var el = getElement(spec.ids[0]);
      if (el) {
        el.value = value;
      }
    });
  }

  function showError(spec, message) {
    var errorEl = getElement(spec.errorId);
    if (errorEl) {
      errorEl.textContent = message;
    }
    getControls(spec).forEach(function (control) {
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', spec.errorId);
    });
  }

  function clearError(spec) {
    var errorEl = getElement(spec.errorId);
    if (errorEl) {
      errorEl.textContent = '';
    }
    getControls(spec).forEach(function (control) {
      control.removeAttribute('aria-invalid');
      control.removeAttribute('aria-describedby');
    });
  }

  function clearAllErrors() {
    FIELDS.forEach(clearError);
  }

  // Text shown in the summary for one profile value.
  function displayText(key, value) {
    if (key === 'firstGeneration') {
      return value === 'yes' ? 'Yes' : 'No';
    }
    if (!value) {
      return model.OPTIONAL_KEYS.indexOf(key) !== -1 ? 'Not provided' : String(value);
    }
    if (key === 'tnDomicile' || key === 'institutionListed' || YES_NO_KEYS.indexOf(key) !== -1) {
      return YES_NO_LABELS[value];
    }
    if (key === 'classXiiMarks') {
      return value + '%';
    }
    if (key === 'annualFamilyIncome') {
      return '\u20B9' + value;
    }
    if (key === 'classXiiPercentileRank') {
      return value + ' (percentile rank)';
    }
    return String(value);
  }

  function showSummary(values) {
    FIELDS.forEach(function (spec) {
      var dd = getElement(spec.summaryId);
      if (dd) {
        dd.textContent = displayText(spec.key, values[spec.key]);
      }
    });
    if (summaryEl) {
      summaryEl.hidden = false;
    }
  }

  function hideSummary() {
    if (summaryEl) {
      summaryEl.hidden = true;
    }
  }

  // Storage helpers: every localStorage call is guarded.
  function storageRead() {
    try {
      return { ok: true, raw: window.localStorage.getItem(STORAGE_KEY) };
    } catch (error) {
      return { ok: false, raw: null };
    }
  }

  function storageWrite(serialized) {
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageRemove() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadSavedProfile() {
    var stored = storageRead();
    if (!stored.ok) {
      setStatus(STORAGE_ERROR);
      return;
    }
    if (stored.raw === null) {
      return;
    }

    var values = null;
    try {
      values = model.normalizeSaved(JSON.parse(stored.raw));
    } catch (error) {
      values = null;
    }

    if (!values || Object.keys(model.validate(values)).length > 0) {
      // Corrupt or incomplete required data: discard it and start with an empty form.
      storageRemove();
      return;
    }

    writeValues(values);
    showSummary(values);
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearAllErrors();
    setStatus('');

    var values = readValues();
    var errors = model.validate(values);
    var firstInvalid = null;

    FIELDS.forEach(function (spec) {
      if (errors[spec.key]) {
        showError(spec, errors[spec.key]);
        if (!firstInvalid) {
          firstInvalid = getControls(spec)[0] || null;
        }
      }
    });

    if (firstInvalid) {
      setStatus('Please correct the highlighted fields.');
      firstInvalid.focus();
      return;
    }

    var profile = model.buildProfile(values, new Date().toISOString());

    if (!storageWrite(JSON.stringify(profile))) {
      setStatus(STORAGE_ERROR);
      return;
    }

    setStatus('Profile saved on this device.');
    showSummary(model.normalizeSaved(profile));
  }

  function handleFieldChange(event) {
    var target = event.target;
    if (!target || !target.id) {
      return;
    }
    FIELDS.forEach(function (spec) {
      if (spec.ids.indexOf(target.id) !== -1) {
        clearError(spec);
      }
    });
  }

  function handleClear() {
    var removed = storageRemove();
    form.reset();
    clearAllErrors();
    hideSummary();
    setStatus(removed ? '' : STORAGE_ERROR);
  }

  form.addEventListener('submit', handleSubmit);
  form.addEventListener('input', handleFieldChange);
  form.addEventListener('change', handleFieldChange);
  if (clearButton) {
    clearButton.addEventListener('click', handleClear);
  }

  loadSavedProfile();
})();
