// Covers the dashboard model and static checks on the dashboard page and DOM module. It does NOT render the page in a DOM or browser.
// Run with: node tests/dashboard.test.js
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dm = require('../js/dashboard-model.js');
const schemes = require('../js/schemes.js');
const evaluator = require('../js/eligibility.js');
const tm = require('../js/application-tracker-model.js');

const sample = {
  name: 'Test Student',
  educationLevel: 'Undergraduate',
  course: 'B.Sc',
  collegeType: 'Government',
  academicYear: '2',
  category: 'BC',
  district: 'Chennai',
  institution: 'Anna University',
  incomeRange: 'Below ₹1 lakh',
  annualFamilyIncome: 80000,
  classXiiPercentileRank: 85,
  firstGeneration: 'no',
  age: '19',
  tnDomicile: 'yes',
  coursePrescribed: 'yes',
  regularCourse: 'yes',
  droppedAfterXii: 'no',
  fullTimeCourse: 'yes',
  eligibleCourseListed: 'yes',
  institutionListed: 'yes',
  otherScholarship: 'no'
};

function readRoot(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

const tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

// 1. Profile summary
test('profile: buildProfileSummary(null) has no profile and no rows', () => {
  const s = dm.buildProfileSummary(null);
  assert.strictEqual(s.hasProfile, false);
  assert.deepStrictEqual(s.rows, []);
});

test('profile: buildProfileSummary on a string has no profile', () => {
  assert.strictEqual(dm.buildProfileSummary('text').hasProfile, false);
});

test('profile: buildProfileSummary on an array has no profile', () => {
  assert.strictEqual(dm.buildProfileSummary([]).hasProfile, false);
});

test('profile: sample profile has a profile and a Name row', () => {
  const s = dm.buildProfileSummary(sample);
  assert.strictEqual(s.hasProfile, true);
  const nameRow = s.rows.find(r => r.label === 'Name');
  assert.ok(nameRow, 'Name row missing');
  assert.strictEqual(nameRow.value, 'Test Student');
});

test('profile: no row label is income, percentile, age or first-generation', () => {
  const forbidden = ['Annual family income', 'Income range', 'Class XII percentile rank', 'Age', 'First generation'];
  const s = dm.buildProfileSummary(sample);
  s.rows.forEach(r => {
    assert.ok(forbidden.indexOf(r.label) === -1, 'forbidden row shown: ' + r.label);
  });
});

test('profile: empty-string fields are omitted', () => {
  assert.deepStrictEqual(dm.buildProfileSummary({ name: '  ', district: '' }).rows, []);
});

// 2. Saved counts
test('counts: buildOverview(2, []).saved is 2', () => {
  assert.strictEqual(dm.buildOverview(2, []).saved, 2);
});

test('counts: buildOverview with a negative saved count gives 0', () => {
  assert.strictEqual(dm.buildOverview(-1, []).saved, 0);
});

test('counts: buildOverview with NaN saved count gives 0', () => {
  assert.strictEqual(dm.buildOverview(NaN, []).saved, 0);
});

test('counts: buildOverview with undefined saved count gives 0', () => {
  assert.strictEqual(dm.buildOverview(undefined, []).saved, 0);
});

test('counts: buildOverview(0, []).tracked is 0', () => {
  assert.strictEqual(dm.buildOverview(0, []).tracked, 0);
});

test('counts: overview.submittedNote equals SUBMITTED_NOTE', () => {
  assert.strictEqual(dm.buildOverview(0, []).submittedNote, dm.SUBMITTED_NOTE);
});

// 3. Saved preview
test('preview: saved preview total is 5 and shows 3 items for 5 real schemes', () => {
  assert.ok(Array.isArray(schemes), 'schemes.js must export an array');
  assert.strictEqual(schemes.length, 5);
  const p = dm.buildSavedPreview(schemes, dm.PREVIEW_LIMIT);
  assert.strictEqual(p.total, 5);
  assert.strictEqual(p.items.length, 3);
});

test('preview: first saved item has keys name and schemeId and the right id', () => {
  const p = dm.buildSavedPreview(schemes, dm.PREVIEW_LIMIT);
  assert.deepStrictEqual(Object.keys(p.items[0]).sort(), ['name', 'schemeId']);
  assert.strictEqual(p.items[0].schemeId, schemes[0].id);
});

// 4. Tracker counts
const trackerEntries = [
  { schemeId: 'a', status: 'not-started' },
  { schemeId: 'b', status: 'in-progress' },
  { schemeId: 'c', status: 'submitted' },
  { schemeId: 'a', status: 'submitted' },
  { schemeId: 'x', status: 'bogus' }
];

test('tracker counts: buildTrackerCounts ignores duplicates and invalid statuses', () => {
  assert.deepStrictEqual(dm.buildTrackerCounts(trackerEntries), {
    tracked: 3, notStarted: 1, inProgress: 1, submitted: 1
  });
});

test('tracker counts: buildOverview carries tracked, inProgress and submitted', () => {
  const o = dm.buildOverview(0, trackerEntries);
  assert.strictEqual(o.tracked, 3);
  assert.strictEqual(o.inProgress, 1);
  assert.strictEqual(o.submitted, 1);
});

// 5. Tracker statuses via labels
test('labels: a provided statusLabel is kept', () => {
  const out = dm.buildTrackerPreview([{ schemeId: 'a', name: 'A', statusLabel: 'Submitted' }], tm.STATUS_LABELS);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].statusLabel, 'Submitted');
});

