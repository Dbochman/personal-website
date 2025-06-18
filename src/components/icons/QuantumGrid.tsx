
const QuantumGrid = () => {
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
          @keyframes quantum-shift {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(2px, -2px); }
            50% { transform: translate(-1px, 2px); }
            75% { transform: translate(1px, 1px); }
          }
          @keyframes node-energy {
            0%, 100% { opacity: 0.4; fill: rgba(255,255,255,0.4); }
            50% { opacity: 1; fill: rgba(255,255,255,0.8); }
          }
          .quantum-node {
            animation: node-energy 3s ease-in-out infinite;
          }
          .quantum-grid {
            animation: quantum-shift 8s ease-in-out infinite;
          }
        `}
      </style>
      
      <g className="quantum-grid">
        {/* Grid lines */}
        <path d="M20,20 L100,20 M20,40 L100,40 M20,60 L100,60 M20,80 L100,80 M20,100 L100,100" 
              stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <path d="M20,20 L20,100 M40,20 L40,100 M60,20 L60,100 M80,20 L80,100 M100,20 L100,100" 
              stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        
        {/* Quantum nodes */}
        <circle cx="20" cy="20" r="2" className="quantum-node motion-safe:animate-pulse" />
        <circle cx="60" cy="40" r="2" className="quantum-node motion-safe:animate-pulse" style={{ animationDelay: '0.5s' }} />
        <circle cx="100" cy="60" r="2" className="quantum-node motion-safe:animate-pulse" style={{ animationDelay: '1s' }} />
        <circle cx="40" cy="80" r="2" className="quantum-node motion-safe:animate-pulse" style={{ animationDelay: '1.5s' }} />
        <circle cx="80" cy="100" r="2" className="quantum-node motion-safe:animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Connection lines */}
        <path d="M20,20 L60,40 L100,60 L40,80 L80,100" 
              fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3 2" />
      </g>
    </svg>
  );
};

export default QuantumGrid;
