const LatencyHistogram = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 80"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes histogram-grow {
            0% { height: 0; y: 60; }
            100% { 
              height: var(--bar-height);
              y: var(--bar-y);
            }
          }
          .histogram-bar {
            animation: histogram-grow 2s ease-out forwards;
          }
        `}
      </style>
      
      {/* Histogram frame */}
      <rect x="10" y="10" width="80" height="50" fill="none" stroke="hsl(var(--foreground) / 0.2)" strokeWidth="1" />
      
      {/* Latency distribution bars (p50, p90, p95, p99) */}
      <rect 
        x="15" 
        className="histogram-bar" 
        width="8" 
        fill="hsl(var(--foreground) / 0.6)"
        style={{ 
          '--bar-height': '35px', 
          '--bar-y': '25px',
          animationDelay: '0.2s' 
        }} 
      />
      <rect 
        x="28" 
        className="histogram-bar" 
        width="8" 
        fill="hsl(var(--foreground) / 0.5)"
        style={{ 
          '--bar-height': '25px', 
          '--bar-y': '35px',
          animationDelay: '0.4s' 
        }} 
      />
      <rect 
        x="41" 
        className="histogram-bar" 
        width="8" 
        fill="hsl(var(--foreground) / 0.4)"
        style={{ 
          '--bar-height': '15px', 
          '--bar-y': '45px',
          animationDelay: '0.6s' 
        }} 
      />
      <rect 
        x="54" 
        className="histogram-bar" 
        width="8" 
        fill="hsl(var(--foreground) / 0.4)"
        style={{ 
          '--bar-height': '12px', 
          '--bar-y': '48px',
          animationDelay: '0.8s' 
        }} 
      />
      <rect 
        x="67" 
        className="histogram-bar" 
        width="8" 
        fill="hsl(var(--foreground) / 0.3)"
        style={{ 
          '--bar-height': '8px', 
          '--bar-y': '52px',
          animationDelay: '1s' 
        }} 
      />
      
      {/* Percentile markers */}
      <text x="19" y="70" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace" textAnchor="middle">p50</text>
      <text x="32" y="70" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace" textAnchor="middle">p90</text>
      <text x="45" y="70" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace" textAnchor="middle">p95</text>
      <text x="58" y="70" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace" textAnchor="middle">p99</text>
      
      {/* Y-axis latency labels */}
      <text x="5" y="15" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">500ms</text>
      <text x="5" y="35" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">100ms</text>
      <text x="5" y="55" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">10ms</text>
    </svg>
  );
};

export default LatencyHistogram;