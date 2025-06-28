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
      
      {/* Gauge background */}
      <circle
        cx="40"
        cy="40"
        r="30"
        fill="none"
        stroke="hsl(var(--foreground) / 0.2)"
        strokeWidth="6"
      />
      
      {/* SLO percentage arc (99.93%) */}
      <circle
        cx="40"
        cy="40"
        r="35"
        fill="none"
        stroke="hsl(var(--foreground) / 0.75)"
        strokeWidth="5"
        strokeLinecap="round"
        className="gauge-progress"
      />
      
      
      {/* SLO text */}
      <text
        x="40"
        y="45"
        textAnchor="middle"
        fontSize="10"
        fill="hsl(var(--foreground) / 0.6)"
        fontFamily="monospace"
      >
        99.93%
      </text>
      
      {/* Threshold markers */}
      <line x1="40" y1="4" x2="40" y2="12" stroke="hsl(var(--foreground) / 0.5)" strokeWidth="1" />
      <line x1="76" y1="40" x2="68" y2="40" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" />
      <line x1="40" y1="76" x2="40" y2="68" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" />
      <line x1="4"  y1="40" x2="12" y2="40" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" />
    </svg>
  );
};

export default SloGauge;