test('labels: a missing statusLabel is derived from status', () => {
  const out = dm.buildTrackerPreview([{ schemeId: 'a', name: 'A', status: 'in-progress' }], tm.STATUS_LABELS);
  assert.strictEqual(out[0].statusLabel, 'In Progress');
});

// 6. Missing profile in match summary
test('match: buildMatchSummary(null, []) state is no-profile', () => {
  assert.strictEqual(dm.buildMatchSummary(null, []).state, 'no-profile');
});

test('match: buildMatchSummary with non-array results state is unavailable', () => {
  assert.strictEqual(dm.buildMatchSummary(sample, 'nope').state, 'unavailable');
});

// 7. Matches counted from real eligibility
test('match: counts come from real evaluateAll results', () => {
  const results = evaluator.evaluateAll(sample, schemes);
  const m = dm.buildMatchSummary(sample, results);
  assert.strictEqual(m.state, 'ok');
  assert.strictEqual(m.total, results.length);
  assert.ok(m.likely + m.moreInfo + m.notEligible <= m.total);
  assert.strictEqual(m.top.length, Math.min(3, results.length));
});

test('match: each top item has keys name, schemeId and status', () => {
  const m = dm.buildMatchSummary(sample, evaluator.evaluateAll(sample, schemes));
  m.top.forEach(item => {
    assert.deepStrictEqual(Object.keys(item).sort(), ['name', 'schemeId', 'status']);
  });
});

// 8. Match counts never invented
test('match: unknown statuses are not counted as eligible', () => {
  const m = dm.buildMatchSummary(sample, [
    { schemeId: 'a', schemeName: 'A', status: 'Unknown status' },
    { schemeId: 'b', schemeName: 'B', status: 'Likely Eligible' }
  ]);
  assert.strictEqual(m.total, 2);
  assert.strictEqual(m.likely, 1);
  assert.strictEqual(m.moreInfo, 0);
  assert.strictEqual(m.notEligible, 0);
});

// 9. Empty states
test('empty: buildSavedPreview(null, 3) is empty', () => {
  assert.deepStrictEqual(dm.buildSavedPreview(null, 3), { total: 0, items: [] });
});

test('empty: buildSavedPreview([], 3).total is 0', () => {
  assert.strictEqual(dm.buildSavedPreview([], 3).total, 0);
});

test('empty: buildTrackerPreview(undefined, {}) is []', () => {
  assert.deepStrictEqual(dm.buildTrackerPreview(undefined, {}), []);
});

test('empty: buildTrackerCounts on a string gives all zeros', () => {
  assert.deepStrictEqual(dm.buildTrackerCounts('x'), {
    tracked: 0, notStarted: 0, inProgress: 0, submitted: 0
  });
});

// 10. Corrupt data is ignored safely
test('corrupt: buildTrackerCounts ignores junk entries', () => {
  assert.strictEqual(dm.buildTrackerCounts([null, 5, 'str', {}, { schemeId: '', status: 'submitted' }]).tracked, 0);
});

test('corrupt: buildMatchSummary ignores junk results and does not throw', () => {
  let m;
  assert.doesNotThrow(() => {
    m = dm.buildMatchSummary(sample, [null, {}]);
  });
  assert.strictEqual(m.total, 2);
  assert.strictEqual(m.likely, 0);
  assert.strictEqual(m.moreInfo, 0);
  assert.strictEqual(m.notEligible, 0);
});

// 11. Missing or deleted scheme names
test('deleted: saved preview falls back to the id as the name', () => {
  assert.deepStrictEqual(dm.buildSavedPreview([{ id: 'gone-1' }], 3).items[0], {
    schemeId: 'gone-1', name: 'gone-1'
  });
});

