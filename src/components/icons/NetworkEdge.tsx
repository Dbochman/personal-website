
import React from 'react';

export const NetworkEdge = () => {
  return (
    <svg
      width="176"
      height="64"
      viewBox="0 0 176 64"
      fill="none"
      stroke="rgba(255, 255, 255, 0.4)"
      strokeWidth="2"
      className="opacity-15"
      aria-hidden="true"
      role="presentation"
    >
      <style>
        {`
          @keyframes dash-flow {
            0% { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 0; }
          }
          .dashed-line {
            stroke-dasharray: 8 4;
            animation: dash-flow 4s linear infinite;
          }
        `}
      </style>
      
      {/* Left node */}
      <circle cx="16" cy="32" r="12" fill="rgba(255, 255, 255, 0.1)" />
      <circle cx="16" cy="32" r="6" fill="rgba(255, 255, 255, 0.3)" />
      
      {/* Right node */}
      <circle cx="160" cy="32" r="12" fill="rgba(255, 255, 255, 0.1)" />
      <circle cx="160" cy="32" r="6" fill="rgba(255, 255, 255, 0.3)" />
      
      {/* Animated connection line */}
      <line
        x1="28"
        y1="32"
        x2="148"
        y2="32"
        className="motion-safe:dashed-line"
        strokeLinecap="round"
      />
    </svg>
  );
};
