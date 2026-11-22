// THUNAI student profile model. Pure functions only: no DOM, no storage.
(function () {
  'use strict';

  var YES_NO_NOT_SURE = ['yes', 'no', 'notSure'];
  var CATEGORY_OPTIONS = ['BC', 'MBC', 'DNC', 'OBC', 'EBC', 'DNT', 'ST', 'Other'];
  var INSTITUTION_OPTIONS = ['IIT', 'IIM', 'IIIT', 'NIT', 'Central University', 'Other'];
  var REQUIRED_CHOICES = ['district', 'educationLevel', 'collegeType', 'academicYear', 'incomeRange'];
  var YES_NO_KEYS = ['regularCourse', 'otherScholarship', 'droppedAfterXii', 'fullTimeCourse', 'coursePrescribed', 'eligibleCourseListed'];
  var OPTIONAL_KEYS = ['name', 'category', 'tnDomicile', 'institution', 'institutionListed', 'annualFamilyIncome', 'classXiiPercentileRank'].concat(YES_NO_KEYS, ['classXiiMarks']);
  var MAX_INCOME = Number.MAX_SAFE_INTEGER;

  var MESSAGES = {
    name: 'Name must be 100 characters or fewer.',
    age: 'Enter your age between 14 and 60.',
    district: 'Select your district.',
    educationLevel: 'Select your education level.',
    course: 'Enter your course.',
    collegeType: 'Select your college type.',
    academicYear: 'Select your academic year.',
    incomeRange: 'Select your annual family income range.',
    firstGeneration: 'Select whether you are a first-generation graduate.',
    annualFamilyIncome: 'Enter your annual family income as a whole number of rupees (0 or more), or leave it empty.',
    classXiiPercentileRank: 'Enter a percentile rank between 0 and 100.',
    classXiiMarks: 'Enter your Class XII marks as a percentage between 0 and 100.'
  };

  function toText(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  // Returns the value when it is one of the allowed options, otherwise ''.
  function pickOption(value, options) {
    return typeof value === 'string' && options.indexOf(value) !== -1 ? value : '';
  }

  // Parses a typed income. Returns a safe integer, or null when invalid or empty.
  function parseIncome(text) {
    var trimmed = toText(text).trim();
    if (!/^\d+$/.test(trimmed)) {
      return null;
    }
    var amount = Number(trimmed);
    return amount <= MAX_INCOME ? amount : null;
  }

  // Stored income must be a JS number; anything else is treated as absent.
  function storedIncome(value) {
    var valid = typeof value === 'number' && value % 1 === 0 && value >= 0 && value <= MAX_INCOME;
    return valid ? String(value) : '';
  }

  // Parses a typed percentile rank (0 to 100, up to 2 decimal places). Returns a number, or null when invalid or empty.
  function parsePercentileRank(text) {
    var trimmed = toText(text).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      return null;
    }
    var rank = Number(trimmed);
    return rank <= 100 ? rank : null;
  }

  // Stored percentile rank must be a JS number in range with at most 2 decimal places; anything else is treated as absent.
  function storedPercentileRank(value) {
    var valid = typeof value === 'number' && value >= 0 && value <= 100 && Math.round(value * 100) / 100 === value;
    return valid ? String(value) : '';
  }

  // Returns an object keyed by profile key; only invalid fields are present.
  function validate(values) {
    var errors = {};
    var age = toText(values.age).trim();
    var ageNumber = Number(age);

    if (!/^\d+$/.test(age) || ageNumber < 14 || ageNumber > 60) {
      errors.age = MESSAGES.age;
    }
    REQUIRED_CHOICES.forEach(function (key) {
      if (!values[key]) {
        errors[key] = MESSAGES[key];
      }
    });
    if (!toText(values.course).trim()) {
      errors.course = MESSAGES.course;
    }
    if (values.firstGeneration !== 'yes' && values.firstGeneration !== 'no') {
      errors.firstGeneration = MESSAGES.firstGeneration;
    }
    if (toText(values.name).trim().length > 100) {
      errors.name = MESSAGES.name;
    }
    var income = toText(values.annualFamilyIncome).trim();
    if (income !== '' && parseIncome(income) === null) {
      errors.annualFamilyIncome = MESSAGES.annualFamilyIncome;
    }
    var rank = toText(values.classXiiPercentileRank).trim();
    if (rank !== '' && parsePercentileRank(rank) === null) {
      errors.classXiiPercentileRank = MESSAGES.classXiiPercentileRank;
    }
    var marks = toText(values.classXiiMarks).trim();
    if (marks !== '' && parsePercentileRank(marks) === null) {
      errors.classXiiMarks = MESSAGES.classXiiMarks;
    }
    return errors;
  }

  // Converts a parsed stored object into the same string-based shape as the form.
  // Invalid optional values are dropped to ''; returns null when data is not an object.
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
      firstGeneration: text(data.firstGeneration),
      category: pickOption(data.category, CATEGORY_OPTIONS),
      tnDomicile: pickOption(data.tnDomicile, YES_NO_NOT_SURE),
      institution: pickOption(data.institution, INSTITUTION_OPTIONS),
      institutionListed: pickOption(data.institutionListed, YES_NO_NOT_SURE),
      annualFamilyIncome: storedIncome(data.annualFamilyIncome),
      classXiiPercentileRank: storedPercentileRank(data.classXiiPercentileRank),
      regularCourse: pickOption(data.regularCourse, YES_NO_NOT_SURE),
      otherScholarship: pickOption(data.otherScholarship, YES_NO_NOT_SURE),
      droppedAfterXii: pickOption(data.droppedAfterXii, YES_NO_NOT_SURE),
      fullTimeCourse: pickOption(data.fullTimeCourse, YES_NO_NOT_SURE),
      coursePrescribed: pickOption(data.coursePrescribed, YES_NO_NOT_SURE),
      eligibleCourseListed: pickOption(data.eligibleCourseListed, YES_NO_NOT_SURE),
      classXiiMarks: storedPercentileRank(data.classXiiMarks)
    };
  }

  // Builds the object written to storage. Optional keys are only present when set.
  // Assumes values have already passed validate().
  function buildProfile(values, savedAt) {
    var profile = {
      name: toText(values.name).trim(),
      age: parseInt(values.age, 10),
      district: values.district,
      educationLevel: values.educationLevel,
      course: toText(values.course).trim(),
      collegeType: values.collegeType,
      academicYear: values.academicYear,
      incomeRange: values.incomeRange,
      firstGeneration: values.firstGeneration,
      savedAt: savedAt
    };
    var optional = {
      category: pickOption(values.category, CATEGORY_OPTIONS),
      tnDomicile: pickOption(values.tnDomicile, YES_NO_NOT_SURE),
      institution: pickOption(values.institution, INSTITUTION_OPTIONS),
      institutionListed: pickOption(values.institutionListed, YES_NO_NOT_SURE),
      regularCourse: pickOption(values.regularCourse, YES_NO_NOT_SURE),
      otherScholarship: pickOption(values.otherScholarship, YES_NO_NOT_SURE),
      droppedAfterXii: pickOption(values.droppedAfterXii, YES_NO_NOT_SURE),
      fullTimeCourse: pickOption(values.fullTimeCourse, YES_NO_NOT_SURE),
      coursePrescribed: pickOption(values.coursePrescribed, YES_NO_NOT_SURE),
      eligibleCourseListed: pickOption(values.eligibleCourseListed, YES_NO_NOT_SURE)
    };
    Object.keys(optional).forEach(function (key) {
      if (optional[key]) {
        profile[key] = optional[key];
      }
    });
    var income = parseIncome(values.annualFamilyIncome);
    if (income !== null) {
      profile.annualFamilyIncome = income;
    }
    var rank = parsePercentileRank(values.classXiiPercentileRank);
    if (rank !== null) {
      profile.classXiiPercentileRank = rank;
    }
    var marks = parsePercentileRank(values.classXiiMarks);
    if (marks !== null) {
      profile.classXiiMarks = marks;
    }
    return profile;
  }

  var api = {
    OPTIONAL_KEYS: OPTIONAL_KEYS,
    validate: validate,
    normalizeSaved: normalizeSaved,
    buildProfile: buildProfile,
    parseIncome: parseIncome
  };

  if (typeof window !== 'undefined') {
    window.THUNAI_PROFILE_MODEL = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
