require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { allTopics, getTopicById } = require('../src/lib/topics.ts');
const aliases = require('../src/data/aliases.json');
const provenance = require('../MERGE_PROVENANCE.json');

test('every original topic maps to one canonical topic with retained provenance', () => {
  assert.equal(provenance.mappings.length, 125);
  assert.equal(allTopics.length, 99);
  for (const mapping of provenance.mappings) {
    const topic = getTopicById(mapping.originalId);
    assert.equal(topic.id, mapping.canonicalId);
    assert.equal(provenance.mappings.filter(source => source.originalId === mapping.originalId && source.repository === mapping.repository).length, 1);
  }
});

test('legacy aliases point directly to canonical topics and are not duplicate nodes', () => {
  for (const [alias, canonical] of Object.entries(aliases)) {
    assert.ok(!allTopics.some(topic => topic.id === alias));
    assert.ok(allTopics.some(topic => topic.id === canonical));
  }
});

test('merged topics have no duplicate references, exact code snippets, or relation IDs', () => {
  for (const topic of allTopics) {
    for (const field of ['prerequisites', 'related', 'applications', 'formulas', 'tags']) {
      assert.equal(new Set(topic[field]).size, topic[field].length, topic.id + ':' + field);
    }
    assert.equal(new Set(topic.code.map(block => block.language + ':' + block.content.trim())).size, topic.code.length);
    assert.equal(new Set(topic.references.map(ref => ref.url.replace(/\/$/, '').toLowerCase())).size, topic.references.length);
  }
});
