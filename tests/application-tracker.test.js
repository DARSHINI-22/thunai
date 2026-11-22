// Plain Node tests for the application tracker model. Run with: node tests/application-tracker.test.js
'use strict';

const assert = require('assert');
const model = require('../js/application-tracker-model.js');
const savedModel = require('../js/saved-scholarships-model.js');

const STORAGE_KEY = model.STORAGE_KEY;
const schemes = [
  { id: 'alpha-one', name: 'Alpha', description: 'A' },
  { id: 'beta-two', name: 'Beta', description: 'B' }
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

const tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

// 1. Adding
test('adding: addEntry adds a not-started entry to an empty list', () => {
  const input = [];
  const result = model.addEntry(input, 'alpha-one');
  assert.deepStrictEqual(result, [{ schemeId: 'alpha-one', status: 'not-started' }]);
  assert.deepStrictEqual(input, []);
});

test('adding: saveTracker returns {ok:true} and stores a JSON array', () => {
  const store = makeStore();
  const entries = model.addEntry([], 'alpha-one');
  assert.deepStrictEqual(model.saveTracker(store, entries), { ok: true });
  assert.deepStrictEqual(JSON.parse(store.data[STORAGE_KEY]), entries);
});

test('adding: loadTracker returns the added entry after save', () => {
  const store = makeStore();
  const entries = model.addEntry([], 'alpha-one');
  model.saveTracker(store, entries);
  assert.deepStrictEqual(model.loadTracker(store, schemes), entries);
});

test('adding: findEntry returns the added entry', () => {
  const entries = model.addEntry([], 'alpha-one');
  assert.deepStrictEqual(
    model.findEntry(entries, 'alpha-one'),
    { schemeId: 'alpha-one', status: 'not-started' }
  );
});

// 2. Duplicate prevention
test('duplicates: addEntry on an existing submitted entry keeps one entry and its status', () => {
  const input = [{ schemeId: 'alpha-one', status: 'submitted' }];
  const result = model.addEntry(input, 'alpha-one');
  assert.deepStrictEqual(result, [{ schemeId: 'alpha-one', status: 'submitted' }]);
});

test('duplicates: cleanEntries keeps one entry per scheme and the first status', () => {
  const result = model.cleanEntries([
    { schemeId: 'alpha-one', status: 'not-started' },
    { schemeId: 'alpha-one', status: 'submitted' }
  ]);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].status, 'not-started');
});

// 3. Changing status
test('status: setStatus changes only the target entry and keeps order', () => {
  const input = [
    { schemeId: 'alpha-one', status: 'not-started' },
    { schemeId: 'beta-two', status: 'not-started' }
  ];
  assert.deepStrictEqual(model.setStatus(input, 'alpha-one', 'in-progress'), [
    { schemeId: 'alpha-one', status: 'in-progress' },
    { schemeId: 'beta-two', status: 'not-started' }
  ]);
});

test('status: setStatus with an invalid status returns an unchanged copy', () => {
  const input = [{ schemeId: 'alpha-one', status: 'not-started' }];
  assert.deepStrictEqual(model.setStatus(input, 'alpha-one', 'done'), input);
});

test('status: setStatus for a missing id returns an unchanged copy with no new entry', () => {
  const input = [{ schemeId: 'alpha-one', status: 'not-started' }];
  assert.deepStrictEqual(model.setStatus(input, 'beta-two', 'submitted'), input);
});

test('status: not-started, in-progress and submitted are all accepted', () => {
  ['not-started', 'in-progress', 'submitted'].forEach(status => {
    const result = model.setStatus([{ schemeId: 'alpha-one', status: 'not-started' }], 'alpha-one', status);
    assert.strictEqual(result[0].status, status);
  });
});

test('status: a changed status persists through saveTracker and loadTracker', () => {
  const store = makeStore();
  const changed = model.setStatus(model.addEntry([], 'alpha-one'), 'alpha-one', 'in-progress');
  model.saveTracker(store, changed);
  assert.deepStrictEqual(model.loadTracker(store, schemes), [
    { schemeId: 'alpha-one', status: 'in-progress' }
  ]);
});

// 4. Removing
test('removing: removeEntry removes only the given id', () => {
  const input = [
    { schemeId: 'alpha-one', status: 'not-started' },
    { schemeId: 'beta-two', status: 'submitted' }
  ];
  assert.deepStrictEqual(model.removeEntry(input, 'alpha-one'), [
    { schemeId: 'beta-two', status: 'submitted' }
  ]);
});

test('removing: removing an unknown id leaves the list unchanged', () => {
  const input = [{ schemeId: 'alpha-one', status: 'not-started' }];
  assert.deepStrictEqual(model.removeEntry(input, 'beta-two'), input);
});

test('removing: the removal persists through save and load', () => {
  const store = makeStore();
  const entries = model.removeEntry(
    [{ schemeId: 'alpha-one', status: 'not-started' }, { schemeId: 'beta-two', status: 'submitted' }],
    'alpha-one'
  );
  model.saveTracker(store, entries);
  assert.deepStrictEqual(model.loadTracker(store, schemes), [
    { schemeId: 'beta-two', status: 'submitted' }
  ]);
});

