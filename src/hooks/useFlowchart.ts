import { useEffect, useId, useRef, useState } from 'react';
import type { Mounted } from 'pele/core';

/** Own Pele's SVG host, resize observer and font refresh lifecycle. */
export function useFlowchart(code: string) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let active = true;
    let diagram: Mounted | undefined;
    setRevision(0);
    setError(null);

    void import('@/lib/flowchart-renderer').then(({ mount, flowchartOptions }) => {
      if (!active) return;
      diagram = mount(host, code, {
        ...flowchartOptions,
        idPrefix: `flowchart-${id.replace(/:/g, '')}`,
        onRender: () => {
          if (!active) return;
          setError(null);
          setRevision(value => value + 1);
        },
        onError: (reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : 'Unable to render diagram');
        },
      });
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Unable to load diagram renderer');
    });

    return () => {
      active = false;
      diagram?.destroy();
      host.replaceChildren();
    };
  }, [code, id]);

  return { ref, revision, error };
}
