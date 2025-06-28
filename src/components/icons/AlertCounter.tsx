const AlertCounter = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 120 80"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes pd-pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          @keyframes pd-urgent-flash {
            0%, 50% { opacity: 1; }
            25% { opacity: 0.6; }
          }
          .pd-alert-card {
            animation: pd-pulse 3s ease-in-out infinite;
          }
          .pd-urgent {
            animation: pd-urgent-flash 2s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* PagerDuty-style alert card */}
      <rect 
        x="5" 
        y="10" 
        width="110" 
        height="60" 
        fill="hsl(var(--foreground) / 0.03)" 
        stroke="hsl(var(--foreground) / 0.2)" 
        strokeWidth="1" 
        rx="6"
        className="pd-alert-card"
      />
      
      {/* Urgency indicator stripe (left edge) */}
      <rect 
        x="5" 
        y="10" 
        width="4" 
        height="60" 
        fill="hsl(var(--foreground) / 0.7)"
        rx="3"
        className="pd-urgent"
      />
      
      {/* Alert icon */}
      <circle 
        cx="20" 
        cy="25" 
        r="6" 
        fill="none" 
        stroke="hsl(var(--foreground) / 0.6)" 
        strokeWidth="1.5"
      />
      <path
        d="M17,22 L23,28 M23,22 L17,28"
        stroke="hsl(var(--foreground) / 0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Alert title */}
      <text 
        x="32" 
        y="22" 
        fontSize="4" 
        fill="hsl(var(--foreground) / 0.8)" 
        fontFamily="monospace"
        fontWeight="bold"
      >
        High Memory Usage
      </text>
      
      {/* Service name */}
      <text 
        x="32" 
        y="32" 
        fontSize="3.5" 
        fill="hsl(var(--foreground) / 0.6)" 
        fontFamily="monospace"
      >
        auth-service-prod
      </text>
      
      {/* Timestamp */}
      <text 
        x="32" 
        y="40" 
        fontSize="3" 
        fill="hsl(var(--foreground) / 0.4)" 
        fontFamily="monospace"
      >
        2m ago
      </text>
      
      {/* Status badge */}
      <rect 
        x="80" 
        y="18" 
        width="30" 
        height="12" 
        fill="hsl(var(--foreground) / 0.1)" 
        stroke="hsl(var(--foreground) / 0.3)" 
        strokeWidth="0.5" 
        rx="6"
      />
      <text 
        x="95" 
        y="26" 
        fontSize="3" 
        fill="hsl(var(--foreground) / 0.7)" 
        fontFamily="monospace"
        textAnchor="middle"
        fontWeight="bold"
      >
        TRIGGERED
      </text>
      
      {/* Assignee indicator */}
      <circle 
        cx="95" 
        cy="45" 
        r="4" 
        fill="hsl(var(--foreground) / 0.1)" 
        stroke="hsl(var(--foreground) / 0.4)" 
        strokeWidth="1"
      />
      <text 
        x="95" 
        y="48" 
        fontSize="2.5" 
        fill="hsl(var(--foreground) / 0.6)" 
        fontFamily="monospace"
        textAnchor="middle"
      >
        DB
      </text>
      
      {/* Escalation dots */}
      <circle cx="15" cy="55" r="1" fill="hsl(var(--foreground) / 0.5)" />
      <circle cx="20" cy="55" r="1" fill="hsl(var(--foreground) / 0.3)" />
      <circle cx="25" cy="55" r="1" fill="hsl(var(--foreground) / 0.3)" />
      
    </svg>
  );
};

export default AlertCounter;