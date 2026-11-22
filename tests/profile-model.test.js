// Run with: node tests/profile-model.test.js
'use strict';
const assert = require('assert');
const model = require('../js/profile-model.js');
const schemes = require('../js/schemes.js');

const byId = (id) => schemes.find((s) => s.id === id);

const CATEGORIES = ['BC', 'MBC', 'DNC', 'OBC', 'EBC', 'DNT', 'ST', 'Other'];
const INSTITUTIONS = ['IIT', 'IIM', 'IIIT', 'NIT', 'Central University', 'Other'];
const YES_NO_NOT_SURE = ['yes', 'no', 'notSure'];
const SAVED_AT = '2024-01-01T00:00:00.000Z';

const validValues = {
  name: 'Test', age: '20', district: 'Chennai', educationLevel: 'Undergraduate',
  course: 'B.Sc Physics', collegeType: 'Government', academicYear: '2nd Year',
  incomeRange: 'Below ₹1 lakh', firstGeneration: 'no'
};

const oldSaved = {
  name: 'Test', age: 20, district: 'Chennai', educationLevel: 'Undergraduate',
  course: 'B.Sc Physics', collegeType: 'Government', academicYear: '2nd Year',
  incomeRange: 'Below ₹1 lakh', firstGeneration: 'no', savedAt: SAVED_AT
};

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log('PASS ' + name);
  } catch (err) {
    failures++;
    console.log('FAIL ' + name + ': ' + err.message);
    process.exitCode = 1;
  }
}

test('(1) valid numeric income is stored as a JS number', () => {
  const fromString = model.buildProfile({ ...validValues, annualFamilyIncome: '450000' }, SAVED_AT);
  assert.strictEqual(typeof fromString.annualFamilyIncome, 'number');
  assert.strictEqual(fromString.annualFamilyIncome, 450000);
  const fromNumber = model.buildProfile({ ...validValues, annualFamilyIncome: 450000 }, SAVED_AT);
  assert.strictEqual(typeof fromNumber.annualFamilyIncome, 'number');
  assert.strictEqual(fromNumber.annualFamilyIncome, 450000);
  assert.deepStrictEqual(model.validate({ ...validValues, annualFamilyIncome: 450000 }), {});
});

test('(2) empty annual income is absent from the saved profile', () => {
  const profile = model.buildProfile({ ...validValues, annualFamilyIncome: '' }, SAVED_AT);
  assert.strictEqual(profile.annualFamilyIncome, undefined);
  assert.ok(!('annualFamilyIncome' in profile));
  assert.strictEqual(model.validate({ ...validValues, annualFamilyIncome: '' }).annualFamilyIncome, undefined);
});

test('(3) negative and non-numeric annual income are rejected with a validation error', () => {
  const negative = model.validate({ ...validValues, annualFamilyIncome: '-5' });
  assert.ok(negative.annualFamilyIncome, 'negative income should produce an error');
  const text = model.validate({ ...validValues, annualFamilyIncome: 'abc' });
  assert.ok(text.annualFamilyIncome, 'non-numeric income should produce an error');
  const profile = model.buildProfile({ ...validValues, annualFamilyIncome: '-5' }, SAVED_AT);
  assert.ok(!('annualFamilyIncome' in profile), 'rejected income must not be stored');
});

test('(4) old-shape saved profile survives normalise and is not discarded', () => {
  const normalised = model.normalizeSaved(oldSaved);
  assert.notStrictEqual(normalised, null);
  assert.strictEqual(normalised.district, 'Chennai');
  assert.strictEqual(normalised.age, '20');
  assert.strictEqual(normalised.annualFamilyIncome, '');
  assert.deepStrictEqual(model.validate(normalised), {});
});

test('(5) saved annualFamilyIncome "abc" drops the value but keeps the profile', () => {
  const normalised = model.normalizeSaved({ ...oldSaved, annualFamilyIncome: 'abc' });
  assert.notStrictEqual(normalised, null, 'profile must not be discarded');
  assert.strictEqual(normalised.annualFamilyIncome, '');
  assert.strictEqual(normalised.educationLevel, 'Undergraduate');
  assert.deepStrictEqual(model.validate(normalised), {});
});

test('(6) every category value is accepted and kept', () => {
  CATEGORIES.forEach((c) => {
    const profile = model.buildProfile({ ...validValues, category: c }, SAVED_AT);
    assert.strictEqual(profile.category, c);
    assert.strictEqual(model.normalizeSaved({ ...oldSaved, category: c }).category, c);
    assert.deepStrictEqual(model.validate({ ...validValues, category: c }), {});
  });
});

