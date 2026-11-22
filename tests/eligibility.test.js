// Run with: node tests/eligibility.test.js
'use strict';
const assert = require('assert');
const schemes = require('../js/schemes.js');
const { evaluateScheme, evaluateAll, getSavedProfile, STATUS } = require('../js/eligibility.js');

const REAL_IDS = [
  'tn-bc-mbc-dnc-post-matric',
  'tn-bc-mbc-dnc-central-institutions',
  'pm-usp-central-sector',
  'pm-yasasvi-top-class-college',
  'national-top-class-st'
];

const byId = (id) => schemes.find((s) => s.id === id);

const sampleProfile = {
  name: 'Test', age: 20, district: 'Chennai', educationLevel: 'Undergraduate',
  course: 'B.Sc Physics', collegeType: 'Government', academicYear: '2nd Year',
  incomeRange: 'Below ₹1 lakh', firstGeneration: 'no', savedAt: '2024-01-01T00:00:00.000Z'
};

// Inline fixture scheme used only by test (6). It is not part of the dataset.
const fixture = {
  id: 'test-fixture',
  name: 'Test Fixture',
  isDemo: false,
  rules: [
    { id: 'fx-age', field: 'age', operator: 'minNumber', value: 14, required: true, label: 'Age at least 14' },
    { id: 'fx-income', field: 'incomeRange', operator: 'in', value: ['Below ₹1 lakh'], required: true, label: 'Income below ₹1 lakh' }
  ]
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

test('(1) dataset has exactly five real records with source fields', () => {
  assert.strictEqual(schemes.length, 5);
  assert.deepStrictEqual(schemes.map((s) => s.id).sort(), REAL_IDS.slice().sort());
  schemes.forEach((s) => {
    assert.strictEqual(s.isDemo, false, s.id + ' isDemo');
    assert.strictEqual(typeof s.officialUrl, 'string', s.id + ' officialUrl');
    assert.strictEqual(s.lastVerified, '2026-11-21', s.id + ' lastVerified');
    assert.strictEqual(s.verificationStatus, 'source-checked', s.id + ' verificationStatus');
    assert.strictEqual(s.applicationStatus, 'unknown', s.id + ' applicationStatus');
    assert.strictEqual(s.deadline, null, s.id + ' deadline');
    assert.strictEqual(s.requiredDocuments, null, s.id + ' requiredDocuments');
  });
});

test('(2) sample profile: no real scheme is Likely Eligible; each is More Information Required', () => {
  const results = evaluateAll(sampleProfile, schemes);
  results.forEach((r) => {
    assert.notStrictEqual(r.status, STATUS.LIKELY, r.schemeId + ' is Likely Eligible');
    assert.strictEqual(r.status, STATUS.MORE_INFO, r.schemeId + ' status');
  });
  ['tn-bc-mbc-dnc-post-matric', 'national-top-class-st'].forEach((id) => {
    const r = evaluateScheme(sampleProfile, byId(id));
    assert.ok(r.missingInformation.includes('category'), id + ' missing category');
  });
});

test('(3) educationLevel Diploma: pm-usp-central-sector is Not Eligible with a diploma criterion', () => {
  const profile = Object.assign({}, sampleProfile, { educationLevel: 'Diploma' });
  const r = evaluateScheme(profile, byId('pm-usp-central-sector'));
  assert.strictEqual(r.status, STATUS.NOT_ELIGIBLE);
  assert.ok(r.failedCriteria.some((c) => /diploma/i.test(c)), 'no diploma criterion in failedCriteria');
});

test('(4) incomeRange above the limit: tn-bc-mbc-dnc-post-matric is Not Eligible on income', () => {
  const profile = Object.assign({}, sampleProfile, { incomeRange: '₹5–8 lakh' });
  const r = evaluateScheme(profile, byId('tn-bc-mbc-dnc-post-matric'));
  assert.strictEqual(r.status, STATUS.NOT_ELIGIBLE);
  assert.ok(r.failedCriteria.includes('Annual parental income does not exceed ₹2,50,000'));
});

test('(5) null, empty and corrupt storage never throw and stay More Information Required', () => {
  for (const p of [null, {}]) {
    assert.strictEqual(evaluateScheme(p, schemes[0]).status, STATUS.MORE_INFO);
    evaluateAll(p, schemes).forEach((r) => assert.strictEqual(r.status, STATUS.MORE_INFO));
  }
  assert.strictEqual(getSavedProfile({ getItem: () => '{bad' }), null);
  assert.strictEqual(getSavedProfile(null), null);
});

test('(6) inline fixture: Likely, More Information Required and Not Eligible outcomes', () => {
  const matching = Object.assign({}, sampleProfile, { age: 20, incomeRange: 'Below ₹1 lakh' });
  assert.strictEqual(evaluateScheme(matching, fixture).status, STATUS.LIKELY);

  const noIncome = Object.assign({}, matching);
  delete noIncome.incomeRange;
  assert.strictEqual(evaluateScheme(noIncome, fixture).status, STATUS.MORE_INFO);

  const high = Object.assign({}, matching, { incomeRange: 'Above ₹8 lakh' });
  assert.strictEqual(evaluateScheme(high, fixture).status, STATUS.NOT_ELIGIBLE);
});

test('(7) explanations have no percent sign; guarantee only inside does not guarantee', () => {
  const partial = Object.assign({}, sampleProfile);
  delete partial.incomeRange;
  const profiles = [sampleProfile, partial, Object.assign({}, sampleProfile, { collegeType: 'Private' }), null, {}];
  for (const p of profiles) {
    for (const r of evaluateAll(p, schemes)) {
      assert.ok(!r.explanation.includes('%'), 'percent sign in: ' + r.explanation);
      assert.ok(!r.explanation.replace(/does not guarantee/g, '').includes('guarantee'), r.explanation);
    }
  }
});

if (failures === 0) {
  console.log('All eligibility tests passed.');
}
