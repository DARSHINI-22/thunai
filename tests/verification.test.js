// Run with: node tests/verification.test.js
'use strict';
const assert = require('assert');
const schemes = require('../js/schemes.js');
const engine = require('../js/eligibility.js');
const results = require('../js/results.js');

const ALLOWED_STATUS = ['verified', 'partially-verified', 'unverified'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const byId = (id) => schemes.find((s) => s.id === id);

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

test('(v1) every record verificationStatus is allowed and none is source-checked', () => {
  schemes.forEach((s) => {
    assert.ok(ALLOWED_STATUS.indexOf(s.verificationStatus) !== -1, s.id + ' verificationStatus: ' + s.verificationStatus);
    assert.notStrictEqual(s.verificationStatus, 'source-checked', s.id + ' still source-checked');
  });
});

test('(v2) no record is fully verified at this time', () => {
  schemes.forEach((s) => {
    assert.notStrictEqual(s.verificationStatus, 'verified', s.id + ' must not be verified');
  });
});

test('(v3) lastVerified is null or a date, and never the old 2026-11-21 value', () => {
  schemes.forEach((s) => {
    assert.ok(s.lastVerified === null || DATE_RE.test(s.lastVerified), s.id + ' lastVerified format: ' + s.lastVerified);
    assert.notStrictEqual(s.lastVerified, '2026-11-21', s.id + ' still has old lastVerified');
  });
});

test('(v4) unverified records have lastVerified null', () => {
  schemes.filter((s) => s.verificationStatus === 'unverified').forEach((s) => {
    assert.strictEqual(s.lastVerified, null, s.id + ' unverified but lastVerified is set');
  });
});

test('(v5) every record has a non-empty verificationNotes string', () => {
  schemes.forEach((s) => {
    assert.strictEqual(typeof s.verificationNotes, 'string', s.id + ' verificationNotes type');
    assert.ok(s.verificationNotes.trim().length > 0, s.id + ' verificationNotes is empty');
  });
});

test('(v6) partially verified records carry 2026-11-22; unverified records keep null', () => {
  ['tn-bc-mbc-dnc-post-matric', 'tn-bc-mbc-dnc-central-institutions'].forEach((id) => {
    assert.strictEqual(byId(id).verificationStatus, 'partially-verified', id + ' verificationStatus');
    assert.strictEqual(byId(id).lastVerified, '2026-11-22', id + ' lastVerified');
  });
  ['pm-usp-central-sector', 'pm-yasasvi-top-class-college', 'national-top-class-st'].forEach((id) => {
    assert.strictEqual(byId(id).verificationStatus, 'unverified', id + ' verificationStatus');
    assert.strictEqual(byId(id).lastVerified, null, id + ' lastVerified');
  });
});

test('(v7) unknown information stays unknown: applicationStatus unknown, deadline and requiredDocuments null', () => {
  schemes.forEach((s) => {
    assert.strictEqual(s.applicationStatus, 'unknown', s.id + ' applicationStatus');
    assert.strictEqual(s.deadline, null, s.id + ' deadline');
    assert.strictEqual(s.requiredDocuments, null, s.id + ' requiredDocuments');
  });
});

test('(v8) pm-yasasvi-top-class-college notes flag the school scheme ambiguity', () => {
  assert.ok(byId('pm-yasasvi-top-class-college').verificationNotes.includes('school scheme'),
    'pm-yasasvi notes do not mention the school scheme');
});

test('(v9) national-top-class-st notes show the PIB source refers to Post Matric, not Top Class', () => {
  assert.ok(byId('national-top-class-st').verificationNotes.includes('Post Matric'),
    'national-top-class-st notes do not mention Post Matric');
});

test('(v10) results view item carries the record verificationNotes', () => {
  const pmUsp = byId('pm-usp-central-sector');
  const view = results.buildResultsView(
    [{ schemeId: pmUsp.id, schemeName: pmUsp.name, status: engine.STATUS.MORE_INFO }],
    schemes
  );
  const item = view.groups[1].items[0];
  assert.strictEqual(item.verificationNotes, pmUsp.verificationNotes, 'view item verificationNotes');
});

if (failures === 0) {
  console.log('All verification tests passed.');
}
