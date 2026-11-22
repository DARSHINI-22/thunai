// Plain Node tests for scholarship comparison. Run with: node tests/comparison.test.js
'use strict';

const assert = require('assert');
const selection = require('../js/comparison-selection-model.js');
const comparison = require('../js/comparison-model.js');
const detailsModel = require('../js/scheme-details-model.js');
const guidanceModel = require('../js/application-guidance-model.js');
const real = require('../js/schemes.js');

const STORAGE_KEY = selection.STORAGE_KEY;
const schemes = [
  { id: 'alpha-one', name: 'Alpha', description: 'A', rules: [] },
  { id: 'beta-two', name: 'Beta', description: 'B', rules: [] },
  { id: 'gamma-3', name: 'Gamma', description: 'G', rules: [] },
  { id: 'delta-4', name: 'Delta', description: 'D', rules: [] }
];

const deps = {
  buildDetailsView: detailsModel.buildDetailsView,
  buildGuidanceView: guidanceModel.buildGuidanceView,
  AVAILABILITY_UNKNOWN_TEXT: guidanceModel.AVAILABILITY_UNKNOWN_TEXT
};

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
test('adding: addSelection adds an id to an empty list', () => {
  const input = [];
  assert.deepStrictEqual(selection.addSelection(input, 'alpha-one'), { ids: ['alpha-one'], status: 'added' });
  assert.deepStrictEqual(input, []);
});

test('adding: saveSelection returns {ok:true} and loadSelection returns the added id', () => {
  const store = makeStore();
  const ids = selection.addSelection([], 'alpha-one').ids;
  assert.deepStrictEqual(selection.saveSelection(store, ids), { ok: true });
  assert.deepStrictEqual(selection.loadSelection(store, schemes), ['alpha-one']);
});

// 2. Removing
test('removing: removeSelection removes only the given id', () => {
  assert.deepStrictEqual(selection.removeSelection(['alpha-one', 'beta-two'], 'alpha-one'), ['beta-two']);
});

test('removing: removing an unknown id leaves the list unchanged', () => {
  assert.deepStrictEqual(selection.removeSelection(['alpha-one'], 'beta-two'), ['alpha-one']);
});

test('removing: the removal persists through save and load', () => {
  const store = makeStore();
  const ids = selection.removeSelection(['alpha-one', 'beta-two'], 'alpha-one');
  selection.saveSelection(store, ids);
  assert.deepStrictEqual(selection.loadSelection(store, schemes), ['beta-two']);
});

// 3. Clearing
test('clearing: clearSelection returns an empty list', () => {
  assert.deepStrictEqual(selection.clearSelection(), []);
});

test('clearing: saving an empty list then loading gives []', () => {
  const store = makeStore();
  selection.saveSelection(store, []);
  assert.deepStrictEqual(selection.loadSelection(store, schemes), []);
});

// 4. Maximum of three
test('maximum: MAX_SELECTED is 3', () => {
  assert.strictEqual(selection.MAX_SELECTED, 3);
});

test('maximum: adding a fourth id gives status full and keeps 3 ids', () => {
  const result = selection.addSelection(['alpha-one', 'beta-two', 'gamma-3'], 'delta-4');
  assert.strictEqual(result.status, 'full');
  assert.strictEqual(result.ids.length, 3);
});

test('maximum: a third id added to two existing ids gives status added', () => {
  const result = selection.addSelection(['alpha-one', 'beta-two'], 'gamma-3');
  assert.strictEqual(result.status, 'added');
  assert.strictEqual(result.ids.length, 3);
});

test('maximum: LIMIT_TEXT has the agreed wording', () => {
  assert.strictEqual(
    selection.LIMIT_TEXT,
    'You can compare up to 3 scholarships. Remove one to add another.'
  );
});

test('maximum: cleanIds caps a long list at 3 ids', () => {
  assert.strictEqual(selection.cleanIds(['a-1', 'b-2', 'c-3', 'd-4']).length, 3);
});

// 5. Duplicate prevention
test('duplicates: addSelection on an already selected id gives status already', () => {
  assert.deepStrictEqual(selection.addSelection(['alpha-one'], 'alpha-one'), {
    ids: ['alpha-one'],
    status: 'already'
  });
});

test('duplicates: cleanIds keeps the first occurrence only', () => {
  assert.deepStrictEqual(
    selection.cleanIds(['alpha-one', 'alpha-one', 'beta-two']),
    ['alpha-one', 'beta-two']
  );
});

// 6. Persistence
test('persistence: loadSelection restores ids in order on a reopened store', () => {
  const store = makeStore();
  selection.saveSelection(store, ['alpha-one', 'beta-two']);
  const reopened = makeStore();
  reopened.data = Object.assign({}, store.data);
  assert.deepStrictEqual(selection.loadSelection(reopened, schemes), ['alpha-one', 'beta-two']);
});

