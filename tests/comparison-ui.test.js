// Uses a minimal in-file fake DOM. This verifies module logic and wiring only; it is NOT a browser test.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Minimal fake DOM (only what js/comparison-ui.js uses)
// ---------------------------------------------------------------------------

function notImplemented(name) {
  throw new Error('fake DOM does not implement: ' + name);
}

class FakeText {
  constructor(data) {
    this.nodeType = 3;
    this.nodeName = '#text';
    this.data = data;
    this.parentNode = null;
  }
  get textContent() {
    return this.data;
  }
}

function parseSelector(sel) {
  if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(sel)) {
    return { tag: sel.toUpperCase(), cls: null, id: null };
  }
  let m = /^([a-zA-Z][a-zA-Z0-9]*)?\.([A-Za-z0-9_-]+)$/.exec(sel);
  if (m) {
    return { tag: m[1] ? m[1].toUpperCase() : null, cls: m[2], id: null };
  }
  m = /^#([A-Za-z0-9_-]+)$/.exec(sel);
  if (m) {
    return { tag: null, cls: null, id: m[1] };
  }
  throw new Error('unsupported selector: ' + sel);
}

function collectDescendants(node, out) {
  for (const child of node.children) {
    if (child.nodeType === 1) {
      out.push(child);
      collectDescendants(child, out);
    }
  }
  return out;
}

function matches(el, p) {
  if (p.tag && el.nodeName !== p.tag) return false;
  if (p.cls && el.classes.indexOf(p.cls) === -1) return false;
  if (p.id && el.attrs.id !== p.id) return false;
  return true;
}

class FakeElement {
  constructor(tagName) {
    this.nodeName = String(tagName).toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.classes = [];
    this.listeners = {};
    this.hidden = false;
    const self = this;
    this.classList = {
      add(c) {
        if (self.classes.indexOf(c) === -1) self.classes.push(c);
      },
      contains(c) {
        return self.classes.indexOf(c) !== -1;
      },
      remove(c) {
        self.classes = self.classes.filter((x) => x !== c);
      }
    };
  }

  get className() {
    return this.classes.join(' ');
  }
  set className(value) {
    this.classes = String(value).split(/\s+/).filter(Boolean);
  }

  setAttribute(name, value) {
    this.attrs[name] = String(value);
    if (name === 'class') {
      this.classes = String(value).split(/\s+/).filter(Boolean);
    }
  }
  getAttribute(name) {
    if (name === 'class') {
      return this.classes.length ? this.classes.join(' ') : null;
    }
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  }

  _detach(node) {
    if (node.parentNode) {
      const p = node.parentNode;
      p.children.splice(p.children.indexOf(node), 1);
      node.parentNode = null;
    }
  }
  appendChild(node) {
    this._detach(node);
    node.parentNode = this;
    this.children.push(node);
    return node;
  }
  insertBefore(node, ref) {
    this._detach(node);
    if (ref === null || ref === undefined) {
      this.children.push(node);
    } else {
      const i = this.children.indexOf(ref);
      if (i === -1) throw new Error('insertBefore: reference node is not a child');
      this.children.splice(i, 0, node);
    }
    node.parentNode = this;
    return node;
  }
  removeChild(node) {
    const i = this.children.indexOf(node);
    if (i === -1) throw new Error('removeChild: node is not a child');
    this.children.splice(i, 1);
    node.parentNode = null;
    return node;
  }

  get firstChild() {
    return this.children.length ? this.children[0] : null;
  }
  get nextSibling() {
    if (!this.parentNode) return null;
    const sibs = this.parentNode.children;
    const i = sibs.indexOf(this);
    return i + 1 < sibs.length ? sibs[i + 1] : null;
  }

  get textContent() {
    let out = '';
    for (const child of this.children) {
      out += child.textContent;
    }
    return out;
  }
  set textContent(value) {
    for (const child of this.children) {
      child.parentNode = null;
    }
    this.children = [];
    if (value !== null && value !== undefined && String(value) !== '') {
      this.appendChild(new FakeText(String(value)));
    }
  }

  addEventListener(type, fn) {
    (this.listeners[type] = this.listeners[type] || []).push(fn);
  }
  click() {
    const event = { type: 'click', target: this, preventDefault() {} };
    (this.listeners.click || []).slice().forEach((fn) => fn(event));
  }

