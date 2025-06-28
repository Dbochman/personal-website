
import React from 'react';
import SimpleTriangle from "@/components/icons/SimpleTriangle";
import HexagonGrid from "@/components/icons/HexagonGrid";
import CircuitPattern from "@/components/icons/CircuitPattern";
import ServerStack from "@/components/icons/ServerStack";
import DataFlow from "@/components/icons/DataFlow";
import GeometricRings from "@/components/icons/GeometricRings";
import AlertBeacon from "@/components/icons/AlertBeacon";
import QuantumGrid from "@/components/icons/QuantumGrid";
import MetricWave from "@/components/icons/MetricWave";

const ParallaxBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background Layer - Slowest movement, most subtle */}
      <div className="absolute inset-0 z-0 opacity-[0.03]">
        <div 
          className="absolute top-[15%] left-[8%] w-32 h-20 parallax-element"
          data-speed="0.1"
        >
          <CircuitPattern />
        </div>
        <div 
          className="absolute bottom-[25%] right-[12%] w-24 h-24 parallax-element"
          data-speed="0.12"
        >
          <HexagonGrid />
        </div>
        <div 
          className="absolute top-[60%] left-[70%] w-28 h-28 parallax-element"
          data-speed="0.08"
        >
          <QuantumGrid />
        </div>
      </div>

      {/* Midground Layer - Medium movement and opacity */}
      <div className="absolute inset-0 z-1 opacity-[0.08]">
        <div 
          className="absolute top-[35%] right-[15%] w-20 h-32 parallax-element"
          data-speed="0.25"
        >
          <ServerStack />
        </div>
        <div 
          className="absolute top-[20%] left-[45%] w-36 h-20 parallax-element"
          data-speed="0.28"
        >
          <DataFlow />
        </div>
        <div 
          className="absolute bottom-[40%] left-[25%] w-24 h-16 parallax-element"
          data-speed="0.22"
        >
          <MetricWave />
        </div>
        <div 
          className="absolute top-[8%] left-[75%] w-16 h-16 parallax-element"
          data-speed="0.24"
        >
          <SimpleTriangle />
        </div>
      </div>

      {/* Foreground Layer - Fastest movement, highest visibility */}
      <div className="absolute inset-0 z-2 opacity-[0.15]">
        <div 
          className="absolute bottom-[20%] left-[10%] w-20 h-20 parallax-element"
          data-speed="0.4"
        >
          <AlertBeacon />
        </div>
        <div 
          className="absolute top-[50%] right-[20%] w-28 h-28 parallax-element"
          data-speed="0.42"
        >
          <GeometricRings />
        </div>
        <div 
          className="absolute top-[5%] right-[8%] w-24 h-24 parallax-element"
          data-speed="0.38"
        >
          <HexagonGrid />
        </div>
      </div>

      {/* Interactive Layer - Subtle accent elements */}
      <div className="absolute inset-0 z-3 opacity-[0.05]">
        <div 
          className="absolute bottom-[8%] right-[40%] w-32 h-12 parallax-element"
          data-speed="0.15"
        >
          <MetricWave />
        </div>
        <div 
          className="absolute top-[75%] left-[60%] w-18 h-18 parallax-element"
          data-speed="0.18"
        >
          <SimpleTriangle />
        </div>
      </div>
    </div>
  );
};

export default ParallaxBackground;
