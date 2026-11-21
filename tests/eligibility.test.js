// Run with: node tests/eligibility.test.js
'use strict';
const assert = require('assert');
const schemes = require('../js/schemes.js');
const { evaluateScheme, evaluateAll, getSavedProfile, STATUS } = require('../js/eligibility.js');

const A = schemes.find((s) => s.id === 'demo-scheme-a');
const fullProfile = {
  name: 'Test Student', age: 20, district: 'Chennai', educationLevel: 'Undergraduate',
  course: 'B.Sc Physics', collegeType: 'Government', academicYear: '2nd Year',
  incomeRange: '₹1–2.5 lakh', firstGeneration: 'no', savedAt: '2024-01-01T00:00:00.000Z'
};
const labelOf = (ruleId) => {
  for (const scheme of schemes) {
    const rule = scheme.rules.find((r) => r.id === ruleId);
    if (rule) { return rule.label; }
  }
  throw new Error('rule not found: ' + ruleId);
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

test('(a) full matching profile is Likely Eligible for demo-scheme-a', () => {
  assert.strictEqual(schemes.length, 3);
  const r = evaluateScheme(fullProfile, A);
  assert.strictEqual(r.status, STATUS.LIKELY);
  assert.strictEqual(r.failedCriteria.length, 0);
  assert.strictEqual(r.matchedCriteria.length, A.rules.length);
});

test('(b) missing incomeRange and collegeType gives More Information Required', () => {
  const partial = Object.assign({}, fullProfile);
  delete partial.incomeRange;
  delete partial.collegeType;
  const r = evaluateScheme(partial, A);
  assert.strictEqual(r.status, STATUS.MORE_INFO);
  assert.ok(r.missingInformation.includes('incomeRange'));
  assert.ok(r.missingInformation.includes('collegeType'));
});

test('(c) Private college gives Not Eligible with criterion in failedCriteria', () => {
  const priv = Object.assign({}, fullProfile, { collegeType: 'Private' });
  const r = evaluateScheme(priv, A);
  assert.strictEqual(r.status, STATUS.NOT_ELIGIBLE);
  assert.ok(r.failedCriteria.includes(labelOf('a-college')));
});

test('(d) null, empty and corrupt storage never throw and stay More Information Required', () => {
  for (const p of [null, {}]) {
    assert.strictEqual(evaluateScheme(p, A).status, STATUS.MORE_INFO);
    evaluateAll(p, schemes).forEach((r) => assert.strictEqual(r.status, STATUS.MORE_INFO));
  }
  assert.strictEqual(getSavedProfile({ getItem: () => '{bad json' }), null);
  assert.strictEqual(getSavedProfile({ getItem() { throw new Error('denied'); } }), null);
  assert.strictEqual(getSavedProfile(null), null);
});

test('(e) explanations never contain % and "guarantee" only inside "does not guarantee"', () => {
  const partial = Object.assign({}, fullProfile);
  delete partial.incomeRange;
  const profiles = [fullProfile, partial, Object.assign({}, fullProfile, { collegeType: 'Private' }), null, {}];
  for (const p of profiles) {
    for (const r of evaluateAll(p, schemes)) {
      assert.ok(!r.explanation.includes('%'), 'percent sign in: ' + r.explanation);
      assert.ok(!r.explanation.replace(/does not guarantee/g, '').includes('guarantee'), r.explanation);
    }
  }
});

test('(f) invalid scheme records do not crash and are More Information Required', () => {
  const r = evaluateAll(fullProfile, [null, { id: 'x' }, { id: 'y', rules: 'bad' }]);
  assert.strictEqual(r.length, 3);
  r.forEach((item) => {
    assert.strictEqual(item.status, STATUS.MORE_INFO);
    assert.strictEqual(item.explanation, 'No eligibility rules are defined for this scheme.');
  });
});

if (failures === 0) {
  console.log('All eligibility tests passed.');
}
