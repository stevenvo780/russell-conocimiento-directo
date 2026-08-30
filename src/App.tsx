import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

const PresentationPage = lazy(() => import('./pages/PresentationPage').then((module) => ({ default: module.PresentationPage })));
const SourcesPage = lazy(() => import('./pages/SourcesPage').then((module) => ({ default: module.SourcesPage })));

type Theme = 'dark' | 'light';

const PUBLIC_ORIGIN = 'https://stevenvo780.github.io/russell-conocimiento-directo';
const routeMetadata: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'La arquitectura de lo ausente — Bertrand Russell',
    description: 'Exposición interactiva sobre conocimiento directo y conocimiento por referencia en Bertrand Russell.',
  },
  '/presentacion': {
    title: 'Presentación — La arquitectura de lo ausente',
    description: 'Presentación visual de 14 diapositivas sobre el capítulo 5 de Los problemas de la filosofía.',
  },
  '/fuentes': {
    title: 'Fuentes — La arquitectura de lo ausente',
    description: 'Fuente primaria, criterio editorial y guion Markdown de la exposición sobre Bertrand Russell.',
  },
};

function detectTheme(): Theme {
  const saved = window.localStorage.getItem('russell-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark';
}

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hashTarget = window.location.hash
        ? document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        : null;
      if (hashTarget) hashTarget.scrollIntoView({ block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    });
    const routePath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const metadata = routeMetadata[routePath] ?? routeMetadata['/'];
    const canonicalUrl = routePath === '/' ? `${PUBLIC_ORIGIN}/` : `${PUBLIC_ORIGIN}${routePath}`;
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', metadata.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', metadata.description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(detectTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('russell-theme', theme);
  }, [theme]);

  return (
    <>
      <ScrollReset />
      <Suspense fallback={<div className="route-loading" role="status">Cargando…</div>}>
        <Routes>
          <Route path="/" element={<HomePage theme={theme} onTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />} />
          <Route path="/presentacion" element={<PresentationPage />} />
          <Route path="/fuentes" element={<SourcesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