test('deleted: tracker preview falls back to the id as the name', () => {
  const out = dm.buildTrackerPreview([{ schemeId: 'gone-2', status: 'not-started' }], tm.STATUS_LABELS);
  assert.strictEqual(out[0].name, 'gone-2');
});

test('deleted: a tracker item with an unknown status gives an empty statusLabel', () => {
  const out = dm.buildTrackerPreview([{ schemeId: 'a', name: 'A', status: 'bogus' }], tm.STATUS_LABELS);
  assert.strictEqual(out[0].statusLabel, '');
});

// 12. Actions list
test('actions: buildActionsList returns the exact five links', () => {
  assert.deepStrictEqual(dm.buildActionsList(), [
    { label: 'Find scholarships', href: 'results.html' },
    { label: 'View saved scholarships', href: 'saved.html' },
    { label: 'Track applications', href: 'tracker.html' },
    { label: 'Compare scholarships', href: 'comparison.html' },
    { label: 'Edit profile', href: 'profile.html' }
  ]);
});

// 13. No sensitive fields shown
test('privacy: PROFILE_FIELDS contains no sensitive keys', () => {
  const keys = dm.PROFILE_FIELDS.map(f => f.key);
  const sensitive = ['annualFamilyIncome', 'incomeRange', 'classXiiPercentileRank', 'age', 'firstGeneration', 'savedAt', 'tnDomicile'];
  sensitive.forEach(k => {
    assert.ok(keys.indexOf(k) === -1, 'sensitive key shown: ' + k);
  });
});

// 14. Dashboard page static checks
const dashboardHtml = readRoot('dashboard.html');

['dash-profile-body', 'dash-overview-list', 'dash-submitted-note', 'dash-matches-body',
  'dash-saved-body', 'dash-tracker-body', 'dash-actions-list', 'dash-status'].forEach(id => {
  test('page: dashboard.html contains id "' + id + '"', () => {
    assert.ok(dashboardHtml.indexOf('id="' + id + '"') !== -1, 'missing id ' + id);
  });
});

test('page: dashboard.html has an Edit profile link to profile.html', () => {
  assert.ok(dashboardHtml.indexOf('href="profile.html"') !== -1);
});

test('page: dashboard.html has no inline script without a src attribute', () => {
  assert.strictEqual(/<script(?![^>]*\ssrc=)[^>]*>/.test(dashboardHtml), false);
});

// 15. Script order
test('scripts: dashboard.js loads after its model dependencies, and every src exists', () => {
  const srcs = [];
  const re = /<script\s+src="([^"]+)"/g;
  let match;
  while ((match = re.exec(dashboardHtml)) !== null) {
    srcs.push(match[1]);
  }
  const dashIndex = srcs.indexOf('js/dashboard.js');
  assert.ok(dashIndex !== -1, 'js/dashboard.js not included');
  ['js/dashboard-model.js', 'js/eligibility.js', 'js/profile-model.js',
    'js/saved-scholarships-model.js', 'js/application-tracker-model.js'].forEach(dep => {
    const depIndex = srcs.indexOf(dep);
    assert.ok(depIndex !== -1, dep + ' not included');
    assert.ok(dashIndex > depIndex, 'js/dashboard.js must load after ' + dep);
  });
  srcs.forEach(src => {
    assert.ok(fs.existsSync(path.join(__dirname, '..', src)), 'missing file: ' + src);
  });
});

// 16. DOM module safety
test('dom: js/dashboard.js uses textContent and not innerHTML', () => {
  const js = readRoot(path.join('js', 'dashboard.js'));
  assert.strictEqual(js.indexOf('innerHTML') === -1, true, 'innerHTML found');
  assert.ok(js.indexOf('textContent') !== -1, 'textContent not found');
});

// 17. Nav link
['index.html', 'profile.html', 'results.html', 'saved.html', 'tracker.html',
  'comparison.html', 'scheme-details.html', 'dashboard.html'].forEach(page => {
  test('nav: ' + page + ' links to dashboard.html', () => {
    assert.ok(readRoot(page).indexOf('href="dashboard.html"') !== -1, page + ' has no dashboard link');
  });
});

let failed = 0;
let passed = 0;
tests.forEach(t => {
  try {
    t.fn();
    passed += 1;
    console.log('PASS ' + t.name);
  } catch (error) {
    failed += 1;
    console.log('FAIL ' + t.name + ': ' + error.message);
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exitCode = 1;
}
