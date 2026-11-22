// Plain Node tests for the saved scholarships model. Run with: node tests/saved-scholarships.test.js
'use strict';

const assert = require('assert');
const model = require('../js/saved-scholarships-model.js');

const STORAGE_KEY = model.STORAGE_KEY;
const schemes = [
  { id: 'alpha-one', name: 'Alpha', description: 'A' },
  { id: 'beta-two', name: 'Beta', description: 'B' }
];
const alpha = schemes[0];
const beta = schemes[1];

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

const tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

// 1. Saving
test('saving: setSaved adds an id to an empty list', () => {
  assert.deepStrictEqual(model.setSaved([], 'alpha-one', true), ['alpha-one']);
});

test('saving: saveSaved returns {ok:true} and stores a JSON array', () => {
  const store = makeStore();
  assert.deepStrictEqual(model.saveSaved(store, ['alpha-one']), { ok: true });
  assert.deepStrictEqual(JSON.parse(store.data[STORAGE_KEY]), ['alpha-one']);
});

test('saving: isSaved is true after saving', () => {
  const store = makeStore();
  model.saveSaved(store, ['alpha-one']);
  const ids = model.loadSaved(store, schemes);
  assert.strictEqual(model.isSaved(ids, 'alpha-one'), true);
});

// 2. Duplicates
test('duplicates: setSaved never duplicates an id', () => {
  assert.deepStrictEqual(model.setSaved(['alpha-one'], 'alpha-one', true), ['alpha-one']);
});

test('duplicates: cleanIds removes repeated ids and keeps order', () => {
  assert.deepStrictEqual(
    model.cleanIds(['alpha-one', 'alpha-one', 'beta-two']),
    ['alpha-one', 'beta-two']
  );
});

test('duplicates: saveSaved stores a duplicate list once', () => {
  const store = makeStore();
  model.saveSaved(store, ['alpha-one', 'alpha-one']);
  assert.deepStrictEqual(JSON.parse(store.data[STORAGE_KEY]), ['alpha-one']);
});

// 3. Removing
test('removing: setSaved with on=false removes the id', () => {
  assert.deepStrictEqual(
    model.setSaved(['alpha-one', 'beta-two'], 'alpha-one', false),
    ['beta-two']
  );
});

test('removing: removing an id not present leaves the list unchanged', () => {
  assert.deepStrictEqual(
    model.setSaved(['alpha-one'], 'beta-two', false),
    ['alpha-one']
  );
});

test('removing: the removal persists through saveSaved and loadSaved', () => {
  const store = makeStore();
  const after = model.setSaved(['alpha-one', 'beta-two'], 'alpha-one', false);
  assert.deepStrictEqual(model.saveSaved(store, after), { ok: true });
  assert.deepStrictEqual(model.loadSaved(store, schemes), ['beta-two']);
});

// 4. Persistence across reloads
test('persistence: loadSaved restores ids in saved order on a reopened store', () => {
  const store = makeStore();
  model.saveSaved(store, ['alpha-one', 'beta-two']);
  const reopened = makeStore();
  reopened.data = Object.assign({}, store.data);
  assert.deepStrictEqual(
    model.loadSaved(reopened, schemes),
    ['alpha-one', 'beta-two']
  );
});

// 5. Corrupt storage
test('corrupt: parseSaved returns [] for malformed JSON', () => {
  assert.deepStrictEqual(model.parseSaved('{bad'), []);
});

test('corrupt: parseSaved returns [] for a non-array JSON value', () => {
  assert.deepStrictEqual(model.parseSaved('{"a":1}'), []);
});

test('corrupt: parseSaved returns [] for null', () => {
  assert.deepStrictEqual(model.parseSaved(null), []);
});

test('corrupt: parseSaved returns [] for a number', () => {
  assert.deepStrictEqual(model.parseSaved(42), []);
});

test('corrupt: parseSaved keeps only valid, unique string ids', () => {
  assert.deepStrictEqual(
    model.parseSaved('["alpha-one", 5, "", "bad id!", "alpha-one"]'),
    ['alpha-one']
  );
});

