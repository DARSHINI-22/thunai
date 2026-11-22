// Plain Node tests for the document checklist model. Run with: node tests/document-checklist.test.js
'use strict';

const assert = require('assert');
const model = require('../js/document-checklist-model.js');

const verifiedScheme = {
  id: 'test-verified',
  verificationStatus: 'verified',
  requiredDocuments: ['Income certificate', 'Marksheet', 'Bonafide certificate']
};
const otherScheme = {
  id: 'test-other',
  verificationStatus: 'verified',
  requiredDocuments: ['Income certificate', 'Aadhaar card']
};
const unverifiedWithList = { id: 'x', verificationStatus: 'unverified', requiredDocuments: ['Marksheet'] };
const partiallyVerifiedWithList = { id: 'x', verificationStatus: 'partially-verified', requiredDocuments: ['Marksheet'] };
const UNKNOWN_FIXTURES = [
  { name: 'null requiredDocuments', scheme: { id: 'x', verificationStatus: 'verified', requiredDocuments: null } },
  { name: 'missing requiredDocuments', scheme: { id: 'x', verificationStatus: 'verified' } },
  { name: 'empty requiredDocuments', scheme: { id: 'x', verificationStatus: 'verified', requiredDocuments: [] } },
  { name: 'unverified with list', scheme: unverifiedWithList },
  { name: 'partially-verified with list', scheme: partiallyVerifiedWithList }
];

