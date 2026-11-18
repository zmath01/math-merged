import { HashRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { HomePage } from './components/HomePage';
const ForceGraphView = lazy(() => import('./components/ForceGraphView').then(module => ({ default: module.ForceGraphView })));
const MindMapView = lazy(() => import('./components/MindMapView').then(module => ({ default: module.MindMapView })));
const DetailPage = lazy(() => import('./components/DetailPage').then(module => ({ default: module.DetailPage })));
const SearchPage = lazy(() => import('./components/SearchPage').then(module => ({ default: module.SearchPage })));

/**
 * Application router. Uses HashRouter to ensure deep links work on GitHub Pages.
 */
export function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<p role="status" className="p-6">Loading topics…</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/force" element={<ForceGraphView />} />
        <Route path="/mindmap" element={<MindMapView />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/topic/:id" element={<DetailPage />} />
        <Route path="*" element={<main className="p-6"><h1>Page not found</h1><a href="#/">Back home</a></main>} />
      </Routes>
      </Suspense>
    </HashRouter>
  );
}
