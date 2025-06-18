
const GeometricRings = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes ring-pulse {
            0%, 100% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(1.2); opacity: 0.8; }
          }
          @keyframes ring-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .ring-outer {
            animation: ring-rotate 15s linear infinite;
            transform-origin: center;
          }
          .ring-middle {
            animation: ring-rotate 10s linear infinite reverse;
            transform-origin: center;
          }
          .ring-inner {
            animation: ring-pulse 3s ease-in-out infinite;
            transform-origin: center;
          }
        `}
      </style>
      
      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        strokeDasharray="10 5"
        className="ring-outer motion-safe:animate-spin"
      />
      
      {/* Middle ring */}
      <circle
        cx="50"
        cy="50"
        r="30"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
        strokeDasharray="8 4"
        className="ring-middle motion-safe:animate-spin"
      />
      
      {/* Inner ring */}
      <circle
        cx="50"
        cy="50"
        r="15"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        className="ring-inner motion-safe:animate-pulse"
      />
      
      {/* Center dot */}
      <circle
        cx="50"
        cy="50"
        r="3"
        fill="rgba(255,255,255,0.6)"
        className="motion-safe:animate-pulse"
      />
    </svg>
  );
};

export default GeometricRings;