// 7. Invalid ids
test('ids: addSelection rejects an id containing a space', () => {
  assert.deepStrictEqual(selection.addSelection([], 'bad id'), { ids: [], status: 'invalid' });
});

test('ids: addSelection rejects a path-like id', () => {
  assert.deepStrictEqual(selection.addSelection([], '../x'), { ids: [], status: 'invalid' });
});

test('ids: addSelection rejects null without throwing', () => {
  let result;
  assert.doesNotThrow(() => {
    result = selection.addSelection([], null);
  });
  assert.deepStrictEqual(result, { ids: [], status: 'invalid' });
});

test('ids: addSelection rejects a number', () => {
  assert.deepStrictEqual(selection.addSelection([], 42), { ids: [], status: 'invalid' });
});

test('ids: ID_PATTERN rejects slash, space, empty and dot ids', () => {
  assert.strictEqual(selection.ID_PATTERN.test('a/b'), false);
  assert.strictEqual(selection.ID_PATTERN.test('has space'), false);
  assert.strictEqual(selection.ID_PATTERN.test(''), false);
  assert.strictEqual(selection.ID_PATTERN.test('x.y'), false);
});

test('ids: ID_PATTERN accepts a normal scheme id', () => {
  assert.strictEqual(selection.ID_PATTERN.test('alpha-one'), true);
});

test('ids: loadSelection drops a stored id whose scheme no longer exists', () => {
  const store = makeStore();
  store.data[STORAGE_KEY] = JSON.stringify(['alpha-one', 'deleted-scheme']);
  assert.deepStrictEqual(selection.loadSelection(store, schemes), ['alpha-one']);
});

// 8. Corrupt storage
test('corrupt: parseSelection returns [] for malformed JSON', () => {
  assert.deepStrictEqual(selection.parseSelection('{bad'), []);
});

test('corrupt: parseSelection returns [] for null', () => {
  assert.deepStrictEqual(selection.parseSelection(null), []);
});

test('corrupt: parseSelection returns [] for a number', () => {
  assert.deepStrictEqual(selection.parseSelection(42), []);
});

test('corrupt: parseSelection returns [] for a non-array JSON value', () => {
  assert.deepStrictEqual(selection.parseSelection('{"a":1}'), []);
});

test('corrupt: parseSelection keeps only valid unique string ids', () => {
  assert.deepStrictEqual(
    selection.parseSelection('["alpha-one", 5, "", "bad id", "alpha-one"]'),
    ['alpha-one']
  );
});

test('corrupt: loadSelection returns [] when the store holds non-JSON', () => {
  const store = makeStore();
  store.data[STORAGE_KEY] = 'not json';
  assert.deepStrictEqual(selection.loadSelection(store, schemes), []);
});

test('corrupt: loadSelection with a throwing store returns [] and does not throw', () => {
  let result;
  assert.doesNotThrow(() => {
    result = selection.loadSelection(makeThrowingStore(), schemes);
  });
  assert.deepStrictEqual(result, []);
});

test('corrupt: saveSelection with a throwing store returns {ok:false}', () => {
  assert.deepStrictEqual(selection.saveSelection(makeThrowingStore(), ['alpha-one']), { ok: false });
});

test('corrupt: saveSelection with a null store returns {ok:false}', () => {
  assert.deepStrictEqual(selection.saveSelection(null, ['alpha-one']), { ok: false });
});

test('corrupt: loadSelection with a null store returns []', () => {
  assert.deepStrictEqual(selection.loadSelection(null, schemes), []);
});

// 9. Empty state and summary text
test('empty: summaryText(0) is the empty-state message', () => {
  assert.strictEqual(selection.summaryText(0), 'No scholarships selected for comparison.');
});

test('empty: summaryText(1) is singular', () => {
  assert.strictEqual(selection.summaryText(1), '1 scholarship selected for comparison');
});

test('empty: summaryText(2) is plural', () => {
  assert.strictEqual(selection.summaryText(2), '2 scholarships selected for comparison');
});

test('empty: loadSelection on an empty store returns []', () => {
  assert.deepStrictEqual(selection.loadSelection(makeStore(), schemes), []);
});

// 10. Columns from real records
test('columns: one id gives one column with that schemeId', () => {
  const ids = real.map(s => s.id);
  const columns = comparison.buildComparisonColumns(real, [ids[0]], deps);
  assert.strictEqual(columns.length, 1);
  assert.strictEqual(columns[0].schemeId, ids[0]);
});

