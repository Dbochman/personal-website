import { useFlowchart } from '@/hooks/useFlowchart';

// Preserve the content-facing name: the source language is still Mermaid.
export function MermaidDiagram({ code }: { code: string }) {
  const { ref, revision, error } = useFlowchart(code);
  return (
    <div className="site-flowchart w-full min-w-0 overflow-x-auto">
      {error ? <p role="alert">{error}</p> : !revision && <p>Rendering diagram...</p>}
      <div ref={ref} aria-label="Mermaid diagram" hidden={!!error} />
    </div>
  );
}