test('corrupt: loadSaved returns [] when the store holds non-JSON', () => {
  const store = makeStore();
  store.data[STORAGE_KEY] = 'not json';
  assert.deepStrictEqual(model.loadSaved(store, schemes), []);
});

test('corrupt: loadSaved with a throwing store returns [] and does not throw', () => {
  let result;
  assert.doesNotThrow(() => {
    result = model.loadSaved(makeThrowingStore(), schemes);
  });
  assert.deepStrictEqual(result, []);
});

test('corrupt: saveSaved with a throwing store returns {ok:false}', () => {
  assert.deepStrictEqual(
    model.saveSaved(makeThrowingStore(), ['alpha-one']),
    { ok: false }
  );
});

test('corrupt: saveSaved with a null store returns {ok:false}', () => {
  assert.deepStrictEqual(model.saveSaved(null, ['alpha-one']), { ok: false });
});

test('corrupt: loadSaved with a null store returns []', () => {
  assert.deepStrictEqual(model.loadSaved(null, schemes), []);
});

// 6. Invalid and deleted scheme ids
test('ids: ID_PATTERN rejects slash, space, empty and dot ids', () => {
  assert.strictEqual(model.ID_PATTERN.test('a/b'), false);
  assert.strictEqual(model.ID_PATTERN.test('has space'), false);
  assert.strictEqual(model.ID_PATTERN.test(''), false);
  assert.strictEqual(model.ID_PATTERN.test('x.y'), false);
});

test('ids: ID_PATTERN accepts a normal scheme id', () => {
  assert.strictEqual(model.ID_PATTERN.test('alpha-one'), true);
});

test('ids: setSaved ignores an invalid id', () => {
  assert.deepStrictEqual(model.setSaved([], 'bad id', true), []);
});

test('ids: loadSaved drops a stored id that no longer exists in schemes', () => {
  const store = makeStore();
  store.data[STORAGE_KEY] = JSON.stringify(['alpha-one', 'deleted-scheme']);
  assert.deepStrictEqual(model.loadSaved(store, schemes), ['alpha-one']);
});

test('ids: resolveSaved skips deleted ids and keeps id order', () => {
  assert.deepStrictEqual(
    model.resolveSaved(['deleted-scheme', 'beta-two', 'alpha-one'], schemes),
    [beta, alpha]
  );
});

test('ids: findScheme returns null for a missing id', () => {
  assert.strictEqual(model.findScheme(schemes, 'missing'), null);
});

test('ids: findScheme returns null when schemes is null', () => {
  assert.strictEqual(model.findScheme(null, 'alpha-one'), null);
});

test('ids: resolveSaved with non-array schemes returns [] and does not throw', () => {
  let result;
  assert.doesNotThrow(() => {
    result = model.resolveSaved(['alpha-one'], null);
  });
  assert.deepStrictEqual(result, []);
});

// 7. Empty state and summary text
test('empty: loadSaved on an empty store returns []', () => {
  assert.deepStrictEqual(model.loadSaved(makeStore(), schemes), []);
});

test('empty: summaryText(0) is the empty-state message', () => {
  assert.strictEqual(model.summaryText(0), 'No saved scholarships yet.');
});

test('empty: summaryText(1) is singular', () => {
  assert.strictEqual(model.summaryText(1), '1 saved scholarship');
});

test('empty: summaryText(2) is plural', () => {
  assert.strictEqual(model.summaryText(2), '2 saved scholarships');
});

// 8. Other
test('other: setSaved does not mutate its input array', () => {
  const input = ['alpha-one'];
  const copy = input.slice();
  model.setSaved(input, 'beta-two', true);
  assert.deepStrictEqual(input, copy);
});

test('other: setSaved with on=false for an absent id returns cleanIds of the input', () => {
  const input = ['alpha-one', 'alpha-one', 'beta-two'];
  assert.deepStrictEqual(
    model.setSaved(input, 'missing-id', false),
    model.cleanIds(input)
  );
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