  querySelectorAll(sel) {
    const p = parseSelector(sel);
    return collectDescendants(this, []).filter((el) => matches(el, p));
  }
  querySelector(sel) {
    const found = this.querySelectorAll(sel);
    return found.length ? found[0] : null;
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement('body');
    this.readyState = 'complete';
  }
  createElement(tag) {
    return new FakeElement(tag);
  }
  getElementById(id) {
    const all = collectDescendants(this.body, []);
    for (const el of all) {
      if (el.attrs.id === id) return el;
    }
    return null;
  }
  querySelector(sel) {
    return this.body.querySelector(sel);
  }
  querySelectorAll(sel) {
    return this.body.querySelectorAll(sel);
  }
  addEventListener() {}
}

// ---------------------------------------------------------------------------
// Globals and module loading
// ---------------------------------------------------------------------------

function makeStore() {
  return {
    data: {},
    getItem(k) {
      return k in this.data ? this.data[k] : null;
    },
    setItem(k, v) {
      this.data[k] = String(v);
    },
    removeItem(k) {
      delete this.data[k];
    }
  };
}

let store = makeStore();
let fakeDoc = new FakeDocument();
const fakeWindow = { localStorage: store, location: { search: '' } };
global.window = fakeWindow;
global.document = fakeDoc;

const schemes = require('../js/schemes.js');
const selectionModel = require('../js/comparison-selection-model.js');
const comparisonModel = require('../js/comparison-model.js');
const schemeModel = require('../js/scheme-details-model.js');
const guidanceModel = require('../js/application-guidance-model.js');

fakeWindow.THUNAI_SCHEMES = schemes;
fakeWindow.THUNAI_SCHEME_MODEL = schemeModel;
fakeWindow.THUNAI_APPLICATION_GUIDANCE_MODEL = guidanceModel;
fakeWindow.THUNAI_COMPARISON_SELECTION = selectionModel;
fakeWindow.THUNAI_COMPARISON_MODEL = comparisonModel;

const realIds = schemes.map((s) => s.id);
const STORAGE_KEY = selectionModel.STORAGE_KEY;

function freshEnv() {
  store = makeStore();
  fakeWindow.localStorage = store;
  fakeDoc = new FakeDocument();
  global.document = fakeDoc;
  fakeWindow.location.search = '';
  return fakeDoc;
}

function loadUi() {
  delete require.cache[require.resolve('../js/comparison-ui.js')];
  return require('../js/comparison-ui.js');
}

function make(tag, attrs) {
  const e = fakeDoc.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
  }
  return e;
}

function buildResultsCard(doc, id) {
  const article = doc.createElement('article');
  article.setAttribute('class', 'scheme-card');
  const link = doc.createElement('a');
  link.setAttribute('class', 'scheme-details-link');
  link.setAttribute('href', 'scheme-details.html?id=' + id);
  link.textContent = 'View details';
  article.appendChild(link);
  let list = doc.getElementById('results-list');
  if (!list) {
    list = doc.createElement('div');
    list.setAttribute('id', 'results-list');
    doc.body.appendChild(list);
  }
  list.appendChild(article);
  return link;
}

function buildComparePage(doc) {
  const count = make('p', { id: 'compare-count' });
  const status = make('p', { id: 'compare-status' });
  const empty = make('section', { id: 'compare-empty', hidden: '' });
  empty.hidden = true;
  const wrap = make('div', { id: 'compare-wrap' });
  const table = make('table', { id: 'compare-table' });
  wrap.appendChild(table);
  const clear = make('button', { id: 'compare-clear', hidden: '' });
  clear.hidden = true;
  clear.textContent = 'Clear comparison';
  const clearP = make('p');
  clearP.appendChild(clear);
  [count, status, empty, wrap, clearP].forEach((n) => doc.body.appendChild(n));
}

function buildDetailsPage(doc) {
  const view = make('div', { id: 'details-view' });
  const slot = make('div', { id: 'compare-slot' });
  view.appendChild(slot);
  const title = make('h1', { id: 'details-title' });
  doc.body.appendChild(view);
  doc.body.appendChild(title);
}

