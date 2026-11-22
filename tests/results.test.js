// Plain Node tests for the profile-to-results flow. Run with: node tests/results.test.js
'use strict';

const assert = require('assert');
const schemes = require('../js/schemes.js');
const engine = require('../js/eligibility.js');
const results = require('../js/results.js');

const STATUS = engine.STATUS;

const REAL_IDS = [
  'tn-bc-mbc-dnc-post-matric',
  'tn-bc-mbc-dnc-central-institutions',
  'pm-usp-central-sector',
  'pm-yasasvi-top-class-college',
  'national-top-class-st'
];

function baseProfile() {
  return {
    name: 'Test',
    age: 20,
    district: 'Chennai',
    educationLevel: 'Undergraduate',
    course: 'B.Sc Physics',
    collegeType: 'Government',
    academicYear: '2nd Year',
    incomeRange: 'Below ₹1 lakh',
    firstGeneration: 'no',
    savedAt: new Date().toISOString()
  };
}

function viewFor(profile) {
  return results.buildResultsView(engine.evaluateAll(profile, schemes), schemes);
}

// Returns { group, item } for a scheme id, or null when it is not in the view.
function findItem(view, schemeId) {
  for (const group of view.groups) {
    for (const item of group.items) {
      if (item.schemeId === schemeId) {
        return { group: group, item: item };
      }
    }
  }
  return null;
}

function allItems(view) {
  return view.groups.reduce((all, group) => all.concat(group.items), []);
}

const tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

test('(a) sample profile: all five real schemes are More Information Required, none Likely Eligible', () => {
  const view = viewFor(baseProfile());
  assert.strictEqual(view.groups[0].label, STATUS.LIKELY);
  assert.strictEqual(view.groups[0].items.length, 0);
  const moreInfo = view.groups[1].items.map(item => item.schemeId).sort();
  assert.deepStrictEqual(moreInfo, REAL_IDS.slice().sort());
});

test('(b) missing incomeRange gives tn-bc-mbc-dnc-post-matric More Information Required with incomeRange missing', () => {
  const profile = baseProfile();
  delete profile.incomeRange;
  const hit = findItem(viewFor(profile), 'tn-bc-mbc-dnc-post-matric');
  assert.ok(hit, 'tn-bc-mbc-dnc-post-matric missing from view');
  assert.strictEqual(hit.group.label, STATUS.MORE_INFO);
  assert.ok(hit.item.missing.includes('incomeRange'));
});

test('(c) Diploma educationLevel puts pm-usp-central-sector in Not Eligible with a failed criterion', () => {
  const profile = baseProfile();
  profile.educationLevel = 'Diploma';
  const hit = findItem(viewFor(profile), 'pm-usp-central-sector');
  assert.ok(hit, 'pm-usp-central-sector missing from view');
  assert.strictEqual(hit.group.label, STATUS.NOT_ELIGIBLE);
  assert.ok(hit.item.failed.length > 0);
});

test('(d) null profile returns three groups without throwing; every item is non-demo with a verification status', () => {
  const view = viewFor(null);
  assert.deepStrictEqual(view.groups.map(group => group.label),
    [STATUS.LIKELY, STATUS.MORE_INFO, STATUS.NOT_ELIGIBLE]);
  const items = allItems(view);
  assert.ok(items.length > 0, 'expected scheme items for a null profile');
  items.forEach(item => {
    assert.strictEqual(item.isDemo, false);
    assert.ok(['verified', 'partially-verified', 'unverified'].indexOf(item.verificationStatus) !== -1, item.schemeId + ' verificationStatus');
    assert.strictEqual(item.verificationStatus, schemes.find(s => s.id === item.schemeId).verificationStatus);
  });
});

test('(d) full profile items carry source URL, last verified date and non-demo flag', () => {
  const items = allItems(viewFor(baseProfile()));
  assert.strictEqual(items.length, schemes.length);
  items.forEach(item => {
    assert.strictEqual(item.isDemo, false);
    assert.ok(['verified', 'partially-verified', 'unverified'].indexOf(item.verificationStatus) !== -1, item.schemeId + ' verificationStatus');
    assert.strictEqual(item.verificationStatus, schemes.find(s => s.id === item.schemeId).verificationStatus);
    assert.strictEqual(typeof item.officialUrl, 'string');
    const record = schemes.find(s => s.id === item.schemeId);
    assert.ok(record.lastVerified === null || /^\d{4}-\d{2}-\d{2}$/.test(record.lastVerified), item.schemeId + ' lastVerified');
  });
});

test('(e) corrupt stored JSON gives a null profile without throwing', () => {
  const fakeStorage = { getItem: () => '{bad' };
  assert.strictEqual(engine.getSavedProfile(fakeStorage), null);
});

test('explanations never contain a percent sign', () => {
  const profiles = [baseProfile(), null, Object.assign(baseProfile(), { collegeType: 'Private' })];
  profiles.forEach(profile => {
    allItems(viewFor(profile)).forEach(item => {
      assert.ok(!item.explanation.includes('%'), 'explanation contains %: ' + item.explanation);
    });
  });
});

test('selectionNote: scheme with selectionNote carries it into the view item; scheme without it gets null', () => {
  const view = viewFor(baseProfile());
  const withNote = schemes.find(s => typeof s.selectionNote === 'string');
  assert.ok(withNote, 'expected at least one scheme with selectionNote');
  const hit = findItem(view, withNote.id);
  assert.ok(hit, withNote.id + ' missing from view');
  assert.strictEqual(hit.item.selectionNote, withNote.selectionNote);
  const withoutNote = schemes.find(s => s.selectionNote === undefined);
  assert.ok(withoutNote, 'expected at least one scheme without selectionNote');
  const other = findItem(view, withoutNote.id);
  assert.strictEqual(other.item.selectionNote, null);
});

let failed = 0;
tests.forEach(t => {
  try {
    t.fn();
    console.log('PASS ' + t.name);
  } catch (error) {
    failed += 1;
    console.log('FAIL ' + t.name + ': ' + error.message);
  }
});

if (failed > 0) {
  process.exitCode = 1;
}
