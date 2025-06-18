
import React from 'react';

export const TicketCard = () => {
  return (
    <svg
      width="144"
      height="96"
      viewBox="0 0 144 96"
      fill="none"
      stroke="rgba(255, 255, 255, 0.4)"
      strokeWidth="1"
      className="opacity-15"
      aria-hidden="true"
      role="presentation"
    >
      <style>
        {`
          @keyframes blink {
            0%, 90% { opacity: 0.3; }
            95% { opacity: 1; }
            100% { opacity: 0.3; }
          }
          .led-blink {
            animation: blink 3s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* Card background */}
      <rect x="4" y="4" width="136" height="88" rx="8" />
      
      {/* Info bars */}
      <rect x="16" y="20" width="80" height="8" rx="2" />
      <rect x="16" y="36" width="60" height="8" rx="2" />
      <rect x="16" y="52" width="96" height="8" rx="2" />
      
      {/* Status LED */}
      <circle 
        cx="120" 
        cy="24" 
        r="6" 
        fill="rgba(34, 197, 94, 0.8)"
        className="motion-safe:led-blink"
      />
    </svg>
  );
};
