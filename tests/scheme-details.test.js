// Plain Node tests for the scholarship details view. Run with: node tests/scheme-details.test.js
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const schemes = require('../js/schemes.js');
const details = require('../js/scheme-details.js');

const REAL_IDS = [
  'tn-bc-mbc-dnc-post-matric',
  'tn-bc-mbc-dnc-central-institutions',
  'pm-usp-central-sector',
  'pm-yasasvi-top-class-college',
  'national-top-class-st'
];
const DISCLAIMERS = [
  'Meeting the eligibility criteria does not guarantee an award.',
  'Check the official source before you apply.'
];

function recordFor(id) {
  return schemes.find(s => s.id === id);
}

const tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

test('getSchemeIdFromSearch: returns the id for a valid query', () => {
  assert.strictEqual(details.getSchemeIdFromSearch('?id=pm-usp-central-sector'), 'pm-usp-central-sector');
  assert.strictEqual(details.getSchemeIdFromSearch('id=pm-usp-central-sector'), 'pm-usp-central-sector');
});

test('getSchemeIdFromSearch: missing, empty and whitespace-only ids give null', () => {
  assert.strictEqual(details.getSchemeIdFromSearch(''), null);
  assert.strictEqual(details.getSchemeIdFromSearch('?other=1'), null);
  assert.strictEqual(details.getSchemeIdFromSearch('?id='), null);
  assert.strictEqual(details.getSchemeIdFromSearch('?id=%20%20'), null);
  assert.strictEqual(details.getSchemeIdFromSearch(undefined), null);
});

test('getSchemeIdFromSearch: surrounding whitespace is trimmed', () => {
  assert.strictEqual(details.getSchemeIdFromSearch('?id=%20national-top-class-st%20'), 'national-top-class-st');
});

test('findSchemeById: each of the five ids returns its own record', () => {
  REAL_IDS.forEach(id => {
    const hit = details.findSchemeById(schemes, id);
    assert.ok(hit, id + ' not found');
    assert.strictEqual(hit.id, id);
  });
});

test('findSchemeById: unknown, null, undefined, non-string ids and non-array schemes give null', () => {
  assert.strictEqual(details.findSchemeById(schemes, 'no-such-scheme'), null);
  assert.strictEqual(details.findSchemeById(schemes, null), null);
  assert.strictEqual(details.findSchemeById(schemes, undefined), null);
  assert.strictEqual(details.findSchemeById(schemes, 5), null);
  assert.strictEqual(details.findSchemeById(null, 'pm-usp-central-sector'), null);
  assert.strictEqual(details.findSchemeById({}, 'pm-usp-central-sector'), null);
});

test('buildDetailsView: each of the five records keeps its own name and description', () => {
  REAL_IDS.forEach(id => {
    const record = recordFor(id);
    const view = details.buildDetailsView(record);
    assert.strictEqual(view.name, record.name, id + ' name');
    assert.strictEqual(view.description, record.description, id + ' description');
    assert.strictEqual(view.department, record.department, id + ' department');
  });
});

test('buildDetailsView: every rule label lands in exactly one requirement group', () => {
  REAL_IDS.forEach(id => {
    const record = recordFor(id);
    const view = details.buildDetailsView(record);
    const grouped = [].concat(
      view.eligibleCategories,
      view.educationRequirements,
      view.institutionRequirements,
      view.incomeRequirements,
      view.otherConditions
    );
    const ruleLabels = record.rules.map(rule => rule.label).sort();
    assert.deepStrictEqual(grouped.slice().sort(), ruleLabels, id + ' rule labels');
  });
});

test('buildDetailsView: category rules go to eligibleCategories', () => {
  const view = details.buildDetailsView(recordFor('tn-bc-mbc-dnc-post-matric'));
  assert.deepStrictEqual(view.eligibleCategories, [recordFor('tn-bc-mbc-dnc-post-matric').rules[0].label]);
});

test('buildDetailsView: benefits is null for all five records', () => {
  REAL_IDS.forEach(id => {
    assert.strictEqual(details.buildDetailsView(recordFor(id)).benefits, null, id);
  });
});

