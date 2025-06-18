
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
      <style>
        {`
          @keyframes beacon-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.5); opacity: 0.2; }
            100% { transform: scale(2); opacity: 0; }
          }
          @keyframes alert-blink {
            0%, 70% { opacity: 0.3; }
            35% { opacity: 1; }
          }
          .beacon-wave {
            animation: beacon-pulse 2s ease-out infinite;
            transform-origin: center;
          }
          .alert-core {
            animation: alert-blink 1.5s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* Beacon waves */}
      <circle
        cx="40"
        cy="40"
        r="10"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
        className="beacon-wave motion-safe:animate-ping"
      />
      <circle
        cx="40"
        cy="40"
        r="10"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        className="beacon-wave motion-safe:animate-ping"
        style={{ animationDelay: '0.5s' }}
      />
      <circle
        cx="40"
        cy="40"
        r="10"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        className="beacon-wave motion-safe:animate-ping"
        style={{ animationDelay: '1s' }}
      />
      
      {/* Alert beacon center */}
      <circle
        cx="40"
        cy="40"
        r="8"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
      />
      <circle
        cx="40"
        cy="40"
        r="4"
        fill="rgba(255,255,255,0.6)"
        className="alert-core motion-safe:animate-pulse"
      />
      
      {/* Warning indicators */}
      <path
        d="M40,30 L45,38 L35,38 Z"
        fill="rgba(255,255,255,0.4)"
        className="alert-core"
      />
    </svg>
  );
};

export default AlertBeacon;
