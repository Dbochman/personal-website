
const DataFlow = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 140 80"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes data-stream {
            0% { stroke-dashoffset: 120; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes packet-move {
            0% { transform: translateX(-10px); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateX(150px); opacity: 0; }
          }
          .data-line {
            stroke-dasharray: 6 3;
            animation: data-stream 4s linear infinite;
          }
          .data-packet {
            animation: packet-move 6s linear infinite;
          }
        `}
      </style>
      
      {/* Data streams */}
      <path
        d="M10,25 Q40,15 70,25 T130,25"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        className="data-line motion-safe:animate-pulse"
      />
      <path
        d="M10,40 Q40,50 70,40 T130,40"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
        className="data-line"
        style={{ animationDelay: '2s' }}
      />
      <path
        d="M10,55 Q40,45 70,55 T130,55"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        className="data-line"
        style={{ animationDelay: '4s' }}
      />
      
      {/* Moving data packets */}
      <rect x="20" y="22" width="8" height="6" rx="1" fill="rgba(255,255,255,0.6)" className="data-packet" />
      <rect x="25" y="37" width="6" height="6" rx="1" fill="rgba(255,255,255,0.5)" className="data-packet" style={{ animationDelay: '1s' }} />
      <rect x="15" y="52" width="10" height="6" rx="1" fill="rgba(255,255,255,0.4)" className="data-packet" style={{ animationDelay: '3s' }} />
    </svg>
  );
};

export default DataFlow;