test('buildDetailsView: null requiredDocuments, applicationSteps and deadline give null', () => {
  const sample = Object.assign({}, recordFor('pm-usp-central-sector'));
  assert.strictEqual(sample.requiredDocuments, null);
  assert.strictEqual(sample.applicationSteps, null);
  assert.strictEqual(sample.deadline, null);
  const view = details.buildDetailsView(sample);
  assert.strictEqual(view.requiredDocuments, null);
  assert.strictEqual(view.applicationProcedure, null);
  assert.strictEqual(view.applicationDeadline, null);
});

test('buildDetailsView: applicationSteps array is passed through as the procedure', () => {
  const view = details.buildDetailsView(recordFor('tn-bc-mbc-dnc-post-matric'));
  assert.deepStrictEqual(view.applicationProcedure, recordFor('tn-bc-mbc-dnc-post-matric').applicationSteps);
});

test('buildDetailsView: two central records are Partially verified, the other three Unverified', () => {
  assert.strictEqual(details.buildDetailsView(recordFor('tn-bc-mbc-dnc-post-matric')).verificationLabel, 'Partially verified');
  assert.strictEqual(details.buildDetailsView(recordFor('tn-bc-mbc-dnc-central-institutions')).verificationLabel, 'Partially verified');
  ['pm-usp-central-sector', 'pm-yasasvi-top-class-college', 'national-top-class-st'].forEach(id => {
    assert.strictEqual(details.buildDetailsView(recordFor(id)).verificationLabel, 'Unverified', id);
  });
});

test('buildDetailsView: no record ever produces Fully verified', () => {
  REAL_IDS.forEach(id => {
    const view = details.buildDetailsView(recordFor(id));
    assert.notStrictEqual(view.verificationLabel, 'Fully verified', id);
    assert.notStrictEqual(view.verificationStatus, 'Fully verified', id);
  });
});

test('buildDetailsView: a raw verified status gives the label Verified', () => {
  const synthetic = Object.assign({}, recordFor('pm-usp-central-sector'), { verificationStatus: 'verified' });
  const view = details.buildDetailsView(synthetic);
  assert.strictEqual(view.verificationStatus, 'verified');
  assert.strictEqual(view.verificationLabel, 'Verified');
});

test('buildDetailsView: official source accepts https and rejects javascript, ftp and missing URLs', () => {
  const base = recordFor('pm-usp-central-sector');
  assert.strictEqual(details.buildDetailsView(Object.assign({}, base, { officialUrl: 'https://example.gov.in/x' })).officialSource, 'https://example.gov.in/x');
  assert.strictEqual(details.buildDetailsView(Object.assign({}, base, { officialUrl: 'javascript:alert(1)' })).officialSource, null);
  assert.strictEqual(details.buildDetailsView(Object.assign({}, base, { officialUrl: 'ftp://x' })).officialSource, null);
  const missing = Object.assign({}, base);
  delete missing.officialUrl;
  assert.strictEqual(details.buildDetailsView(missing).officialSource, null);
});

test('buildDetailsView: applicationStatus is null for unknown and kept for a stated value', () => {
  REAL_IDS.forEach(id => {
    assert.strictEqual(details.buildDetailsView(recordFor(id)).applicationStatus, null, id);
  });
  const stated = Object.assign({}, recordFor('pm-usp-central-sector'), { applicationStatus: 'open' });
  assert.strictEqual(details.buildDetailsView(stated).applicationStatus, 'open');
});

test('buildDetailsView: both disclaimers are present in every view, including for a null record', () => {
  REAL_IDS.map(recordFor).concat([null]).forEach(record => {
    assert.deepStrictEqual(details.buildDetailsView(record).disclaimers, DISCLAIMERS);
  });
});

test('scheme-details.html: has a results link and loads schemes.js and scheme-details.js', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'scheme-details.html'), 'utf8');
  assert.ok(html.includes('href="results.html"'), 'missing results.html link');
  assert.ok(html.includes('src="js/schemes.js"'), 'missing schemes.js script');
  assert.ok(html.includes('src="js/scheme-details.js"'), 'missing scheme-details.js script');
});

test('results.js: source links to scheme-details.html', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'results.js'), 'utf8');
  assert.ok(source.includes('scheme-details.html'));
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
