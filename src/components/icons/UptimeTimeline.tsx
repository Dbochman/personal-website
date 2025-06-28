const UptimeTimeline = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 120 40"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes timeline-fill {
            0% { width: 0; }
            100% { width: var(--segment-width); }
          }
          @keyframes incident-blink {
            0%, 50% { opacity: 0.8; }
            25% { opacity: 0.3; }
          }
          .timeline-segment {
            animation: timeline-fill 1.5s ease-out forwards;
          }
          .incident-marker {
            animation: incident-blink 3s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* Timeline frame */}
      <rect x="10" y="15" width="100" height="10" fill="none" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="1" rx="2" />
      
      {/* Uptime segments (green = healthy, red = incident) */}
      <rect 
        x="10" 
        y="15" 
        height="10" 
        fill="hsl(var(--foreground) / 0.6)"
        className="timeline-segment"
        style={{ 
          '--segment-width': '30px',
          animationDelay: '0.1s' 
        }} 
      />
      <rect 
        x="40" 
        y="15" 
        height="10" 
        fill="hsl(var(--foreground) / 0.3)"
        className="timeline-segment incident-marker"
        style={{ 
          '--segment-width': '8px',
          animationDelay: '0.3s' 
        }} 
      />
      <rect 
        x="48" 
        y="15" 
        height="10" 
        fill="hsl(var(--foreground) / 0.6)"
        className="timeline-segment"
        style={{ 
          '--segment-width': '35px',
          animationDelay: '0.4s' 
        }} 
      />
      <rect 
        x="83" 
        y="15" 
        height="10" 
        fill="hsl(var(--foreground) / 0.3)"
        className="timeline-segment incident-marker"
        style={{ 
          '--segment-width': '5px',
          animationDelay: '0.6s' 
        }} 
      />
      <rect 
        x="88" 
        y="15" 
        height="10" 
        fill="hsl(var(--foreground) / 0.6)"
        className="timeline-segment"
        style={{ 
          '--segment-width': '22px',
          animationDelay: '0.7s' 
        }} 
      />
      
      {/* Time labels */}
      <text x="10" y="12" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">24h</text>
      <text x="55" y="12" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">12h</text>
      <text x="110" y="12" fontSize="5" fill="hsl(var(--foreground) / 0.4)" fontFamily="monospace">now</text>
      
      {/* Uptime percentage */}
      <text x="60" y="35" fontSize="6" fill="hsl(var(--foreground) / 0.6)" fontFamily="monospace" textAnchor="middle">99.95% uptime</text>
    </svg>
  );
};

export default UptimeTimeline;