test('columns: every real record has exactly the 14 ROWS keys', () => {
  const expectedKeys = comparison.ROWS.map(r => r.key).sort();
  assert.strictEqual(expectedKeys.length, 14);
  const ids = real.map(s => s.id);
  assert.strictEqual(ids.length, 5);
  const columns = comparison.buildComparisonColumns(real, ids, deps);
  assert.strictEqual(columns.length, 5);
  columns.forEach(column => {
    assert.deepStrictEqual(Object.keys(column.cells).sort(), expectedKeys);
  });
});

test('columns: every cell is null or a non-empty array of non-empty strings', () => {
  const ids = real.map(s => s.id);
  const columns = comparison.buildComparisonColumns(real, ids, deps);
  columns.forEach(column => {
    Object.keys(column.cells).forEach(key => {
      const value = column.cells[key];
      if (value === null) return;
      assert.ok(Array.isArray(value), key + ' should be null or an array');
      assert.ok(value.length > 0, key + ' should not be an empty array');
      value.forEach(item => {
        assert.strictEqual(typeof item, 'string', key + ' item should be a string');
        assert.ok(item.trim().length > 0, key + ' item should not be blank');
      });
    });
  });
});

// 11. Missing information is null
// Data-dependent: these expectations match the current schemes.js data. If the data
// changes, the failing assertion shows the actual value rather than being weakened here.
test('missing: benefits is null for every real record (no record has benefits)', () => {
  const columns = comparison.buildComparisonColumns(real, real.map(s => s.id), deps);
  columns.forEach(column => {
    assert.strictEqual(column.cells.benefits, null, column.schemeId + ' benefits should be null');
  });
});

test('missing: documents is null for every real record (requiredDocuments is null)', () => {
  const columns = comparison.buildComparisonColumns(real, real.map(s => s.id), deps);
  columns.forEach(column => {
    assert.strictEqual(column.cells.documents, null, column.schemeId + ' documents should be null');
  });
});

test('missing: method is null for every real record (no applicationGuidance)', () => {
  const columns = comparison.buildComparisonColumns(real, real.map(s => s.id), deps);
  columns.forEach(column => {
    assert.strictEqual(column.cells.method, null, column.schemeId + ' method should be null');
  });
});

test('missing: availability is null for every real record', () => {
  const columns = comparison.buildComparisonColumns(real, real.map(s => s.id), deps);
  columns.forEach(column => {
    assert.strictEqual(column.cells.availability, null, column.schemeId + ' availability should be null');
  });
});

test('missing: verification is non-null for every real record (verificationStatus is set)', () => {
  const columns = comparison.buildComparisonColumns(real, real.map(s => s.id), deps);
  columns.forEach(column => {
    assert.notStrictEqual(column.cells.verification, null, column.schemeId + ' verification should be set');
  });
});

test('missing: deadline is null exactly when the record deadline is absent or empty', () => {
  const columns = comparison.buildComparisonColumns(real, real.map(s => s.id), deps);
  columns.forEach((column, index) => {
    const record = real[index];
    const raw = record.applicationDeadline;
    const empty = typeof raw !== 'string' || raw.trim() === '';
    if (empty) {
      assert.strictEqual(column.cells.deadline, null, column.schemeId + ' deadline should be null');
    } else {
      assert.notStrictEqual(column.cells.deadline, null, column.schemeId + ' deadline should be set');
    }
  });
});

// 12. Invalid ids in columns
test('invalid columns: unknown ids are skipped and a valid id still gives one column', () => {
  const ids = real.map(s => s.id);
  const columns = comparison.buildComparisonColumns(real, ['missing-id', ids[0], 'missing-id'], deps);
  assert.strictEqual(columns.length, 1);
  assert.strictEqual(columns[0].schemeId, ids[0]);
});

test('invalid columns: a non-array ids value gives []', () => {
  assert.deepStrictEqual(comparison.buildComparisonColumns(real, 'not-array', deps), []);
});

test('invalid columns: null schemes gives [] without throwing', () => {
  const ids = real.map(s => s.id);
  let result;
  assert.doesNotThrow(() => {
    result = comparison.buildComparisonColumns(null, ids, deps);
  });
  assert.deepStrictEqual(result, []);
});

test('invalid columns: an empty ids list gives []', () => {
  assert.deepStrictEqual(comparison.buildComparisonColumns(real, [], deps), []);
});

// 13. Duplicate ids in columns
test('duplicate columns: the same id twice gives one column', () => {
  const ids = real.map(s => s.id);
  const columns = comparison.buildComparisonColumns(real, [ids[0], ids[0]], deps);
  assert.strictEqual(columns.length, 1);
});

// 14. Data not mutated
test('immutability: buildComparisonColumns does not mutate the real records', () => {
  const before = JSON.parse(JSON.stringify(real));
  comparison.buildComparisonColumns(real, real.map(s => s.id), deps);
  assert.deepStrictEqual(real, before);
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
