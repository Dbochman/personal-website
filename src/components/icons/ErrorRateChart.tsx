const ErrorRateChart = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 120 60"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes error-spike {
            0%, 90% { opacity: 0.3; }
            10% { opacity: 1; }
          }
          @keyframes chart-draw {
            0% { stroke-dasharray: 0 200; }
            100% { stroke-dasharray: 200 0; }
          }
          .error-line {
            animation: chart-draw 2s ease-out, error-spike 6s ease-in-out infinite;
          }
          .error-point {
            animation: error-spike 6s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* Chart frame */}
      <rect x="10" y="10" width="100" height="40" fill="none" stroke="hsl(var(--foreground) / 0.2)" strokeWidth="1" />
      
      {/* Grid lines */}
      <line x1="10" y1="20" x2="110" y2="20" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.5" />
      <line x1="10" y1="30" x2="110" y2="30" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.5" />
      <line x1="10" y1="40" x2="110" y2="40" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="0.5" />
      
      {/* Error rate line (showing normal state with occasional spikes) */}
      <path
        d="M15,45 L25,44 L35,45 L45,25 L55,45 L65,44 L75,15 L85,45 L95,44 L105,45"
        fill="none"
        stroke="hsl(var(--foreground) / 0.6)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="error-line"
      />
      
      {/* Critical error points */}
      <circle cx="45" cy="25" r="2" fill="hsl(var(--foreground) / 0.8)" className="error-point" style={{ animationDelay: '1s' }} />
      <circle cx="75" cy="15" r="2" fill="hsl(var(--foreground) / 0.8)" className="error-point" style={{ animationDelay: '3s' }} />
      
      {/* Y-axis labels */}
      <text x="5" y="15" fontSize="6" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">5%</text>
      <text x="5" y="35" fontSize="6" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">1%</text>
      <text x="5" y="53" fontSize="6" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">0%</text>
    </svg>
  );
};

export default ErrorRateChart;