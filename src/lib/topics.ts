import type { Topic, GraphNode, GraphLink, TreeNode } from '../types/topic';
import { topics } from '../data/topics.ts';
import aliases from '../data/aliases.json';

/**
 * Domain color palette used consistently across visualizations.
 */
export const domainColors: Record<string, string> = {
  'Calculus & Analysis': '#2563eb',
  'Quantitative Finance': '#0891b2',
  'Linear Algebra': '#3b82f6',
  'Probability & Statistics': '#10b981',
  'Differential Equations': '#f59e0b',
  'Mathematical Physics': '#8b5cf6',
  'Scientific Computing': '#06b6d4',
  'Machine Learning': '#ec4899',
  'Deep Learning': '#ef4444',
  'Transformers': '#f97316',
  'Optimization': '#6366f1',
  'Algorithm Optimization': '#14b8a6',
  'HPC': '#64748b',
};

/**
 * Difficulty drives node size in the force graph.
 */
const difficultyValue: Record<string, number> = {
  beginner: 6,
  intermediate: 9,
  advanced: 12,
};

/**
 * All topics loaded from the curated data module.
 */
export const allTopics = topics;

/**
 * Index topics by ID for fast lookup.
 */
export const topicMap: Map<string, Topic> = new Map(
  allTopics.map((topic) => [topic.id, topic])
);

/**
 * Build force-graph nodes from the topic list.
 */
export function buildGraphNodes(): GraphNode[] {
  return allTopics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    domain: topic.domain,
    difficulty: topic.difficulty,
    val: difficultyValue[topic.difficulty],
    color: domainColors[topic.domain] ?? '#94a3b8',
    description: topic.summary,
  }));
}

/**
 * Build force-graph links from prerequisites, related, and applications.
 */
export function validateTopics(catalog: readonly Topic[] = allTopics): void {
  const ids = new Set<string>();
  if (!catalog.length) throw new Error('Topic catalog is empty');
  for (const topic of catalog) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.id) || topic.id === 'root' || ids.has(topic.id)) {
      throw new Error(`Invalid or duplicate topic ID: ${topic.id}`);
    }
    ids.add(topic.id);
  }
  for (const topic of catalog) {
    for (const field of ['prerequisites', 'related', 'applications'] as const) {
      for (const id of topic[field]) {
        if (!ids.has(id) || id === topic.id) throw new Error(`Invalid ${field}: ${topic.id} -> ${id}`);
      }
    }
  }
}

export function buildGraphLinks(catalog: readonly Topic[] = allTopics): GraphLink[] {
  validateTopics(catalog);
  const links = new Map<string, GraphLink>();
  const types = { prerequisites: 'prerequisite', related: 'related', applications: 'application' } as const;
  const colors = { prerequisite: '#64748b', related: '#22c55e', application: '#f59e0b' };
  for (const topic of catalog) {
    for (const field of ['prerequisites', 'related', 'applications'] as const) {
      const type = types[field];
      for (const id of topic[field]) {
        let source = field === 'prerequisites' ? id : topic.id;
        let target = field === 'prerequisites' ? topic.id : id;
        if (type === 'related' && source > target) [source, target] = [target, source];
        links.set(`${type}:${source}:${target}`, { source, target, type, color: colors[type] });
      }
    }
  }
  return [...links.values()];
}

/** Group every topic exactly once, nesting under a same-domain prerequisite.
 * Cycles in the graph become domain-level siblings in this tree projection. */
export function buildTreeData(catalog: readonly Topic[] = allTopics): TreeNode {
  validateTopics(catalog);
  const root: TreeNode = { id: 'root', name: 'Math Graph', domain: 'Root', difficulty: 'beginner', children: [] };
  const groups = new Map<string, TreeNode>();
  const nodes = new Map(catalog.map(topic => [topic.id, {
    id: topic.id, name: topic.title, domain: topic.domain, difficulty: topic.difficulty,
  } as TreeNode]));
  const parents = new Map<string, string>();
  for (const topic of catalog) {
    if (!groups.has(topic.domain)) groups.set(topic.domain, {
      id: `domain:${topic.domain}`, name: topic.domain, domain: topic.domain, difficulty: 'beginner', children: [],
    });
    const parent = topic.prerequisites.find(id => nodes.get(id)?.domain === topic.domain);
    if (parent) {
      let ancestor: string | undefined = parent;
      while (ancestor && ancestor !== topic.id) ancestor = parents.get(ancestor);
      if (!ancestor) parents.set(topic.id, parent);
    }
  }
  for (const topic of catalog) {
    const parentId = parents.get(topic.id);
    const parent = (parentId ? nodes.get(parentId) : groups.get(topic.domain))!;
    (parent.children ??= []).push(nodes.get(topic.id)!);
  }
  root.children = [...groups.values()];
  return root;
}

/**
 * Lookup a topic by its ID.
 */
export function getTopicById(id: string): Topic | undefined {
  return topicMap.get(aliases[id as keyof typeof aliases] ?? id);
}

/**
 * Search topics by title, summary, tags, or domain.
 */
const searchIndex = allTopics.map(topic => ({
  topic,
  text: [topic.title, topic.summary, topic.domain, ...topic.tags, ...topic.keyPoints, ...topic.formulas].join(' ').toLowerCase(),
}));

export function searchTopics(query: string): Topic[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return allTopics;
  return searchIndex.filter(entry => terms.every(term => entry.text.includes(term))).map(entry => entry.topic);
}

/**
 * Return the English display label for a relationship type.
 */
export function linkTypeLabel(type: GraphLink['type']): string {
  switch (type) {
    case 'prerequisite':
      return 'Prerequisite';
    case 'related':
      return 'Related';
    case 'application':
      return 'Application';
    default:
      return 'Link';
  }
}
