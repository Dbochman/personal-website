
import React from 'react';

export const SLOGauge = () => {
  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 128 128"
      fill="none"
      stroke="rgba(255, 255, 255, 0.4)"
      strokeWidth="2"
      className="opacity-15"
      aria-hidden="true"
      role="presentation"
    >
      <style>
        {`
          @keyframes swing {
            0%, 100% { transform: rotate(-25deg); }
            50% { transform: rotate(25deg); }
          }
          .needle-swing {
            animation: swing 8s ease-in-out infinite;
            transform-origin: 64px 64px;
          }
        `}
      </style>
      
      {/* Outer circle */}
      <circle cx="64" cy="64" r="56" />
      
      {/* Arc gauge */}
      <path
        d="M 20 64 A 44 44 0 1 1 108 64"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Center dot */}
      <circle cx="64" cy="64" r="4" fill="rgba(255, 255, 255, 0.4)" />
      
      {/* Needle */}
      <line
        x1="64"
        y1="64"
        x2="64"
        y2="28"
        strokeWidth="3"
        strokeLinecap="round"
        className="motion-safe:needle-swing"
      />
    </svg>
  );
};
