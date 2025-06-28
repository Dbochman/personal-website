
const MetricWave = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 160 60"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes wave-flow {
            0% { transform: translateX(-20px); }
            100% { transform: translateX(20px); }
          }
          @keyframes metric-bar {
            0%, 100% { height: 8px; y: 46px; }
            50% { height: 20px; y: 34px; }
          }
          .wave-line {
            animation: wave-flow 6s ease-in-out infinite;
          }
          .metric-bar {
            animation: metric-bar 4s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* Flowing wave */}
      <path
        d="M0,30 Q20,20 40,30 T80,30 T120,30 T160,30"
        fill="none"
        stroke="hsl(var(--foreground) / 0.4)"
        strokeWidth="2"
        className="wave-line motion-safe:animate-pulse"
      />
      
      {/* Metric bars */}
      <rect x="20" y="46" width="4" height="8" fill="hsl(var(--foreground) / 0.5)" className="metric-bar" />
      <rect x="30" y="46" width="4" height="8" fill="hsl(var(--foreground) / 0.5)" className="metric-bar" style={{ animationDelay: '0.5s' }} />
      <rect x="40" y="46" width="4" height="8" fill="hsl(var(--foreground) / 0.5)" className="metric-bar" style={{ animationDelay: '1s' }} />
      <rect x="50" y="46" width="4" height="8" fill="hsl(var(--foreground) / 0.5)" className="metric-bar" style={{ animationDelay: '1.5s' }} />
      <rect x="60" y="46" width="4" height="8" fill="hsl(var(--foreground) / 0.5)" className="metric-bar" style={{ animationDelay: '2s' }} />
      <rect x="70" y="46" width="4" height="8" fill="hsl(var(--foreground) / 0.5)" className="metric-bar" style={{ animationDelay: '2.5s' }} />
      <rect x="80" y="46" width="4" height="8" fill="hsl(var(--foreground) / 0.5)" className="metric-bar" style={{ animationDelay: '3s' }} />
      
      {/* Baseline */}
      <line x1="0" y1="54" x2="160" y2="54" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" />
    </svg>
  );
};

export default MetricWave;
