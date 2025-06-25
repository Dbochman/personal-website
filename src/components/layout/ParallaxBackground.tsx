
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
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Simple Triangle - Top Left */}
      <div 
        className="absolute top-20 left-[5%] w-16 h-16"
        data-speed="0.2"
      >
        <SimpleTriangle />
      </div>
      
      {/* Hexagon Grid - Top Right */}
      <div 
        className="absolute top-32 right-[10%] w-24 h-24"
        data-speed="0.3"
      >
        <HexagonGrid />
      </div>
      
      {/* Circuit Pattern - Middle Left */}
      <div 
        className="absolute top-[45%] left-[8%] w-40 h-24"
        data-speed="0.4"
      >
        <CircuitPattern />
      </div>
      
      {/* Server Stack - Bottom Right */}
      <div 
        className="absolute bottom-20 right-[12%] w-20 h-32"
        data-speed="0.35"
      >
        <ServerStack />
      </div>

      {/* Data Flow - Top Center */}
      <div 
        className="absolute top-16 left-[40%] w-36 h-20"
        data-speed="0.25"
      >
        <DataFlow />
      </div>

      {/* Geometric Rings - Middle Right */}
      <div 
        className="absolute top-[35%] right-[25%] w-28 h-28"
        data-speed="0.45"
      >
        <GeometricRings />
      </div>

      {/* Alert Beacon - Bottom Left */}
      <div 
        className="absolute bottom-32 left-[15%] w-20 h-20"
        data-speed="0.3"
      >
        <AlertBeacon />
      </div>

      {/* Quantum Grid - Middle Center */}
      <div 
        className="absolute top-[60%] left-[45%] w-32 h-32"
        data-speed="0.55"
      >
        <QuantumGrid />
      </div>

      {/* Metric Wave - Bottom Center */}
      <div 
        className="absolute bottom-8 left-[35%] w-40 h-16"
        data-speed="0.2"
      >
        <MetricWave />
      </div>
    </div>
  );
};

export default ParallaxBackground;
