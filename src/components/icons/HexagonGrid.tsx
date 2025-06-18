
const HexagonGrid = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 120 120"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes rotate-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-scale {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .hex-rotate {
            animation: rotate-slow 20s linear infinite;
            transform-origin: center;
          }
          .hex-pulse {
            animation: pulse-scale 4s ease-in-out infinite;
            transform-origin: center;
          }
        `}
      </style>
      <g className="hex-rotate motion-safe:animate-spin">
        <polygon
          points="60,10 100,35 100,85 60,110 20,85 20,35"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
        />
      </g>
      <g className="hex-pulse">
        <polygon
          points="60,30 80,45 80,75 60,90 40,75 40,45"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
        />
      </g>
      <circle
        cx="60"
        cy="60"
        r="3"
        fill="rgba(255,255,255,0.8)"
        className="motion-safe:animate-pulse"
      />
    </svg>
  );
};

export default HexagonGrid;
