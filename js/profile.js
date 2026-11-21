(function () {
  'use strict';

  var STORAGE_KEY = 'thunai.studentProfile';
  var STORAGE_ERROR = 'Your profile cannot be saved on this browser.';

  var form = document.getElementById('profile-form');
  if (!form) {
    return;
  }

  var statusEl = document.getElementById('form-status');
  var summaryEl = document.getElementById('saved-summary');
  var clearButton = document.getElementById('clear-profile');

  // Field order matches the form. Each entry maps a profile key to its
  // control ids, error paragraph id, summary dd id and validation message.
  var FIELDS = [
    { key: 'name', ids: ['name'], errorId: 'name-error', summaryId: 'summary-name' },
    { key: 'age', ids: ['age'], errorId: 'age-error', summaryId: 'summary-age',
      message: 'Enter your age between 14 and 60.' },
    { key: 'district', ids: ['district'], errorId: 'district-error', summaryId: 'summary-district',
      message: 'Select your district.' },
    { key: 'educationLevel', ids: ['education-level'], errorId: 'education-level-error',
      summaryId: 'summary-education-level', message: 'Select your education level.' },
    { key: 'course', ids: ['course'], errorId: 'course-error', summaryId: 'summary-course',
      message: 'Enter your course.' },
    { key: 'collegeType', ids: ['college-type'], errorId: 'college-type-error',
      summaryId: 'summary-college-type', message: 'Select your college type.' },
    { key: 'academicYear', ids: ['academic-year'], errorId: 'academic-year-error',
      summaryId: 'summary-academic-year', message: 'Select your academic year.' },
    { key: 'incomeRange', ids: ['income-range'], errorId: 'income-range-error',
      summaryId: 'summary-income-range', message: 'Select your annual family income range.' },
    { key: 'firstGeneration', ids: ['first-generation-yes', 'first-generation-no'],
      errorId: 'first-generation-error', summaryId: 'summary-first-generation',
      message: 'Select whether you are a first-generation graduate.' }
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
      if (spec.key === 'firstGeneration') {
        var checked = form.querySelector('input[name="first-generation"]:checked');
        values.firstGeneration = checked ? checked.value : '';
      } else {
        var el = getElement(spec.ids[0]);
        values[spec.key] = el ? el.value : '';
      }
    });
    return values;
  }

  function writeValues(values) {
    FIELDS.forEach(function (spec) {
      var value = values[spec.key] === undefined ? '' : String(values[spec.key]);
      if (spec.key === 'firstGeneration') {
        getControls(spec).forEach(function (radio) {
          radio.checked = radio.value === value;
        });
      } else {
        var el = getElement(spec.ids[0]);
        if (el) {
          el.value = value;
        }
      }
    });
  }

  // Returns an object keyed by profile key; only invalid fields are present.
  function validate(values) {
    var errors = {};
    var age = String(values.age).trim();
    var ageNumber = Number(age);

    if (!/^\d+$/.test(age) || ageNumber < 14 || ageNumber > 60) {
      errors.age = true;
    }
    if (!values.district) {
      errors.district = true;
    }
    if (!values.educationLevel) {
      errors.educationLevel = true;
    }
    if (!String(values.course).trim()) {
      errors.course = true;
    }
    if (!values.collegeType) {
      errors.collegeType = true;
    }
    if (!values.academicYear) {
      errors.academicYear = true;
    }
    if (!values.incomeRange) {
      errors.incomeRange = true;
    }
    if (values.firstGeneration !== 'yes' && values.firstGeneration !== 'no') {
      errors.firstGeneration = true;
    }
    if (String(values.name).trim().length > 100) {
      errors.name = 'Name must be 100 characters or fewer.';
    }
    return errors;
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

  function showSummary(values) {
    FIELDS.forEach(function (spec) {
      var dd = getElement(spec.summaryId);
      if (!dd) {
        return;
      }
      var value = values[spec.key];
      var text;
      if (spec.key === 'name') {
        text = value ? value : 'Not provided';
      } else if (spec.key === 'firstGeneration') {
        text = value === 'yes' ? 'Yes' : 'No';
      } else {
        text = String(value);
      }
      dd.textContent = text;
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

  // Converts a parsed stored object into the same string-based shape as the form.
  function normalizeSaved(data) {
    if (!data || typeof data !== 'object') {
      return null;
    }
    function text(value) {
      return typeof value === 'string' ? value : '';
    }
    return {
      name: text(data.name),
      age: typeof data.age === 'number' || typeof data.age === 'string' ? String(data.age) : '',
      district: text(data.district),
      educationLevel: text(data.educationLevel),
      course: text(data.course),
      collegeType: text(data.collegeType),
      academicYear: text(data.academicYear),
      incomeRange: text(data.incomeRange),
      firstGeneration: text(data.firstGeneration)
    };
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
      values = normalizeSaved(JSON.parse(stored.raw));
    } catch (error) {
      values = null;
    }

    if (!values || Object.keys(validate(values)).length > 0) {
      // Corrupt or incomplete data: discard it and start with an empty form.
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
    values.name = values.name.trim();
    values.course = values.course.trim();

    var errors = validate(values);
    var firstInvalid = null;

    FIELDS.forEach(function (spec) {
      var message = errors[spec.key];
      if (message) {
        showError(spec, message === true ? spec.message : message);
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

    var profile = {
      name: values.name,
      age: parseInt(values.age, 10),
      district: values.district,
      educationLevel: values.educationLevel,
      course: values.course,
      collegeType: values.collegeType,
      academicYear: values.academicYear,
      incomeRange: values.incomeRange,
      firstGeneration: values.firstGeneration,
      savedAt: new Date().toISOString()
    };

    if (!storageWrite(JSON.stringify(profile))) {
      setStatus(STORAGE_ERROR);
      return;
    }

    values.age = String(profile.age);
    setStatus('Profile saved on this device.');
    showSummary(values);
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
