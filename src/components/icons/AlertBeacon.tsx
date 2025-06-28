
const AlertBeacon = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <defs>
        <radialGradient id="beacon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--foreground) / 0.8)" />
          <stop offset="70%" stopColor="hsl(var(--foreground) / 0.3)" />
          <stop offset="100%" stopColor="hsl(var(--foreground) / 0)" />
        </radialGradient>
        <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--foreground) / 0.9)" />
          <stop offset="100%" stopColor="hsl(var(--foreground) / 0.6)" />
        </radialGradient>
      </defs>

      <style>
        {`
          @keyframes beacon-breathing {
            0%, 100% { 
              transform: scale(1) rotate(0deg); 
              opacity: 0.8; 
            }
            50% { 
              transform: scale(1.05) rotate(1deg); 
              opacity: 1; 
            }
          }
          
          @keyframes ripple-wave {
            0% { 
              r: 8; 
              opacity: 0.8; 
              stroke-width: 2;
            }
            100% { 
              r: 35; 
              opacity: 0; 
              stroke-width: 0.5;
            }
          }
          
          @keyframes alert-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          
          .beacon-breathing {
            animation: beacon-breathing var(--timing-ambient) var(--easing-gentle) infinite;
            transform-origin: center;
          }
          
          .ripple-wave {
            animation: ripple-wave calc(var(--timing-ambient) * 0.5) var(--easing-smooth) infinite;
          }
          
          .alert-core {
            animation: alert-pulse calc(var(--timing-ambient) * 0.75) var(--easing-gentle) infinite;
          }
        `}
      </style>
      
      {/* Enhanced ripple effects */}
      {[0, 0.3, 0.6].map((delay, i) => (
        <circle
          key={i}
          cx="40"
          cy="40"
          fill="none"
          stroke="url(#beacon-glow)"
          className="ripple-wave motion-safe:ripple-wave"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      
      {/* Alert beacon center with enhanced styling */}
      <circle
        cx="40"
        cy="40"
        r="8"
        fill="none"
        stroke="url(#beacon-glow)"
        strokeWidth="2"
        className="beacon-breathing"
      />
      
      <circle
        cx="40"
        cy="40"
        r="4"
        fill="url(#core-glow)"
        className="alert-core beacon-breathing"
      />
      
      {/* Enhanced warning indicator */}
      <path
        d="M40,30 L45,38 L35,38 Z"
        fill="url(#core-glow)"
        className="alert-core"
      />
      
      {/* Additional accent dots */}
      <circle
        cx="40"
        cy="35"
        r="1"
        fill="hsl(var(--foreground) / 0.8)"
        className="alert-core"
      />
    </svg>
  );
};

export default AlertBeacon;
