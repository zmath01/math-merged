# Math Merged

One mathematics knowledge graph combining
[math-graph](https://github.com/zmath01/math-graph) and
[math-knowledge-graph](https://github.com/zmath01/math-knowledge-graph).
The two source repositories remain available and receive their own bug fixes.

The merged catalog contains **99 canonical topics across 13 domains**. It
consolidates **125 source topic records**, collapsing 26 duplicate topic records
and retaining complementary formulas, code examples, key points, and references.
Calculus, quantitative finance, tensors, inference, stochastic processes, and
numerical linear algebra are retained alongside the broader scientific-computing,
ML, algorithms, and HPC catalog.

## Run locally

Requires Node.js 22. Python 3 is optional for snippet syntax tests.

```sh
npm ci
npm test
npm run lint
npm run dev
```

Build and preview:

```sh
npm run build
npm run preview
```

The generated `dist/` folder is a standalone static site. Serve it with an HTTP
server; opening `index.html` with `file://` does not support ES modules. The
relative Vite base and hash routes work under a GitHub Pages project prefix.
MathJax, graph libraries, and syntax highlighting are included in the build;
normal topic rendering does not require a CDN connection.

## Views

- `#/force`: force-directed graph with typed relationships and relative zoom.
- `#/mindmap`: collapsible, cycle-safe prerequisite tree grouped by domain.
- `#/search`: case-insensitive search over titles, descriptions, tags, key points,
  formulas, and domain names.
- `#/topic/:id`: wiki-style details, formulas, examples, references, and related topics.

The mindmap includes every canonical topic exactly once. Domain grouping nodes
are separate from topic nodes, so topics with prerequisites in another domain
are not dropped. Force-graph links deduplicate undirected `related` edges while
preserving the meaning and direction of prerequisite and application edges.

## Catalog and provenance

- `src/data/topics.json` is the single canonical content catalog.
- `src/data/aliases.json` maps 25 retired source IDs to canonical IDs; old IDs
  work in `#/topic/:id` links without creating duplicate graph nodes.
- `MERGE_PROVENANCE.json` records every original repository/topic ID and the
  source revision inspected. The targeted content corrections were applied
  before consolidation; the source revisions identify the reviewed baselines.
- `src/data/topics.ts` is a typed import of the JSON catalog, not another copy.

Merged overview topics retain their specialized child topics; for example,
linear/logistic regression is one combined topic, while Newton's method,
stochastic gradient descent, and convex optimization remain distinct subjects.
This avoids collapsing topics merely because their titles share keywords.

See [CORRECTIONS.md](CORRECTIONS.md) for mathematical and code-example fixes,
and [VALIDATION.md](VALIDATION.md) for executed checks and performance evidence.

## GitHub Actions and Pages

CI runs tests, lint, and a production build on pushes and pull requests. The
**Deploy Math Merged to GitHub Pages** workflow deploys pushes to `main` after
its tests, lint, and build pass. It can also be started manually from Actions.
Pages uses **Settings → Pages → Source → GitHub Actions**.

Site: [Math Merged](https://zmath01.github.io/math-merged/).
Check the deployment workflow's result for the status of a specific revision.

## License

MIT, copyright 2026 zmath01. Both original MIT notices are identical and are
preserved in [LICENSE](LICENSE). Generated MathJax assets include its Apache 2.0
license alongside the bundle.
