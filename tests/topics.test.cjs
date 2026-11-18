const { test } = require('node:test');
const assert = require('node:assert/strict');
require('./register.cjs');
const { allTopics, validateTopics, buildGraphLinks, buildTreeData, searchTopics } = require('../src/lib/topics.ts');

test('catalog has unique IDs, valid references, and no self references', () => {
  validateTopics();
  assert.equal(new Set(allTopics.map(t => t.id)).size, allTopics.length);
});

test('mindmap contains every topic exactly once, including domains with no root topic', () => {
  function visit(node, ids = []) {
    ids.push(node.id);
    for (const child of node.children || []) visit(child, ids);
    return ids;
  }
  const root = buildTreeData();
  const ids = visit(root).filter(id => id !== 'root' && !id.startsWith('domain:'));
  assert.deepEqual([...ids].sort(), allTopics.map(t => t.id).sort());
  assert.equal(root.children.length, new Set(allTopics.map(t => t.domain)).size);
});

const fixture = (id, prerequisites = [], related = [], applications = [], domain = 'Test') => ({
  ...allTopics[0], id, title: id, prerequisites, related, applications, domain,
});

test('cyclic prerequisites still produce a finite tree containing each topic once', () => {
  const root = buildTreeData([fixture('alpha', ['beta']), fixture('beta', ['alpha']), fixture('gamma', [], [], [], 'Other')]);
  const text = JSON.stringify(root);
  for (const id of ['alpha', 'beta', 'gamma']) assert.equal((text.match(new RegExp(`"id":"${id}"`, 'g')) || []).length, 1);
});

test('reciprocal related edges are deduplicated while directional relationships survive', () => {
  const links = buildGraphLinks([
    fixture('alpha', [], ['beta'], ['beta']),
    fixture('beta', ['alpha'], ['alpha']),
  ]);
  assert.equal(links.length, 3);
  assert.equal(links.filter(link => link.type === 'related').length, 1);
  assert.ok(links.some(link => link.source === 'alpha' && link.target === 'beta' && link.type === 'prerequisite'));
});

test('invalid data is rejected before graph rendering', () => {
  for (const catalog of [[], [fixture('alpha'), fixture('alpha')], [fixture('alpha', ['missing'])], [fixture('alpha', ['alpha'])]]) {
    assert.throws(() => validateTopics(catalog));
  }
});

test('search normalizes case, whitespace, and matches multiple terms', () => {
  assert.deepEqual(searchTopics('   '), allTopics);
  assert.deepEqual(searchTopics('MATRIX'), searchTopics(' matrix '));
  assert.ok(searchTopics('gradient descent').length > 0);
  assert.equal(searchTopics('no-such-topic-918273').length, 0);
});

test('all formulas compile with the MathJax TeX parser', () => {
  const { mathjax } = require('mathjax-full/js/mathjax.js');
  const { TeX } = require('mathjax-full/js/input/tex.js');
  const { SVG } = require('mathjax-full/js/output/svg.js');
  const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
  const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
  const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js');
  RegisterHTMLHandler(liteAdaptor());
  const errors = [];
  const document = mathjax.document('', { InputJax: new TeX({ packages: AllPackages,
    formatError: (jax, error) => { errors.push(error.message); return jax.formatError(error); },
  }), OutputJax: new SVG() });
  for (const topic of allTopics) for (const formula of topic.formulas) {
    document.convert(formula, { display: true });
    assert.deepEqual(errors, [], topic.id);
  }
});

test('Python examples are valid standalone Python syntax', context => {
  const { spawnSync } = require('node:child_process');
  const examples = allTopics.flatMap(topic => topic.code.filter(block => block.language === 'python').map(block => ({ id: topic.id, code: block.content })));
  const result = spawnSync('python3', ['-c', 'import ast,json,sys\nfor item in json.load(sys.stdin):\n try: ast.parse(item["code"])\n except SyntaxError as e: raise RuntimeError(item["id"]+": "+str(e))'], { input: JSON.stringify(examples), encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') return context.skip('Python 3 is not installed');
  assert.equal(result.status, 0, result.stderr);
});
