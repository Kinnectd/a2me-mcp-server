import { StrictMode, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from './openai.js';
import './theme.css';

function Shell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return <div className="a2me-root">{children}</div>;
}

/** Mounts a widget component into the iframe's #root, wrapped with theme handling. */
export function mountWidget(node: ReactNode): void {
  const el = document.getElementById('root');
  if (!el) throw new Error('a2me widget: #root not found');
  createRoot(el).render(
    <StrictMode>
      <Shell>{node}</Shell>
    </StrictMode>,
  );
}
