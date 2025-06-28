
const ServerStack = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 80 120"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes status-blink {
            0%, 60% { opacity: 0.3; }
            30% { opacity: 1; }
          }
          @keyframes fan-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .status-light {
            animation: status-blink 3s ease-in-out infinite;
          }
          .fan {
            animation: fan-spin 2s linear infinite;
            transform-origin: center;
          }
        `}
      </style>
      
      {/* Server units */}
      <rect x="10" y="20" width="60" height="15" rx="2" fill="none" stroke="hsl(var(--foreground) / 0.4)" strokeWidth="1.5" />
      <rect x="10" y="40" width="60" height="15" rx="2" fill="none" stroke="hsl(var(--foreground) / 0.4)" strokeWidth="1.5" />
      <rect x="10" y="60" width="60" height="15" rx="2" fill="none" stroke="hsl(var(--foreground) / 0.4)" strokeWidth="1.5" />
      <rect x="10" y="80" width="60" height="15" rx="2" fill="none" stroke="hsl(var(--foreground) / 0.4)" strokeWidth="1.5" />
      
      {/* Status lights */}
      <circle cx="65" cy="27" r="2" fill="hsl(var(--foreground) / 0.6)" className="status-light" />
      <circle cx="65" cy="47" r="2" fill="hsl(var(--foreground) / 0.6)" className="status-light" style={{ animationDelay: '0.5s' }} />
      <circle cx="65" cy="67" r="2" fill="hsl(var(--foreground) / 0.4)" className="status-light" style={{ animationDelay: '1s' }} />
      <circle cx="65" cy="87" r="2" fill="hsl(var(--foreground) / 0.6)" className="status-light" style={{ animationDelay: '1.5s' }} />
      
      {/* Small fans/vents */}
      <circle cx="25" cy="27" r="3" fill="none" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" className="fan motion-safe:animate-spin" />
      <circle cx="45" cy="47" r="3" fill="none" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" className="fan motion-safe:animate-spin" style={{ animationDelay: '0.3s' }} />
      
      {/* Rack frame */}
      <rect x="5" y="15" width="70" height="85" rx="3" fill="none" stroke="hsl(var(--foreground) / 0.2)" strokeWidth="1" />
    </svg>
  );
};

export default ServerStack;
