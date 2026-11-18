import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'force-graph';
import type ForceGraphType from 'force-graph';
import type { Topic, GraphNode, GraphLink } from '../types/topic';
import { buildGraphNodes, buildGraphLinks, domainColors, allTopics, getTopicById } from '../lib/topics';
import { NodeTooltip } from './NodeTooltip';
import { Link } from 'react-router-dom';

/**
 * Force-directed graph view inspired by the physics-based layout at wuli.wiki/tree.
 * Supports pan, zoom, hover tooltips, and click-through to detail pages.
 */
export function ForceGraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphType<GraphNode, GraphLink> | null>(null);
  const navigate = useNavigate();

  const [selectedDomain, setSelectedDomain] = useState('');
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const nodes = buildGraphNodes().filter(node => !selectedDomain || node.domain === selectedDomain);
    const ids = new Set(nodes.map(node => node.id));
    const graphData = { nodes, links: buildGraphLinks().filter(link => ids.has(link.source) && ids.has(link.target)) };
    setHoveredTopic(null);

    const graph = new ForceGraph2D<GraphNode, GraphLink>(container)
      .width(container.clientWidth || 1)
      .height(container.clientHeight || 1)
      .graphData(graphData)
      .nodeId('id')
      .nodeLabel('title')
      .nodeVal('val')
      .nodeColor('color')
      .nodeRelSize(6)
      .nodeCanvasObjectMode(() => 'after')
      .nodeCanvasObject((node, context, scale) => {
        // Label small filtered graphs immediately; avoid clutter at overview scale.
        if (nodes.length > 30 && scale < 1.5) return;
        context.save();
        context.font = `${12 / scale}px system-ui`;
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillStyle = '#0f172a';
        context.fillText(node.title, node.x ?? 0, (node.y ?? 0) + 6 * Math.sqrt(node.val) + 3 / scale);
        context.restore();
      })
      .linkDirectionalArrowLength(link => link.type === 'related' ? 0 : 6)
      .linkDirectionalArrowRelPos(1)
      .linkColor('color')
      .linkWidth(1.5)
      .backgroundColor('#f8fafc')
      .onNodeHover((node) => {
        if (node) {
          const topic = getTopicById(String(node.id));
          setHoveredTopic(topic ?? null);
        } else {
          setHoveredTopic(null);
        }
      })
      .onNodeClick((node) => {
        navigate(`/topic/${String(node.id)}`);
      })
      .onLinkHover((link) => {
        container.style.cursor = link ? 'pointer' : 'default';
      })
      .onNodeDrag((node) => {
        node.fx = node.x;
        node.fy = node.y;
      })
      .onNodeDragEnd((node) => {
        node.fx = undefined;
        node.fy = undefined;
      });

    graphRef.current = graph;

    const chargeForce = graph.d3Force('charge');
    if (chargeForce) {
      chargeForce.strength(-400);
    }
    const linkForce = graph.d3Force('link');
    if (linkForce) {
      linkForce.distance(120);
    }

    const applySize = () => {
      if (!containerRef.current || !graphRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        graphRef.current.width(w).height(h);
      }
    };

    applySize();

    const resizeObserver = new ResizeObserver(() => applySize());
    resizeObserver.observe(container);

    const fitTimer = window.setTimeout(() => {
      applySize();
      graph.zoomToFit(400, 40);
    }, 200);

    return () => {
      window.clearTimeout(fitTimer);
      resizeObserver.disconnect();
      graph._destructor();
      graphRef.current = null;
      container.replaceChildren();
    };
  }, [navigate, selectedDomain]);

  const handleZoomIn = () => { const graph = graphRef.current; if (graph) graph.zoom(graph.zoom() * 1.3, 300); };
  const handleZoomOut = () => { const graph = graphRef.current; if (graph) graph.zoom(graph.zoom() / 1.3, 300); };
  const handleReset = () => graphRef.current?.zoomToFit(400, 40);

  const uniqueDomains = Array.from(new Set(allTopics.map((t) => t.domain)));

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="flex flex-wrap gap-3 items-center justify-between px-4 py-4 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Home
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Force-Directed Graph</h1>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Domain
          <select aria-label="Filter graph by domain" value={selectedDomain} onChange={event => setSelectedDomain(event.target.value)} className="max-w-48 rounded border border-slate-200 px-2 py-1">
            <option value="">All domains</option>
            {uniqueDomains.map(domain => <option key={domain} value={domain}>{domain}</option>)}
          </select>
          <span role="status">{allTopics.filter(topic => !selectedDomain || topic.domain === selectedDomain).length} topics</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-colors"
            aria-label="Zoom out"
          >
            &minus;
          </button>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-colors"
            aria-label="Reset view"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseMove={(e) => setTooltipPos({ x: Math.max(8, Math.min(e.clientX + 16, window.innerWidth - 304)), y: Math.max(8, Math.min(e.clientY + 16, window.innerHeight - 320)) })}
        />

        {hoveredTopic && (
          <div
            className="pointer-events-none fixed z-50"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            <NodeTooltip topic={hoveredTopic} />
          </div>
        )}

        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur rounded-xl border border-slate-200 p-4 shadow-lg max-w-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Domains</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueDomains.map((domain) => (
              <div key={domain} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: domainColors[domain] ?? '#94a3b8' }}
                />
                <span className="text-xs text-slate-600">{domain}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-slate-400" />
              <span>Prerequisite</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-green-500" />
              <span>Related</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-amber-500" />
              <span>Application</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
