// Plain Node tests for the application guidance model. Run with: node tests/application-guidance.test.js
'use strict';

const assert = require('assert');
const fs = require('fs');
const model = require('../js/application-guidance-model.js');
const schemes = require('../js/schemes.js');

const full = {
  id: 't-full',
  applicationGuidance: {
    verified: true,
    sourceUrl: 'https://www.example.gov.in/apply',
    where: 'Apply on the official portal',
    method: 'online',
    steps: ['Register', '  Submit form  ', ''],
    portalUrl: 'https://portal.example.gov.in/',
    notes: ['Keep a copy of your receipt'],
    availabilityStatus: 'open',
    availabilityCheckedOn: '2026-11-22'
  }
};
const none = { id: 't-none' };
const nullGuidance = { id: 't-null', applicationGuidance: null };
const arrayGuidance = { id: 't-arr', applicationGuidance: [] };
const partial = {
  id: 't-part',
  applicationGuidance: { verified: true, sourceUrl: 'https://www.example.gov.in/x' }
};
const badUrls = {
  id: 't-bad',
  applicationGuidance: {
    verified: true,
    sourceUrl: 'javascript:alert(1)',
    portalUrl: 'ftp://x.gov.in',
    method: 'bogus',
    steps: [],
    notes: [],
    availabilityStatus: 'open'
  }
};

const UNKNOWN_FIXTURES = [
  { name: 'no applicationGuidance field', scheme: none },
  { name: 'null applicationGuidance', scheme: nullGuidance },
  { name: 'array applicationGuidance', scheme: arrayGuidance },
  { name: 'null scheme', scheme: null },
  { name: 'undefined scheme', scheme: undefined }
];

const tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

// 1. Known guidance
test('known guidance: full record produces the expected view', () => {
  const view = model.buildGuidanceView(full);
  assert.strictEqual(view.hasGuidance, true);
  assert.strictEqual(view.verified, true);
  assert.strictEqual(view.sourceUrl, 'https://www.example.gov.in/apply');
  assert.strictEqual(view.where, 'Apply on the official portal');
  assert.strictEqual(view.method, 'Online');
  assert.deepStrictEqual(view.steps, ['Register', 'Submit form']);
  assert.strictEqual(view.portalUrl, 'https://portal.example.gov.in/');
  assert.deepStrictEqual(view.notes, ['Keep a copy of your receipt']);
  assert.strictEqual(view.verifiedLabel, model.VERIFIED_TEXT);
});

// 2. Unknown guidance
UNKNOWN_FIXTURES.forEach(fixture => {
  test('unknown guidance (' + fixture.name + '): empty view with unknown labels', () => {
    const view = model.buildGuidanceView(fixture.scheme);
    assert.strictEqual(view.hasGuidance, false);
    assert.strictEqual(view.verified, false);
    assert.strictEqual(view.where, null);
    assert.strictEqual(view.method, null);
    assert.strictEqual(view.steps, null);
    assert.strictEqual(view.portalUrl, null);
    assert.strictEqual(view.notes, null);
    assert.strictEqual(view.sourceUrl, null);
    assert.strictEqual(view.availabilityLabel, model.AVAILABILITY_UNKNOWN_TEXT);
    assert.strictEqual(view.verifiedLabel, model.NOT_VERIFIED_TEXT);
  });
});

test('unknown guidance: NOT_CONFIRMED_TEXT is exact', () => {
  assert.strictEqual(model.NOT_CONFIRMED_TEXT, 'Application guidance not yet confirmed.');
});

// 3. Partial guidance
test('partial guidance: verified with source but no other fields gives nulls', () => {
  const view = model.buildGuidanceView(partial);
  assert.strictEqual(view.hasGuidance, true);
  assert.strictEqual(view.verified, true);
  assert.strictEqual(view.where, null);
  assert.strictEqual(view.steps, null);
  assert.strictEqual(view.notes, null);
  assert.strictEqual(view.portalUrl, null);
  assert.strictEqual(view.method, null);
  assert.strictEqual(view.availabilityLabel, model.AVAILABILITY_UNKNOWN_TEXT);
});

// 4. Invalid URLs
test('invalid URLs: isSafeUrl accepts https and http URLs', () => {
  assert.strictEqual(model.isSafeUrl('https://a.gov.in'), true);
  assert.strictEqual(model.isSafeUrl('http://a.gov.in/x'), true);
});

test('invalid URLs: isSafeUrl rejects unsafe or malformed values', () => {
  const rejected = [
    'javascript:alert(1)',
    'ftp://x.gov.in',
    'a.gov.in',
    '',
    ' ',
    null,
    42,
    '//x.gov.in',
    'https://a b.gov.in'
  ];
  rejected.forEach(value => {
    assert.strictEqual(model.isSafeUrl(value), false, 'expected rejection of ' + JSON.stringify(value));
  });
});

test('invalid URLs: badUrls yields null URLs, null fields and not verified', () => {
  const view = model.buildGuidanceView(badUrls);
  assert.strictEqual(view.verified, false);
  assert.strictEqual(view.sourceUrl, null);
  assert.strictEqual(view.portalUrl, null);
  assert.strictEqual(view.method, null);
  assert.strictEqual(view.steps, null);
  assert.strictEqual(view.notes, null);
});

// 5. Verified requires a safe source
test('verified requires a safe source: verified flag without sourceUrl is not verified', () => {
  const view = model.buildGuidanceView({ id: 'x', applicationGuidance: { verified: true } });
  assert.strictEqual(view.verified, false);
  assert.strictEqual(view.verifiedLabel, model.NOT_VERIFIED_TEXT);
});