// 5. Persistence across reloads
test('persistence: loadTracker restores entries in order on a reopened store', () => {
  const store = makeStore();
  const entries = [
    { schemeId: 'beta-two', status: 'in-progress' },
    { schemeId: 'alpha-one', status: 'submitted' }
  ];
  model.saveTracker(store, entries);
  const reopened = makeStore();
  reopened.data = Object.assign({}, store.data);
  assert.deepStrictEqual(model.loadTracker(reopened, schemes), entries);
});

// 6. Corrupt storage
test('corrupt: parseTracker returns [] for malformed JSON', () => {
  assert.deepStrictEqual(model.parseTracker('{bad'), []);
});

test('corrupt: parseTracker returns [] for null', () => {
  assert.deepStrictEqual(model.parseTracker(null), []);
});

test('corrupt: parseTracker returns [] for a number', () => {
  assert.deepStrictEqual(model.parseTracker(42), []);
});

test('corrupt: parseTracker returns [] for a non-array JSON value', () => {
  assert.deepStrictEqual(model.parseTracker('{"a":1}'), []);
});

test('corrupt: parseTracker keeps only valid entries', () => {
  assert.deepStrictEqual(
    model.parseTracker('[{"schemeId":"alpha-one","status":"bogus"},{"schemeId":"beta-two","status":"submitted"},5,null]'),
    [{ schemeId: 'beta-two', status: 'submitted' }]
  );
});

test('corrupt: loadTracker returns [] when the store holds non-JSON', () => {
  const store = makeStore();
  store.data[STORAGE_KEY] = 'not json';
  assert.deepStrictEqual(model.loadTracker(store, schemes), []);
});

test('corrupt: loadTracker with a throwing store returns [] and does not throw', () => {
  let result;
  assert.doesNotThrow(() => {
    result = model.loadTracker(makeThrowingStore(), schemes);
  });
  assert.deepStrictEqual(result, []);
});

test('corrupt: saveTracker with a throwing store returns {ok:false}', () => {
  assert.deepStrictEqual(
    model.saveTracker(makeThrowingStore(), [{ schemeId: 'alpha-one', status: 'not-started' }]),
    { ok: false }
  );
});

test('corrupt: saveTracker with a null store returns {ok:false}', () => {
  assert.deepStrictEqual(model.saveTracker(null, []), { ok: false });
});

test('corrupt: loadTracker with a null store returns []', () => {
  assert.deepStrictEqual(model.loadTracker(null, schemes), []);
});

// 7. Invalid and deleted scheme ids
test('ids: ID_PATTERN rejects slash, space, empty and dot ids', () => {
  assert.strictEqual(model.ID_PATTERN.test('a/b'), false);
  assert.strictEqual(model.ID_PATTERN.test('has space'), false);
  assert.strictEqual(model.ID_PATTERN.test(''), false);
  assert.strictEqual(model.ID_PATTERN.test('x.y'), false);
});

test('ids: isValidId rejects slash, space, empty, dot, null and number ids', () => {
  assert.strictEqual(model.isValidId('a/b'), false);
  assert.strictEqual(model.isValidId('has space'), false);
  assert.strictEqual(model.isValidId(''), false);
  assert.strictEqual(model.isValidId('x.y'), false);
  assert.strictEqual(model.isValidId(null), false);
  assert.strictEqual(model.isValidId(7), false);
});

test('ids: ID_PATTERN accepts a normal scheme id', () => {
  assert.strictEqual(model.ID_PATTERN.test('alpha-one'), true);
});

test('ids: isValidId accepts a normal scheme id', () => {
  assert.strictEqual(model.isValidId('alpha-one'), true);
});

test('ids: addEntry ignores an id containing a space', () => {
  assert.deepStrictEqual(model.addEntry([], 'bad id'), []);
});

test('ids: addEntry ignores a path-like id', () => {
  assert.deepStrictEqual(model.addEntry([], '../x'), []);
});

test('ids: setStatus with an invalid id does not create an entry', () => {
  assert.deepStrictEqual(model.setStatus([], 'bad id', 'submitted'), []);
});

test('ids: loadTracker drops a stored entry whose scheme no longer exists', () => {
  const store = makeStore();
  store.data[STORAGE_KEY] = JSON.stringify([
    { schemeId: 'alpha-one', status: 'not-started' },
    { schemeId: 'deleted-scheme', status: 'submitted' }
  ]);
  assert.deepStrictEqual(model.loadTracker(store, schemes), [
    { schemeId: 'alpha-one', status: 'not-started' }
  ]);
});

test('ids: loadTracker with non-array schemes returns []', () => {
  const store = makeStore();
  model.saveTracker(store, model.addEntry([], 'alpha-one'));
  assert.deepStrictEqual(model.loadTracker(store, null), []);
});

test('ids: resolveTracker skips an entry whose scheme is missing', () => {
  assert.deepStrictEqual(
    model.resolveTracker([{ schemeId: 'deleted-scheme', status: 'submitted' }], schemes),
    []
  );
});

