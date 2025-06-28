const SloGauge = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes gauge-fill {
            0% { stroke-dasharray: 0 188; }
            100% { stroke-dasharray: 150 188; }
          }
          @keyframes gauge-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          .gauge-progress {
            animation: gauge-fill 3s ease-out forwards, gauge-pulse 4s ease-in-out infinite;
            transform-origin: 40px 40px;
            transform: rotate(-90deg);
          }
        `}
      </style>
      
      {/* Gauge background */}
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="none"
        stroke="hsl(var(--foreground) / 0.2)"
        strokeWidth="6"
      />
      
      {/* SLO percentage arc (99.9%) */}
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="none"
        stroke="hsl(var(--foreground) / 0.7)"
        strokeWidth="6"
        strokeLinecap="round"
        className="gauge-progress"
      />
      
      {/* Center indicator */}
      <circle
        cx="40"
        cy="40"
        r="8"
        fill="none"
        stroke="hsl(var(--foreground) / 0.4)"
        strokeWidth="1"
      />
      
      {/* SLO text */}
      <text
        x="40"
        y="45"
        textAnchor="middle"
        fontSize="8"
        fill="hsl(var(--foreground) / 0.6)"
        fontFamily="monospace"
      >
        99.9%
      </text>
      
      {/* Threshold markers */}
      <line x1="40" y1="4" x2="40" y2="12" stroke="hsl(var(--foreground) / 0.5)" strokeWidth="1" />
      <line x1="76" y1="40" x2="68" y2="40" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" />
      <line x1="40" y1="76" x2="40" y2="68" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" />
    </svg>
  );
};

export default SloGauge;