// Helpers for reading the rendered DOM.
function tableOf() {
  return fakeDoc.getElementById('compare-table');
}
function headRowOf(table) {
  return table.querySelector('thead').querySelector('tr');
}
function thsOf(tr) {
  return tr.children.filter((c) => c.nodeName === 'TH');
}
function bodyRows(table) {
  return table.querySelector('tbody').children.filter((c) => c.nodeName === 'TR');
}
function rowByLabel(table, label) {
  const row = bodyRows(table).find((tr) => tr.children[0].textContent === label);
  assert.ok(row, 'no row labelled ' + label);
  return row;
}
function allElements(node, out) {
  out = out || [];
  for (const child of node.children) {
    if (child.nodeType === 1) {
      out.push(child);
      allElements(child, out);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('PASS ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL ' + name + ': ' + (e && e.message ? e.message : String(e)));
  }
}

const LIMIT_TEXT = 'You can compare up to 3 scholarships. Remove one to add another.';

// RESULTS CONTROLS

test('1. Results card gets a toggle', () => {
  freshEnv();
  const link = buildResultsCard(fakeDoc, realIds[0]);
  const api = loadUi();
  api.decorateResults(fakeDoc);
  const button = link.nextSibling;
  assert.ok(button && button.nodeName === 'BUTTON' && button.classList.contains('compare-toggle'), 'toggle button next to link');
  assert.strictEqual(button.textContent, 'Add to comparison');
  assert.strictEqual(button.getAttribute('aria-pressed'), 'false');
  const status = button.nextSibling;
  assert.ok(status && status.nodeName === 'P' && status.classList.contains('compare-status'), 'status p after button');
  assert.strictEqual(status.getAttribute('aria-live'), 'polite');
});

test('2. Toggle adds', () => {
  freshEnv();
  const link = buildResultsCard(fakeDoc, realIds[0]);
  const api = loadUi();
  api.decorateResults(fakeDoc);
  const button = link.nextSibling;
  const status = button.nextSibling;
  button.click();
  assert.deepStrictEqual(selectionModel.loadSelection(store, schemes), [realIds[0]]);
  assert.strictEqual(button.textContent, 'Remove from comparison');
  assert.strictEqual(button.getAttribute('aria-pressed'), 'true');
  assert.strictEqual(status.textContent, 'Added to comparison.');
});

test('3. Toggle removes', () => {
  freshEnv();
  const link = buildResultsCard(fakeDoc, realIds[0]);
  const api = loadUi();
  api.decorateResults(fakeDoc);
  const button = link.nextSibling;
  const status = button.nextSibling;
  button.click();
  button.click();
  assert.deepStrictEqual(selectionModel.loadSelection(store, schemes), []);
  assert.strictEqual(button.textContent, 'Add to comparison');
  assert.strictEqual(button.getAttribute('aria-pressed'), 'false');
  assert.strictEqual(status.textContent, 'Removed from comparison.');
});

test('4. decorateResults is idempotent', () => {
  freshEnv();
  buildResultsCard(fakeDoc, realIds[0]);
  const api = loadUi();
  api.decorateResults(fakeDoc);
  api.decorateResults(fakeDoc);
  const list = fakeDoc.getElementById('results-list');
  const toggles = list.querySelectorAll('.compare-toggle');
  assert.strictEqual(toggles.length, 1);
});

test('5. Invalid scheme link gets no toggle', () => {
  freshEnv();
  const link = buildResultsCard(fakeDoc, 'not-a-scheme');
  const api = loadUi();
  api.decorateResults(fakeDoc);
  const next = link.nextSibling;
  assert.ok(!(next && next.classList && next.classList.contains('compare-toggle')), 'no toggle next to invalid link');
  assert.strictEqual(fakeDoc.querySelectorAll('.compare-toggle').length, 0);
});

test('6. Toggle reflects storage on creation', () => {
  freshEnv();
  selectionModel.saveSelection(store, [realIds[1]]);
  const link = buildResultsCard(fakeDoc, realIds[1]);
  const api = loadUi();
  api.decorateResults(fakeDoc);
  const button = link.nextSibling;
  assert.strictEqual(button.textContent, 'Remove from comparison');
  assert.strictEqual(button.getAttribute('aria-pressed'), 'true');
});

// DETAILS PAGE CONTROLS

test('7. Details slot mount', () => {
  freshEnv();
  buildDetailsPage(fakeDoc);
  const slot = fakeDoc.getElementById('compare-slot');
  const api = loadUi();
  api.mountDetailsToggle(slot, schemes[0], store, schemes);
  const button = slot.children.find((c) => c.nodeName === 'BUTTON' && c.classList.contains('compare-toggle'));
  const status = slot.children.find((c) => c.nodeName === 'P' && c.classList.contains('compare-status'));
  assert.ok(button, 'toggle button in slot');
  assert.ok(status, 'status p in slot');
  button.click();
  assert.ok(selectionModel.loadSelection(store, schemes).indexOf(realIds[0]) !== -1, 'selection contains realIds[0]');
});

test('8. Details via URL', () => {
  freshEnv();
  try {
    fakeWindow.location.search = '?id=' + realIds[2];
    buildDetailsPage(fakeDoc);
    loadUi();
    const slot = fakeDoc.getElementById('compare-slot');
    const toggle = slot.querySelector('button.compare-toggle');
    assert.ok(toggle, 'compare-toggle inside #compare-slot');
    assert.ok(toggle.getAttribute('aria-label').indexOf(schemes[2].name) !== -1, 'aria-label includes scheme name');
  } finally {
    fakeWindow.location.search = '';
  }
});

// COMPARISON PAGE RENDERING

test('9. Empty state on load', () => {
  freshEnv();
  buildComparePage(fakeDoc);
  loadUi();
  assert.strictEqual(fakeDoc.getElementById('compare-count').textContent, 'No scholarships selected for comparison.');
  assert.strictEqual(fakeDoc.getElementById('compare-empty').hidden, false);
  assert.strictEqual(fakeDoc.getElementById('compare-wrap').hidden, true);
  assert.strictEqual(fakeDoc.getElementById('compare-clear').hidden, true);
  assert.strictEqual(tableOf().children.length, 0);
});

test('10. Renders selected schemes', () => {
  freshEnv();
  selectionModel.saveSelection(store, [realIds[0], realIds[1]]);
  buildComparePage(fakeDoc);
  loadUi();
  assert.strictEqual(fakeDoc.getElementById('compare-count').textContent, '2 scholarships selected for comparison');
  assert.strictEqual(fakeDoc.getElementById('compare-empty').hidden, true);
  assert.strictEqual(fakeDoc.getElementById('compare-wrap').hidden, false);
  assert.strictEqual(fakeDoc.getElementById('compare-clear').hidden, false);
  const ths = thsOf(headRowOf(tableOf()));
  assert.strictEqual(ths.length, 3, 'corner + 2 scheme columns');
  assert.strictEqual(ths[0].textContent, 'Criterion');
  assert.ok(ths[1].textContent.indexOf(schemes[0].name) !== -1, 'first scheme header');
  assert.ok(ths[2].textContent.indexOf(schemes[1].name) !== -1, 'second scheme header');
  [1, 2].forEach((i) => {
    const id = i === 1 ? realIds[0] : realIds[1];
    assert.ok(ths[i].querySelector('button.compare-remove'), 'remove button in scheme header');
    const a = ths[i].querySelector('a');
    assert.ok(a, 'details link in scheme header');
    assert.strictEqual(a.getAttribute('href'), 'scheme-details.html?id=' + encodeURIComponent(id));
  });
});

test('11. Row labels in order', () => {
  freshEnv();
  selectionModel.saveSelection(store, [realIds[0], realIds[1]]);
  buildComparePage(fakeDoc);
  loadUi();
  const expected = [
    'Scheme name', 'Description', 'Provider', 'Target category', 'Education level',
    'Course eligibility', 'Family income criteria', 'Institution requirements',
    'Application method', 'Benefits', 'Required documents', 'Application deadline',
    'Verification status', 'Application availability'
  ];
  const rows = bodyRows(tableOf());
  assert.strictEqual(rows.length, expected.length, 'one TR per row');
  rows.forEach((tr, i) => {
    const first = tr.children[0];
    assert.strictEqual(first.nodeName, 'TH');
    assert.strictEqual(first.getAttribute('scope'), 'row');
    assert.strictEqual(first.textContent, expected[i]);
    assert.strictEqual(tr.children.length, 3, 'header + 2 cells');
  });
});

test('12. Removing one scheme', () => {
  freshEnv();
  selectionModel.saveSelection(store, [realIds[0], realIds[1], realIds[2]]);
  buildComparePage(fakeDoc);
  loadUi();
  const ths = thsOf(headRowOf(tableOf()));
  ths[1].querySelector('button.compare-remove').click();
  assert.deepStrictEqual(selectionModel.loadSelection(store, schemes), [realIds[1], realIds[2]]);
  assert.strictEqual(fakeDoc.getElementById('compare-count').textContent, '2 scholarships selected for comparison');
  assert.strictEqual(thsOf(headRowOf(tableOf())).length, 3);
  assert.strictEqual(fakeDoc.getElementById('compare-status').textContent, 'Removed from comparison.');
});

test('13. Removing the last scheme shows empty state', () => {
  freshEnv();
  selectionModel.saveSelection(store, [realIds[0]]);
  buildComparePage(fakeDoc);
  loadUi();
  const ths = thsOf(headRowOf(tableOf()));
  ths[1].querySelector('button.compare-remove').click();
  assert.deepStrictEqual(selectionModel.loadSelection(store, schemes), []);
  assert.strictEqual(fakeDoc.getElementById('compare-empty').hidden, false);
  assert.strictEqual(fakeDoc.getElementById('compare-wrap').hidden, true);
  assert.strictEqual(fakeDoc.getElementById('compare-clear').hidden, true);
  assert.strictEqual(fakeDoc.getElementById('compare-count').textContent, 'No scholarships selected for comparison.');
});

test('14. Clear all', () => {
  freshEnv();
  selectionModel.saveSelection(store, [realIds[0], realIds[1], realIds[2]]);
  buildComparePage(fakeDoc);
  loadUi();
  fakeDoc.getElementById('compare-clear').click();
  assert.deepStrictEqual(selectionModel.loadSelection(store, schemes), []);
  assert.deepStrictEqual(JSON.parse(store.data[STORAGE_KEY]), []);
  assert.strictEqual(fakeDoc.getElementById('compare-empty').hidden, false);
  assert.strictEqual(fakeDoc.getElementById('compare-status').textContent, 'Comparison cleared.');
  assert.strictEqual(fakeDoc.getElementById('compare-count').textContent, 'No scholarships selected for comparison.');
});

test('15. Maximum three message', () => {
  freshEnv();
  const three = [realIds[0], realIds[1], realIds[2]];
  selectionModel.saveSelection(store, three);
  const link = buildResultsCard(fakeDoc, realIds[3]);
  const api = loadUi();
  api.decorateResults(fakeDoc);
  const button = link.nextSibling;
  const status = button.nextSibling;
  button.click();
  assert.deepStrictEqual(selectionModel.loadSelection(store, schemes), three);
  assert.strictEqual(selectionModel.LIMIT_TEXT, LIMIT_TEXT);
  assert.strictEqual(status.textContent, LIMIT_TEXT);
  assert.strictEqual(button.textContent, 'Add to comparison');
});

test('16. Maximum three on the page', () => {
  freshEnv();
  selectionModel.saveSelection(store, [realIds[0], realIds[1], realIds[2]]);
  buildComparePage(fakeDoc);
  loadUi();
  assert.strictEqual(fakeDoc.getElementById('compare-count').textContent, '3 scholarships selected for comparison');
  assert.strictEqual(thsOf(headRowOf(tableOf())).length, 4, 'corner + 3');
});

test('17. Duplicates on the page', () => {
  freshEnv();
  store.setItem(STORAGE_KEY, JSON.stringify([realIds[0], realIds[0], realIds[1]]));
  buildComparePage(fakeDoc);
  loadUi();
  assert.strictEqual(thsOf(headRowOf(tableOf())).length, 3, 'corner + 2');
  assert.strictEqual(fakeDoc.getElementById('compare-count').textContent, '2 scholarships selected for comparison');
});

test('18. Corrupt storage on page', () => {
  freshEnv();
  store.setItem(STORAGE_KEY, '{not json');
  buildComparePage(fakeDoc);
  loadUi();
  assert.strictEqual(fakeDoc.getElementById('compare-empty').hidden, false);
  assert.strictEqual(fakeDoc.getElementById('compare-count').textContent, 'No scholarships selected for comparison.');
});

test('19. Storage that throws', () => {
  freshEnv();
  const link = buildResultsCard(fakeDoc, realIds[0]);
  fakeWindow.localStorage = {
    getItem() { throw new Error('x'); },
    setItem() { throw new Error('x'); },
    removeItem() { throw new Error('x'); }
  };
  try {
    const api = loadUi();
    api.decorateResults(fakeDoc);
    const button = link.nextSibling;
    const status = button.nextSibling;
    assert.doesNotThrow(() => button.click());
    assert.strictEqual(status.textContent, 'Could not save your comparison in this browser.');
  } finally {
    fakeWindow.localStorage = makeStore();
    store = fakeWindow.localStorage;
  }
});

test('20. Invalid id in storage on page', () => {
  freshEnv();
  store.setItem(STORAGE_KEY, JSON.stringify(['missing-id', realIds[0]]));
  buildComparePage(fakeDoc);
  loadUi();
  const ths = thsOf(headRowOf(tableOf()));
  assert.strictEqual(ths.length, 2, 'corner + 1 scheme column');
});

// MISSING INFORMATION (real records)

test('21. Records without data show Not yet confirmed', () => {
  const labels = ['Benefits', 'Required documents', 'Application method', 'Application availability'];
  schemes.forEach((scheme) => {
    freshEnv();
    selectionModel.saveSelection(store, [scheme.id]);
    buildComparePage(fakeDoc);
    loadUi();
    labels.forEach((label) => {
      const cell = rowByLabel(tableOf(), label).children[1];
      assert.strictEqual(cell.nodeName, 'TD', scheme.id + ' ' + label + ' is a TD');
      assert.strictEqual(cell.firstChild.nodeName, 'SPAN', scheme.id + ' ' + label + ' first child is a SPAN');
      assert.strictEqual(cell.firstChild.className, 'not-confirmed', scheme.id + ' ' + label + ' span has not-confirmed class');
      assert.strictEqual(cell.textContent, 'Not yet confirmed');
    });
  });
});

test('22. Deadline row matches the record', () => {
  schemes.forEach((scheme) => {
    freshEnv();
    selectionModel.saveSelection(store, [scheme.id]);
    buildComparePage(fakeDoc);
    loadUi();
    const view = schemeModel.buildDetailsView(scheme);
    const cell = rowByLabel(tableOf(), 'Application deadline').children[1];
    if (view.applicationDeadline === null) {
      assert.strictEqual(cell.nodeName, 'TD', scheme.id + ' deadline is a TD');
      assert.strictEqual(cell.firstChild.nodeName, 'SPAN', scheme.id + ' deadline first child is a SPAN');
      assert.strictEqual(cell.firstChild.className, 'not-confirmed', scheme.id + ' deadline span has not-confirmed class');
      assert.strictEqual(cell.textContent, 'Not yet confirmed');
    } else {
      assert.strictEqual(cell.textContent, view.applicationDeadline, scheme.id + ' deadline text');
    }
  });
});

test('23. Verification row shows the record label', () => {
  schemes.forEach((scheme) => {
    freshEnv();
    selectionModel.saveSelection(store, [scheme.id]);
    buildComparePage(fakeDoc);
    loadUi();
    const view = schemeModel.buildDetailsView(scheme);
    const cell = rowByLabel(tableOf(), 'Verification status').children[1];
    const expected = view.verificationLabel !== null && view.verificationLabel !== undefined
      ? view.verificationLabel
      : 'Not yet confirmed';
    assert.strictEqual(cell.textContent, expected, scheme.id + ' verification text');
  });
});

test('24. No invented values at module level', () => {
  const deps = {
    buildDetailsView: schemeModel.buildDetailsView,
    buildGuidanceView: guidanceModel.buildGuidanceView,
    AVAILABILITY_UNKNOWN_TEXT: guidanceModel.AVAILABILITY_UNKNOWN_TEXT
  };
  const columns = comparisonModel.buildComparisonColumns([schemes[0]], [schemes[0].id], deps);
  const cells = columns[0].cells;
  assert.strictEqual(cells.benefits, null);
  assert.strictEqual(cells.documents, null);
  assert.strictEqual(cells.method, null);
  assert.strictEqual(cells.availability, null);
});

// SAFE DISPLAY

test('25. Text is never parsed as HTML', () => {
  freshEnv();
  const fixture = { id: 'xss-test', name: '<img src=x onerror=alert(1)>', description: 'plain', rules: [] };
  try {
    fakeWindow.THUNAI_SCHEMES = schemes.concat([fixture]);
    selectionModel.saveSelection(store, ['xss-test']);
    buildComparePage(fakeDoc);
    loadUi();
    const table = tableOf();
    const ths = thsOf(headRowOf(table));
    assert.ok(ths[1].textContent.indexOf('<img src=x onerror=alert(1)>') !== -1, 'name shown as text');
    const imgs = allElements(table).filter((el) => el.nodeName === 'IMG');
    assert.strictEqual(imgs.length, 0, 'no IMG element created');
  } finally {
    fakeWindow.THUNAI_SCHEMES = schemes;
  }
});

// SCRIPT LOADING ORDER AND ELEMENT AVAILABILITY

const root = path.join(__dirname, '..');

function readRoot(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function scriptsOf(file) {
  const text = readRoot(file);
  const re = /<script\s+src="([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function assertBefore(list, later, earlier) {
  const i = list.indexOf(later);
  const j = list.indexOf(earlier);
  assert.ok(i !== -1, later + ' is referenced');
  assert.ok(j !== -1, earlier + ' is referenced');
  assert.ok(i > j, later + ' must load after ' + earlier);
}

test('26. scriptsOf returns script src values in order', () => {
  const list = scriptsOf('comparison.html');
  assert.ok(Array.isArray(list));
  assert.ok(list.length > 0, 'comparison.html has script src tags');
});

test('27. comparison.html loads comparison-ui.js last among its dependencies', () => {
  const list = scriptsOf('comparison.html');
  ['js/schemes.js', 'js/scheme-details-model.js', 'js/application-guidance-model.js',
    'js/comparison-selection-model.js', 'js/comparison-model.js'].forEach((dep) => {
    assertBefore(list, 'js/comparison-ui.js', dep);
  });
});

test('28. results.html loads comparison-ui.js after selection model and schemes', () => {
  const list = scriptsOf('results.html');
  assertBefore(list, 'js/comparison-ui.js', 'js/comparison-selection-model.js');
  assertBefore(list, 'js/comparison-ui.js', 'js/schemes.js');
});

test('29. scheme-details.html loads comparison-ui.js after its dependencies', () => {
  const list = scriptsOf('scheme-details.html');
  ['js/comparison-selection-model.js', 'js/comparison-model.js',
    'js/scheme-details-model.js', 'js/application-guidance-model.js'].forEach((dep) => {
    assertBefore(list, 'js/comparison-ui.js', dep);
  });
});

test('30. Every script src referenced by the three pages exists on disk', () => {
  ['comparison.html', 'results.html', 'scheme-details.html'].forEach((file) => {
    scriptsOf(file).forEach((src) => {
      assert.ok(fs.existsSync(path.join(root, src)), file + ' references missing ' + src);
    });
  });
});

test('31. comparison.html contains the compare page ids', () => {
  const text = readRoot('comparison.html');
  ['compare-count', 'compare-status', 'compare-empty', 'compare-wrap', 'compare-table', 'compare-clear'].forEach((id) => {
    assert.ok(text.indexOf('id="' + id + '"') !== -1, 'missing id ' + id);
  });
});

test('32. scheme-details.html has compare-slot after details-view', () => {
  const text = readRoot('scheme-details.html');
  const slot = text.indexOf('id="compare-slot"');
  const view = text.indexOf('id="details-view"');
  assert.ok(slot !== -1, 'compare-slot present');
  assert.ok(view !== -1, 'details-view present');
  assert.ok(slot > view, 'compare-slot appears after details-view');
});

test('33. results.html links to comparison.html and results.js uses scheme-details-link', () => {
  assert.ok(readRoot('results.html').indexOf('href="comparison.html"') !== -1, 'results.html links to comparison.html');
  assert.ok(readRoot(path.join('js', 'results.js')).indexOf('scheme-details-link') !== -1, 'results.js uses scheme-details-link');
});

console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exitCode = 1;
}