test('ids: resolveTracker with non-array schemes returns [] and does not throw', () => {
  let result;
  assert.doesNotThrow(() => {
    result = model.resolveTracker([{ schemeId: 'alpha-one', status: 'submitted' }], null);
  });
  assert.deepStrictEqual(result, []);
});

// 8. Invalid statuses
test('statuses: isValidStatus rejects an unknown status', () => {
  assert.strictEqual(model.isValidStatus('done'), false);
});

test('statuses: isValidStatus is case-sensitive', () => {
  assert.strictEqual(model.isValidStatus('Submitted'), false);
});

test('statuses: cleanEntries drops entries with an invalid status', () => {
  assert.deepStrictEqual(
    model.cleanEntries([
      { schemeId: 'alpha-one', status: 'done' },
      { schemeId: 'beta-two', status: 'submitted' }
    ]),
    [{ schemeId: 'beta-two', status: 'submitted' }]
  );
});

// 9. Empty state and summary text
test('empty: loadTracker on an empty store returns []', () => {
  assert.deepStrictEqual(model.loadTracker(makeStore(), schemes), []);
});

test('empty: summaryText(0) is the empty-state message', () => {
  assert.strictEqual(model.summaryText(0), 'No applications tracked yet.');
});

test('empty: summaryText(1) is singular', () => {
  assert.strictEqual(model.summaryText(1), '1 application tracked');
});

test('empty: summaryText(3) is plural', () => {
  assert.strictEqual(model.summaryText(3), '3 applications tracked');
});

test('empty: resolveTracker on an empty list returns []', () => {
  assert.deepStrictEqual(model.resolveTracker([], schemes), []);
});

// 10. Resolution
test('resolve: resolveTracker keeps entry order and joins scheme name, description and label', () => {
  const result = model.resolveTracker([
    { schemeId: 'beta-two', status: 'in-progress' },
    { schemeId: 'alpha-one', status: 'submitted' }
  ], schemes);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].name, 'Beta');
  assert.strictEqual(result[0].statusLabel, 'In Progress');
  assert.strictEqual(result[0].description, 'B');
  assert.strictEqual(result[1].name, 'Alpha');
  assert.strictEqual(result[1].statusLabel, 'Submitted');
  assert.strictEqual(result[1].description, 'A');
});

test('resolve: each resolved item has exactly the expected keys', () => {
  const result = model.resolveTracker([{ schemeId: 'alpha-one', status: 'submitted' }], schemes);
  assert.deepStrictEqual(
    Object.keys(result[0]).sort(),
    ['description', 'name', 'schemeId', 'status', 'statusLabel']
  );
});

// 11. Status note wording
test('note: STATUS_NOTE has the agreed wording', () => {
  assert.strictEqual(
    model.STATUS_NOTE,
    'Status is self-reported by you and is not verified by the scholarship provider.'
  );
});

// 12. Saved independence
test('independence: tracker and saved storage keys differ', () => {
  assert.notStrictEqual(STORAGE_KEY, 'thunai.savedScholarships');
  assert.strictEqual(savedModel.STORAGE_KEY, 'thunai.savedScholarships');
});

test('independence: tracker writes do not change saved scholarships', () => {
  const store = makeStore();
  assert.deepStrictEqual(savedModel.saveSaved(store, ['alpha-one']), { ok: true });

  const tracked = model.addEntry([], 'beta-two');
  assert.deepStrictEqual(model.saveTracker(store, tracked), { ok: true });

  assert.deepStrictEqual(savedModel.loadSaved(store, schemes), ['alpha-one']);
  assert.deepStrictEqual(model.loadTracker(store, schemes), [
    { schemeId: 'beta-two', status: 'not-started' }
  ]);

  const afterRemoval = model.removeEntry(tracked, 'beta-two');
  model.saveTracker(store, afterRemoval);
  assert.deepStrictEqual(savedModel.loadSaved(store, schemes), ['alpha-one']);
});

test('independence: removing a saved scholarship does not change tracker entries', () => {
  const store = makeStore();
  model.saveTracker(store, model.addEntry([], 'alpha-one'));
  savedModel.saveSaved(store, ['alpha-one']);

  savedModel.saveSaved(store, savedModel.setSaved(['alpha-one'], 'alpha-one', false));

  assert.deepStrictEqual(savedModel.loadSaved(store, schemes), []);
  assert.deepStrictEqual(model.loadTracker(store, schemes), [
    { schemeId: 'alpha-one', status: 'not-started' }
  ]);
});

// 13. No personal data
test('privacy: stored tracker objects contain only schemeId and status keys', () => {
  const store = makeStore();
  model.saveTracker(store, model.setStatus(model.addEntry([], 'alpha-one'), 'alpha-one', 'submitted'));
  const parsed = JSON.parse(store.data[STORAGE_KEY]);
  assert.ok(parsed.length > 0);
  parsed.forEach(entry => {
    assert.deepStrictEqual(Object.keys(entry).sort(), ['schemeId', 'status']);
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
