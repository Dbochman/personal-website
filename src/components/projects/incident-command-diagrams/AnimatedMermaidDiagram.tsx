/**
 * Animated Mermaid Diagram
 * - Renders Mermaid flowchart then animates through nodes
 * - Supports auto-play with configurable speed
 * - Pauses at decision nodes with slow pulse effect
 * - Spotlight effect highlights current node
 */
import { useEffect, useId, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, SkipForward, SkipBack, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Mermaid } from 'mermaid';

export interface AnimationNode {
  id: string;
  label: string;
  description: string;
  type?: 'decision' | 'link';
  /** Branch options for decision nodes: [label, targetNodeIndex] */
  branches?: [[string, number], [string, number]];
  /** Target diagram ID for link nodes (e.g., 'incident-management') */
  linkTo?: string;
}

// Lazy-load mermaid
let mermaidInstance: Mermaid | null = null;
let mermaidPromise: Promise<Mermaid> | null = null;
let lastThemeKey = '';

function readHslVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : fallback;
}

async function getMermaid(): Promise<Mermaid> {
  if (mermaidInstance) return mermaidInstance;
  if (mermaidPromise) return mermaidPromise;

  mermaidPromise = import('mermaid').then((mod) => {
    mermaidInstance = mod.default;
    return mermaidInstance;
  });

  return mermaidPromise;
}

