
const CircuitPattern = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 160 100"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes signal-flow {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes node-blink {
            0%, 50% { opacity: 0.4; }
            25%, 75% { opacity: 1; }
          }
          .signal-line {
            stroke-dasharray: 8 4;
            animation: signal-flow 3s linear infinite;
          }
          .node {
            animation: node-blink 2s ease-in-out infinite;
          }
        `}
      </style>
      {/* Main circuit paths */}
      <path
        d="M20,50 L50,50 L50,30 L80,30 L80,50 L110,50 L110,70 L140,70"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        className="signal-line motion-safe:animate-pulse"
      />
      <path
        d="M20,70 L40,70 L40,50 L70,50 L70,70 L100,70"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
        className="signal-line"
        style={{ animationDelay: '1s' }}
      />
      
      {/* Circuit nodes */}
      <circle cx="20" cy="50" r="4" fill="rgba(255,255,255,0.6)" className="node" />
      <circle cx="50" cy="30" r="3" fill="rgba(255,255,255,0.6)" className="node" style={{ animationDelay: '0.5s' }} />
      <circle cx="80" cy="50" r="4" fill="rgba(255,255,255,0.6)" className="node" style={{ animationDelay: '1s' }} />
      <circle cx="110" cy="70" r="3" fill="rgba(255,255,255,0.6)" className="node" style={{ animationDelay: '1.5s' }} />
      <circle cx="140" cy="70" r="4" fill="rgba(255,255,255,0.6)" className="node" style={{ animationDelay: '2s' }} />
      
      {/* Small junction boxes */}
      <rect x="48" y="28" width="4" height="4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <rect x="78" y="48" width="4" height="4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    </svg>
  );
};

export default CircuitPattern;