function makeStore() {
  return {
    data: {},
    getItem(k) { return k in this.data ? this.data[k] : null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  };
}

function makeThrowingStore() {
  function boom() { throw new Error('storage unavailable'); }
  return { getItem: boom, setItem: boom, removeItem: boom };
}

const VERIFIED_ITEMS = model.documentItems(verifiedScheme);
const OTHER_ITEMS = model.documentItems(otherScheme);

const tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

// 1. Persistence
test('persistence: saved checks are restored by loadChecked on the same store', () => {
  const store = makeStore();
  const result = model.saveChecked(store, verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet']);
  assert.deepStrictEqual(result, { ok: true });
  assert.deepStrictEqual(model.loadChecked(store, verifiedScheme.id, VERIFIED_ITEMS), ['Marksheet']);
});

test('persistence: a fresh load (reopening the page) still restores saved checks', () => {
  const store = makeStore();
  model.saveChecked(store, verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet', 'Income certificate']);
  const reopened = makeStore();
  reopened.data = Object.assign({}, store.data);
  assert.deepStrictEqual(
    model.loadChecked(reopened, verifiedScheme.id, VERIFIED_ITEMS),
    ['Marksheet', 'Income certificate']
  );
});

test('persistence: stored value is a JSON array', () => {
  const store = makeStore();
  model.saveChecked(store, verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet']);
  const raw = store.data[model.storageKey(verifiedScheme.id)];
  assert.strictEqual(typeof raw, 'string');
  const parsed = JSON.parse(raw);
  assert.ok(Array.isArray(parsed));
  assert.deepStrictEqual(parsed, ['Marksheet']);
});

// 2. Isolation between schemes
test('isolation: each scheme loads only its own saved checks', () => {
  const store = makeStore();
  model.saveChecked(store, verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet']);
  model.saveChecked(store, otherScheme.id, OTHER_ITEMS, ['Aadhaar card']);
  assert.deepStrictEqual(model.loadChecked(store, verifiedScheme.id, VERIFIED_ITEMS), ['Marksheet']);
  assert.deepStrictEqual(model.loadChecked(store, otherScheme.id, OTHER_ITEMS), ['Aadhaar card']);
});

test('isolation: storage keys differ between schemes', () => {
  assert.notStrictEqual(model.storageKey('test-verified'), model.storageKey('test-other'));
});

test('isolation: resetting one scheme leaves the other intact', () => {
  const store = makeStore();
  model.saveChecked(store, verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet']);
  model.saveChecked(store, otherScheme.id, OTHER_ITEMS, ['Aadhaar card']);
  model.resetChecked(store, verifiedScheme.id);
  assert.deepStrictEqual(model.loadChecked(store, verifiedScheme.id, VERIFIED_ITEMS), []);
  assert.deepStrictEqual(model.loadChecked(store, otherScheme.id, OTHER_ITEMS), ['Aadhaar card']);
});

// 3. Reset
test('reset: returns {ok:true} and loadChecked then returns []', () => {
  const store = makeStore();
  model.saveChecked(store, verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet']);
  assert.deepStrictEqual(model.resetChecked(store, verifiedScheme.id), { ok: true });
  assert.deepStrictEqual(model.loadChecked(store, verifiedScheme.id, VERIFIED_ITEMS), []);
});

test('reset: removes the stored key from the store', () => {
  const store = makeStore();
  const key = model.storageKey(verifiedScheme.id);
  model.saveChecked(store, verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet']);
  assert.ok(key in store.data);
  model.resetChecked(store, verifiedScheme.id);
  assert.ok(!(key in store.data));
});

// 4. Unknown document requirements
UNKNOWN_FIXTURES.forEach(fixture => {
  test('unknown requirements (' + fixture.name + '): documentItems is [] and checklist hidden', () => {
    assert.deepStrictEqual(model.documentItems(fixture.scheme), []);
    assert.strictEqual(model.isChecklistVisible(fixture.scheme), false);
  });
});

test('unknown requirements: NOT_CONFIRMED_TEXT is exact', () => {
  assert.strictEqual(model.NOT_CONFIRMED_TEXT, 'Document requirements not yet confirmed.');
});

// 5. Corrupt or invalid stored data
test('corrupt data: parseChecked returns [] for malformed JSON', () => {
  assert.deepStrictEqual(model.parseChecked('{bad json', VERIFIED_ITEMS), []);
});

test('corrupt data: parseChecked returns [] for a non-array JSON value', () => {
  assert.deepStrictEqual(model.parseChecked('{"a":1}', VERIFIED_ITEMS), []);
});

test('corrupt data: parseChecked keeps only valid strings present in items', () => {
  assert.deepStrictEqual(
    model.parseChecked('["Marksheet","Not in list",5]', VERIFIED_ITEMS),
    ['Marksheet']
  );
});

test('corrupt data: loadChecked returns [] when the store holds garbage', () => {
  const store = makeStore();
  store.data[model.storageKey(verifiedScheme.id)] = '{garbage';
  assert.deepStrictEqual(model.loadChecked(store, verifiedScheme.id, VERIFIED_ITEMS), []);
});

test('corrupt data: loadChecked with a throwing store returns [] and does not throw', () => {
  let result;
  assert.doesNotThrow(() => {
    result = model.loadChecked(makeThrowingStore(), verifiedScheme.id, VERIFIED_ITEMS);
  });
  assert.deepStrictEqual(result, []);
});

test('corrupt data: saveChecked with a throwing store returns {ok:false}', () => {
  assert.deepStrictEqual(
    model.saveChecked(makeThrowingStore(), verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet']),
    { ok: false }
  );
});

test('corrupt data: resetChecked with a throwing store returns {ok:false}', () => {
  assert.deepStrictEqual(model.resetChecked(makeThrowingStore(), verifiedScheme.id), { ok: false });
});

// 6. Gating
test('gating: documentItems(verifiedScheme) returns the three strings in order', () => {
  assert.deepStrictEqual(model.documentItems(verifiedScheme), [
    'Income certificate',
    'Marksheet',
    'Bonafide certificate'
  ]);
});

test('gating: whitespace-only entries and duplicates are removed and entries trimmed', () => {
  const scheme = {
    id: 'x',
    verificationStatus: 'verified',
    requiredDocuments: ['  Marksheet  ', '   ', '', 'Marksheet', 'Income certificate']
  };
  assert.deepStrictEqual(model.documentItems(scheme), ['Marksheet', 'Income certificate']);
});

test('gating: isChecklistVisible(verifiedScheme) is true', () => {
  assert.strictEqual(model.isChecklistVisible(verifiedScheme), true);
});

// 7. Pure helpers
test('setChecked: adds a label', () => {
  assert.deepStrictEqual(model.setChecked(['Marksheet'], 'Income certificate', true), ['Marksheet', 'Income certificate']);
});

test('setChecked: removes a label', () => {
  assert.deepStrictEqual(model.setChecked(['Marksheet', 'Income certificate'], 'Marksheet', false), ['Income certificate']);
});

test('setChecked: never duplicates a label', () => {
  assert.deepStrictEqual(model.setChecked(['Marksheet'], 'Marksheet', true), ['Marksheet']);
});

test('countReady: counts only items present in the list', () => {
  assert.strictEqual(model.countReady(VERIFIED_ITEMS, ['Marksheet', 'Not in list']), 1);
  assert.strictEqual(model.countReady(VERIFIED_ITEMS, []), 0);
});

test('progressText: formats plural, singular and empty output', () => {
  assert.strictEqual(model.progressText(0, 3), '0 of 3 documents ready');
  assert.strictEqual(model.progressText(1, 1), '1 of 1 document ready');
  assert.strictEqual(model.progressText(0, 0), '');
});

test('storageKey: returns null for empty, null, and ids with "/" or spaces', () => {
  assert.strictEqual(model.storageKey(''), null);
  assert.strictEqual(model.storageKey(null), null);
  assert.strictEqual(model.storageKey('a/b'), null);
  assert.strictEqual(model.storageKey('a b'), null);
});

// 8. Stale entries
test('stale: saveChecked ignores labels not in items', () => {
  const store = makeStore();
  model.saveChecked(store, verifiedScheme.id, VERIFIED_ITEMS, ['Marksheet', 'Removed doc']);
  assert.deepStrictEqual(JSON.parse(store.data[model.storageKey(verifiedScheme.id)]), ['Marksheet']);
});

test('stale: loadChecked drops entries no longer in the list', () => {
  const store = makeStore();
  store.data[model.storageKey(verifiedScheme.id)] = JSON.stringify(['Marksheet', 'Removed doc']);
  assert.deepStrictEqual(model.loadChecked(store, verifiedScheme.id, VERIFIED_ITEMS), ['Marksheet']);
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