async function ensureMermaidInitialized(): Promise<Mermaid> {
  const mermaid = await getMermaid();

  const themeKey = [
    readHslVar('--background', '#0b0f19'),
    readHslVar('--card', '#111827'),
    readHslVar('--muted', '#111827'),
    readHslVar('--foreground', '#f9fafb'),
    readHslVar('--muted-foreground', '#9ca3af'),
    readHslVar('--border', '#1f2937'),
  ].join('|');

  if (lastThemeKey !== themeKey) {
    mermaid.initialize({
      startOnLoad: false,
      // SECURITY: Using 'strict' mode for XSS protection.
      // Node ID querying (line ~151) uses developer-controlled IDs, not user input.
      // Diagram code is hardcoded, not user-provided, so strict mode is safe.
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
    lastThemeKey = themeKey;
  }

  return mermaid;
}

interface AnimatedMermaidDiagramProps {
  code: string;
  /** Ordered node sequence for animation */
  nodes: AnimationNode[];
  /** Animation interval in ms (default: 1500) */
  speed?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback when a link node is clicked */
  onLinkClick?: (linkTo: string) => void;
}

export function AnimatedMermaidDiagram({
  code,
  nodes,
  speed = 1500,
  onComplete,
  onLinkClick,
}: AnimatedMermaidDiagramProps) {
  const rawId = useId();
  const diagramId = `mermaid-anim-${rawId.replace(/[:]/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);

  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [awaitingDecision, setAwaitingDecision] = useState(false);

  // Render Mermaid diagram
  useEffect(() => {
    let isActive = true;

    const renderDiagram = async () => {
      try {
        const mermaid = await ensureMermaidInitialized();
        if (!isActive) return;
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

  // Apply highlight styles to SVG nodes and scroll active node into view
  useEffect(() => {
    if (!containerRef.current || !svg || nodes.length === 0) return;

    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    let activeNodeElement: Element | null = null;

    // Reset all nodes
    nodes.forEach((node, nodeIndex) => {
      // Mermaid generates IDs like flowchart-A-0
      const nodeGroup = svgElement.querySelector(`[id*="flowchart-${node.id}-"]`);
      if (nodeGroup) {
        nodeGroup.classList.remove('node-active', 'node-past', 'node-future', 'node-decision', 'node-link');

        if (currentIndex === -1) {
          nodeGroup.classList.add('node-future');
        } else if (nodeIndex === currentIndex) {
          nodeGroup.classList.add('node-active');
          activeNodeElement = nodeGroup;
          if (node.type === 'decision') {
            nodeGroup.classList.add('node-decision');
          } else if (node.type === 'link') {
            nodeGroup.classList.add('node-link');
          }
        } else if (nodeIndex < currentIndex) {
          nodeGroup.classList.add('node-past');
        } else {
          nodeGroup.classList.add('node-future');
        }
      }
    });

    // Scroll active node to center of view
    if (activeNodeElement && currentIndex >= 0) {
      (activeNodeElement as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [svg, nodes, currentIndex]);

  // Animation timer
  useEffect(() => {
    if (!isPlaying || awaitingDecision || nodes.length === 0) return;

    const currentNode = currentIndex >= 0 ? nodes[currentIndex] : null;
    const isDecision = currentNode?.type === 'decision';

    // Use longer pause for decision nodes (10s slow pulse effect)
    const interval = isDecision ? 10000 : speed;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;

        if (nextIndex >= nodes.length) {
          setIsPlaying(false);
          onComplete?.();
          return prev;
        }

        // Check if next node is a decision or link - pause for user interaction
        const nextNode = nodes[nextIndex];
        if (nextNode?.type === 'decision' || nextNode?.type === 'link') {
          setAwaitingDecision(true);
          setIsPlaying(false);
        }

        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, awaitingDecision, nodes, speed, currentIndex, onComplete]);

  const start = useCallback(() => {
    if (currentIndex === -1 || currentIndex >= nodes.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
    setAwaitingDecision(false);
  }, [currentIndex, nodes.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setCurrentIndex(-1);
    setIsPlaying(false);
    setAwaitingDecision(false);
  }, []);

  const skipToNext = useCallback(() => {
    if (currentIndex < nodes.length - 1) {
      const targetIndex = currentIndex + 1;
      const targetNode = nodes[targetIndex];
      setCurrentIndex(targetIndex);
      // Check if target is a decision/link node - show its buttons
      if (targetNode?.type === 'link' || targetNode?.type === 'decision') {
        setAwaitingDecision(true);
        setIsPlaying(false);
      } else {
        setAwaitingDecision(false);
      }
    }
  }, [currentIndex, nodes]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      const targetIndex = currentIndex - 1;
      const targetNode = nodes[targetIndex];
      setCurrentIndex(targetIndex);
      setIsPlaying(false);
      // Check if target is a decision/link node - show its buttons
      if (targetNode?.type === 'link' || targetNode?.type === 'decision') {
        setAwaitingDecision(true);
      } else {
        setAwaitingDecision(false);
      }
    }
  }, [currentIndex, nodes]);

  const continueFromDecision = useCallback((targetIndex: number) => {
    setCurrentIndex(targetIndex);
    // Check if target is a link/decision node - don't auto-play, show its buttons
    const targetNode = nodes[targetIndex];
    if (targetNode?.type === 'link' || targetNode?.type === 'decision') {
      setAwaitingDecision(true);
      setIsPlaying(false);
    } else {
      setAwaitingDecision(false);
      setIsPlaying(true);
    }
  }, [nodes]);

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

  const progress = currentIndex === -1 ? 0 : ((currentIndex + 1) / nodes.length) * 100;
  const currentNode = currentIndex >= 0 ? nodes[currentIndex] : null;
  const isComplete = currentIndex >= nodes.length - 1 && !isPlaying;

  return (
    <div className="space-y-4">
      {/* Side-by-side layout: Diagram + Context panel */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Diagram with animation styles */}
        <div
          ref={containerRef}
          className={cn(
            'lg:col-span-3 overflow-x-auto animated-mermaid [&_svg_*]:!animate-none rounded-lg bg-muted/30 p-4',
            currentIndex >= 0 && 'animation-active'
          )}
        >
        <style>{`
          /* Override global * transition */
          .animated-mermaid svg,
          .animated-mermaid svg * {
            transition: none !important;
          }

          .animated-mermaid.animation-active .node-future {
            opacity: 0.25;
          }

          .animated-mermaid.animation-active .node-past {
            opacity: 0.6;
          }

          .animated-mermaid.animation-active .node-active {
            opacity: 1;
          }

          .animated-mermaid.animation-active .node-active rect,
          .animated-mermaid.animation-active .node-active polygon,
          .animated-mermaid.animation-active .node-active circle {
            stroke: hsl(var(--primary));
            stroke-width: 2px;
          }

          /* Decision nodes get amber stroke */
          .animated-mermaid.animation-active .node-decision polygon {
            stroke: hsl(45 93% 47%);
          }

          /* Link nodes get blue stroke */
          .animated-mermaid.animation-active .node-link rect,
          .animated-mermaid.animation-active .node-link polygon {
            stroke: hsl(217 91% 60%);
          }
        `}</style>
          <div
            aria-label="Animated Mermaid diagram"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        {/* Context panel - alongside diagram, sticky and centered on scroll */}
        <div className="lg:col-span-2 bg-card rounded-lg border p-5 flex flex-col justify-center min-h-[200px] lg:sticky lg:top-[calc(50vh-100px)] lg:self-start">
          {currentNode ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step {currentIndex + 1} of {nodes.length}
                  </span>
                  {currentNode.type === 'decision' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      Decision
                    </span>
                  )}
                  {currentNode.type === 'link' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      Link
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{currentNode.label}</h3>
              </div>

              <p className="text-sm text-muted-foreground">{currentNode.description}</p>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Decision buttons */}
              {awaitingDecision && currentNode.branches && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goBack} disabled={currentIndex <= 0}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => continueFromDecision(currentNode.branches![0][1])} size="sm" variant="outline" className="flex-1">
                    {currentNode.branches[0][0]}
                  </Button>
                  <Button onClick={() => continueFromDecision(currentNode.branches![1][1])} size="sm" variant="outline" className="flex-1">
                    {currentNode.branches[1][0]}
                  </Button>
                </div>
              )}

              {/* Link buttons - always show when at a link node */}
              {currentNode.type === 'link' && currentNode.linkTo && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goBack} disabled={currentIndex <= 0}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onLinkClick?.(currentNode.linkTo!)}
                    size="sm"
                    variant="outline"
                    className="gap-2 flex-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Details
                  </Button>
                  {currentIndex < nodes.length - 1 ? (
                    <Button
                      onClick={() => {
                        setAwaitingDecision(false);
                        setIsPlaying(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      onClick={reset}
                      size="sm"
                      variant="outline"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Playback controls - hide when at link node (link has its own buttons) */}
              {!awaitingDecision && currentNode.type !== 'link' && (
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={goBack} disabled={currentIndex <= 0}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  {!isPlaying ? (
                    <Button variant="outline" size="sm" onClick={start} className="gap-2 flex-1">
                      <Play className="h-4 w-4" />
                      {isComplete ? 'Replay' : 'Resume'}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={pause} className="gap-2 flex-1">
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  {/* Hide skip and reset on final node - only show back and replay */}
                  {!isComplete && (
                    <>
                      <Button variant="outline" size="sm" onClick={skipToNext}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={reset}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : isComplete ? (
            <div className="space-y-4 text-center">
              <div className="text-4xl">✅</div>
              <h3 className="text-lg font-semibold">Walkthrough Complete</h3>
              <p className="text-sm text-muted-foreground">
                You've completed this flowchart walkthrough.
              </p>
              <Button onClick={reset} variant="outline" size="sm" className="mt-2">
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            </div>
          ) : (
            <button
              onClick={start}
              className="space-y-4 text-center w-full cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-4xl">▶️</div>
              <h3 className="text-lg font-semibold">Ready to Begin</h3>
              <p className="text-sm text-muted-foreground">
                Click to walk through this flowchart step by step.
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
