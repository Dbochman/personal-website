import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;
let lastThemeKey = '';

function readHslVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : fallback;
}

function ensureMermaidInitialized() {
  const themeKey = [
    readHslVar('--background', '#0b0f19'),
    readHslVar('--card', '#111827'),
    readHslVar('--muted', '#111827'),
    readHslVar('--foreground', '#f9fafb'),
    readHslVar('--muted-foreground', '#9ca3af'),
    readHslVar('--border', '#1f2937'),
  ].join('|');

  if (mermaidInitialized && themeKey === lastThemeKey) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: {
      background: 'transparent',
      primaryColor: readHslVar('--muted', '#111827'),
      primaryTextColor: readHslVar('--foreground', '#f9fafb'),
      primaryBorderColor: readHslVar('--border', '#1f2937'),
      secondaryColor: readHslVar('--card', '#111827'),
      secondaryTextColor: readHslVar('--foreground', '#f9fafb'),
      tertiaryColor: readHslVar('--background', '#0b0f19'),
      lineColor: readHslVar('--muted-foreground', '#9ca3af'),
      edgeLabelBackground: readHslVar('--background', '#0b0f19'),
      fontFamily: 'inherit',
    },
  });

  mermaidInitialized = true;
  lastThemeKey = themeKey;
}

interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[:]/g, '')}`;
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const renderDiagram = async () => {
      try {
        ensureMermaidInitialized();
        const { svg: renderedSvg } = await mermaid.render(diagramId, code);
        if (!isActive) return;
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        if (!isActive) return;
        setSvg('');
        setError(err instanceof Error ? err.message : 'Unable to render diagram');
      }
    };

    renderDiagram();

    return () => {
      isActive = false;
    };
  }, [code, diagramId]);

  if (error) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto [&_svg_*]:!animate-none mermaid-scope">
      <style>{`
        .mermaid-scope .mermaid-jump {
          cursor: pointer;
        }
        .mermaid-scope .mermaid-jump rect,
        .mermaid-scope .mermaid-jump polygon,
        .mermaid-scope .mermaid-jump path {
          stroke: hsl(var(--muted-foreground));
          stroke-dasharray: 4 3;
          transition: stroke 150ms ease-out, filter 150ms ease-out;
        }
        .mermaid-scope .mermaid-jump:hover rect,
        .mermaid-scope .mermaid-jump:hover polygon,
        .mermaid-scope .mermaid-jump:hover path {
          stroke: hsl(var(--foreground) / 0.6);
          filter: drop-shadow(0 0 6px hsl(var(--foreground) / 0.1));
        }
      `}</style>
      <div
        aria-label="Mermaid diagram"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
