
const SimpleTriangle = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      aria-hidden="true"
      role="presentation"
      className="opacity-15"
    >
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .triangle-float {
            animation: float 6s ease-in-out infinite;
          }
        `}
      </style>
      <polygon
        points="50,10 90,90 10,90"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        className="triangle-float motion-safe:animate-pulse"
      />
    </svg>
  );
};

export default SimpleTriangle;