test('(7) every institution value is accepted and kept', () => {
  INSTITUTIONS.forEach((i) => {
    const profile = model.buildProfile({ ...validValues, institution: i }, SAVED_AT);
    assert.strictEqual(profile.institution, i);
    assert.strictEqual(model.normalizeSaved({ ...oldSaved, institution: i }).institution, i);
    assert.deepStrictEqual(model.validate({ ...validValues, institution: i }), {});
  });
});

test('(8) tnDomicile and institutionListed accept yes, no and notSure', () => {
  YES_NO_NOT_SURE.forEach((v) => {
    const profile = model.buildProfile({ ...validValues, tnDomicile: v, institutionListed: v }, SAVED_AT);
    assert.strictEqual(profile.tnDomicile, v);
    assert.strictEqual(profile.institutionListed, v);
    const normalised = model.normalizeSaved({ ...oldSaved, tnDomicile: v, institutionListed: v });
    assert.strictEqual(normalised.tnDomicile, v);
    assert.strictEqual(normalised.institutionListed, v);
    assert.deepStrictEqual(model.validate({ ...validValues, tnDomicile: v, institutionListed: v }), {});
  });
});

test('(9) institution values match the tnc-institution rule in tn-bc-mbc-dnc-central-institutions', () => {
  const scheme = byId('tn-bc-mbc-dnc-central-institutions');
  assert.ok(scheme, 'scheme must exist');
  const rule = scheme.rules.find((r) => r.id === 'tnc-institution');
  assert.ok(rule, 'tnc-institution rule must exist');
  ['IIT', 'IIM', 'IIIT', 'NIT', 'Central University'].forEach((v) => {
    assert.ok(rule.value.includes(v), 'rule value missing ' + v);
  });
});

test('(10) category values BC, MBC, DNC, OBC, EBC, DNT and ST appear in scheme category rules', () => {
  const seen = [];
  schemes.forEach((s) => {
    (s.rules || []).filter((r) => r.field === 'category').forEach((r) => {
      seen.push(...(Array.isArray(r.value) ? r.value : [r.value]));
    });
  });
  ['BC', 'MBC', 'DNC', 'OBC', 'EBC', 'DNT', 'ST'].forEach((c) => {
    assert.ok(seen.includes(c), 'no scheme rule uses category ' + c);
  });
});

test('(11) institutionListed "yes" is the value used by pm-yasasvi-top-class-college and national-top-class-st', () => {
  ['pm-yasasvi-top-class-college', 'national-top-class-st'].forEach((id) => {
    const scheme = byId(id);
    assert.ok(scheme, id + ' must exist');
    const rules = scheme.rules.filter((r) => r.field === 'institutionListed');
    assert.ok(rules.length > 0, id + ' has no institutionListed rule');
    rules.forEach((r) => assert.strictEqual(r.value, 'yes'));
  });
});

test('(12) classXiiPercentileRank accepts 0, 100 and 80.5 and stores them as JS numbers', () => {
  [0, 100, 80.5].forEach((v) => {
    const fromString = model.buildProfile({ ...validValues, classXiiPercentileRank: String(v) }, SAVED_AT);
    assert.strictEqual(typeof fromString.classXiiPercentileRank, 'number');
    assert.strictEqual(fromString.classXiiPercentileRank, v);
    const fromNumber = model.buildProfile({ ...validValues, classXiiPercentileRank: v }, SAVED_AT);
    assert.strictEqual(typeof fromNumber.classXiiPercentileRank, 'number');
    assert.strictEqual(fromNumber.classXiiPercentileRank, v);
    assert.deepStrictEqual(model.validate({ ...validValues, classXiiPercentileRank: v }), {});
  });
});

test('(13) classXiiPercentileRank 101, -1 and "abc" are rejected with the exact message', () => {
  const MESSAGE = 'Enter a percentile rank between 0 and 100.';
  [101, -1, 'abc'].forEach((v) => {
    const errors = model.validate({ ...validValues, classXiiPercentileRank: v });
    assert.strictEqual(errors.classXiiPercentileRank, MESSAGE, 'value ' + v + ' must be rejected with the message');
    const profile = model.buildProfile({ ...validValues, classXiiPercentileRank: v }, SAVED_AT);
    assert.ok(!('classXiiPercentileRank' in profile), 'rejected value ' + v + ' must not be stored');
  });
});