test('verified requires a safe source: verified flag with unsafe sourceUrl is not verified', () => {
  const view = model.buildGuidanceView({
    id: 'x',
    applicationGuidance: { verified: true, sourceUrl: 'javascript:alert(1)' }
  });
  assert.strictEqual(view.verified, false);
  assert.strictEqual(view.verifiedLabel, model.NOT_VERIFIED_TEXT);
});

// 6. Availability separate from verification
test('availability: full record is verified and reports open applications', () => {
  const view = model.buildGuidanceView(full);
  assert.strictEqual(view.verified, true);
  assert.ok(view.availabilityLabel.includes('Open for applications'), view.availabilityLabel);
});

test('availability: verified with availabilityStatus unknown gives unknown label', () => {
  const view = model.buildGuidanceView({
    id: 'x',
    applicationGuidance: {
      verified: true,
      sourceUrl: 'https://www.example.gov.in/x',
      availabilityStatus: 'unknown',
      availabilityCheckedOn: '2026-11-22'
    }
  });
  assert.strictEqual(view.availabilityLabel, model.AVAILABILITY_UNKNOWN_TEXT);
});

test('availability: open status without availabilityCheckedOn gives unknown label', () => {
  const view = model.buildGuidanceView({
    id: 'x',
    applicationGuidance: {
      verified: true,
      sourceUrl: 'https://www.example.gov.in/x',
      availabilityStatus: 'open'
    }
  });
  assert.strictEqual(view.availabilityLabel, model.AVAILABILITY_UNKNOWN_TEXT);
});

test('availability: closed status with date contains Closed for applications', () => {
  const view = model.buildGuidanceView({
    id: 'x',
    applicationGuidance: {
      verified: true,
      sourceUrl: 'https://www.example.gov.in/x',
      availabilityStatus: 'closed',
      availabilityCheckedOn: '2026-11-22'
    }
  });
  assert.ok(view.availabilityLabel.includes('Closed for applications'), view.availabilityLabel);
});

test('availability: unverified record can still show open applications, and stays not verified', () => {
  const view = model.buildGuidanceView({
    id: 'x',
    applicationGuidance: {
      availabilityStatus: 'open',
      availabilityCheckedOn: '2026-11-22'
    }
  });
  assert.ok(view.availabilityLabel.includes('Open for applications'), view.availabilityLabel);
  assert.strictEqual(view.verified, false);
  assert.strictEqual(view.verifiedLabel, model.NOT_VERIFIED_TEXT);
});

// 7. Method
test('method: institution maps to its label', () => {
  const view = model.buildGuidanceView({ id: 'x', applicationGuidance: { method: 'institution' } });
  assert.strictEqual(view.method, model.METHOD_LABELS.institution);
});

test('method: prototype keys and wrong-case keys give null', () => {
  ['constructor', 'toString', '__proto__', 'OTHER'].forEach(method => {
    const view = model.buildGuidanceView({ id: 'x', applicationGuidance: { method: method } });
    assert.strictEqual(view.method, null, 'expected null for method ' + method);
  });
});

// 8. Steps and notes sanitising
test('sanitising: non-string and blank steps are dropped and text trimmed', () => {
  const view = model.buildGuidanceView({
    id: 'x',
    applicationGuidance: { steps: [1, null, ' ok '] }
  });
  assert.deepStrictEqual(view.steps, ['ok']);
});

test('sanitising: notes that are not an array give null', () => {
  const view = model.buildGuidanceView({
    id: 'x',
    applicationGuidance: { notes: 'a string' }
  });
  assert.strictEqual(view.notes, null);
});

// 9. Rendering source checks
test('rendering: application-guidance.js avoids innerHTML and has safe link and class markers', () => {
  const source = fs.readFileSync(__dirname + '/../js/application-guidance.js', 'utf8');
  assert.ok(!source.includes('innerHTML'), 'innerHTML must not appear');
  assert.ok(source.includes('noopener noreferrer'), 'missing noopener noreferrer');
  assert.ok(source.includes('_blank'), 'missing _blank');
  assert.ok(source.includes('guidance-card'), 'missing guidance-card');
  assert.ok(source.includes('guidance-body'), 'missing guidance-body');
});

test('rendering: application-guidance-model.js does not use innerHTML', () => {
  const source = fs.readFileSync(__dirname + '/../js/application-guidance-model.js', 'utf8');
  assert.ok(!source.includes('innerHTML'), 'innerHTML must not appear');
});

// 10. Record fields are not used
test('record fields: legacy-style field names are ignored', () => {
  const view = model.buildGuidanceView({
    id: 'x',
    applicationSteps: ['x'],
    applicationPortalUrl: 'https://scholarships.gov.in/',
    officialUrl: 'https://www.example.gov.in/'
  });
  assert.strictEqual(view.hasGuidance, false);
  assert.strictEqual(view.steps, null);
  assert.strictEqual(view.portalUrl, null);
  assert.strictEqual(view.sourceUrl, null);
});

// 11. Real records carry no guidance yet
test('real records: every record in js/schemes.js has hasGuidance false', () => {
  assert.ok(Array.isArray(schemes), 'js/schemes.js should export an array');
  assert.ok(schemes.length > 0, 'expected at least one record');
  schemes.forEach(record => {
    assert.strictEqual(model.buildGuidanceView(record).hasGuidance, false, 'record ' + record.id);
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