test('(14) empty classXiiPercentileRank is absent from the saved profile', () => {
  const profile = model.buildProfile({ ...validValues, classXiiPercentileRank: '' }, SAVED_AT);
  assert.strictEqual(profile.classXiiPercentileRank, undefined);
  assert.ok(!('classXiiPercentileRank' in profile));
  assert.strictEqual(model.validate({ ...validValues, classXiiPercentileRank: '' }).classXiiPercentileRank, undefined);
});

test('(15) old-shape saved profile without percentile keys loads and is not discarded', () => {
  const normalised = model.normalizeSaved(oldSaved);
  assert.notStrictEqual(normalised, null, 'old-shape profile must not be discarded');
  assert.strictEqual(normalised.name, 'Test');
  assert.strictEqual(normalised.educationLevel, 'Undergraduate');
  assert.strictEqual(model.validate(normalised).classXiiPercentileRank, undefined);
  assert.deepStrictEqual(model.validate(normalised), {});
});

test('(16) saved classXiiPercentileRank "abc" drops only that key and keeps the profile', () => {
  const normalised = model.normalizeSaved({ ...oldSaved, classXiiPercentileRank: 'abc' });
  assert.notStrictEqual(normalised, null, 'profile must not be discarded');
  assert.notStrictEqual(normalised.classXiiPercentileRank, 'abc', 'invalid stored value must be dropped');
  assert.strictEqual(normalised.name, 'Test');
  assert.strictEqual(normalised.district, 'Chennai');
  assert.strictEqual(normalised.educationLevel, 'Undergraduate');
  assert.strictEqual(model.validate(normalised).classXiiPercentileRank, undefined);
});

test('(17) a marks-style value 92 is accepted as a percentile rank and stored under classXiiPercentileRank only', () => {
  const errors = model.validate({ ...validValues, classXiiPercentileRank: '92' });
  assert.deepStrictEqual(errors, {}, 'range check only: 92 is a valid rank');
  const profile = model.buildProfile({ ...validValues, classXiiPercentileRank: '92' }, SAVED_AT);
  assert.strictEqual(profile.classXiiPercentileRank, 92);
  assert.strictEqual(typeof profile.classXiiPercentileRank, 'number');
  const markKeys = Object.keys(profile).filter((k) => /mark|percent/i.test(k) && k !== 'classXiiPercentileRank');
  assert.deepStrictEqual(markKeys, [], 'no separate marks key may be stored');
});

test('(18) normalizeSaved keeps notSure for regularCourse and classXiiMarks 75 as the string "75"', () => {
  const normalised = model.normalizeSaved({ ...oldSaved, regularCourse: 'notSure', classXiiMarks: 75 });
  assert.strictEqual(normalised.regularCourse, 'notSure');
  assert.strictEqual(normalised.classXiiMarks, '75');
});

test('(19) validate reports classXiiMarks 101', () => {
  const errors = model.validate({ ...validValues, classXiiMarks: '101' });
  assert.ok(errors.classXiiMarks, 'classXiiMarks 101 should produce an error');
});

test('(20) validate reports no errors for the new fields when all are blank', () => {
  const blank = {
    regularCourse: '', otherScholarship: '', droppedAfterXii: '', fullTimeCourse: '',
    coursePrescribed: '', eligibleCourseListed: '', classXiiMarks: ''
  };
  const errors = model.validate({ ...validValues, ...blank });
  ['regularCourse', 'otherScholarship', 'droppedAfterXii', 'fullTimeCourse', 'coursePrescribed', 'eligibleCourseListed', 'classXiiMarks']
    .forEach((key) => assert.strictEqual(errors[key], undefined, key + ' should not be an error'));
});

test('(21) buildProfile stores new yes/no fields and classXiiMarks; blank values are omitted', () => {
  const keys = ['regularCourse', 'otherScholarship', 'droppedAfterXii', 'fullTimeCourse', 'coursePrescribed', 'eligibleCourseListed'];
  const filled = {};
  keys.forEach((k) => { filled[k] = 'notSure'; });
  const profile = model.buildProfile({ ...validValues, ...filled, classXiiMarks: '75' }, SAVED_AT);
  keys.forEach((k) => assert.strictEqual(profile[k], 'notSure', k));
  assert.strictEqual(profile.classXiiMarks, 75);

  const blank = {};
  keys.forEach((k) => { blank[k] = ''; });
  const empty = model.buildProfile({ ...validValues, ...blank, classXiiMarks: '' }, SAVED_AT);
  keys.forEach((k) => assert.ok(!(k in empty), k + ' must be omitted when blank'));
  assert.ok(!('classXiiMarks' in empty), 'classXiiMarks must be omitted when blank');
});


if (failures === 0) {
  console.log('All profile-model tests passed.');
}
