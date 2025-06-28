
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
      {/* SRE Monitoring Dashboard Zone - Top Right */}
      <div className="absolute inset-0 z-2 opacity-20">
        <div 
          className="absolute top-[8%] right-[10%] w-24 h-24 parallax-element sre-icon"
          data-speed="0.35"
        >
          <AlertBeacon />
        </div>
        <div 
          className="absolute top-[10%] right-[45%] w-45 h-45 parallax-element sre-icon"
          data-speed="0.3"
        >
          <MetricWave />
        </div>
      </div>

      {/* Infrastructure Zone - Left Side */}
      <div className="absolute inset-0 z-1 opacity-15">
        <div 
          className="absolute top-[40%] left-[5%] w-24 h-36 parallax-element sre-icon"
          data-speed="0.25"
        >
          <ServerStack />
        </div>
        <div 
          className="absolute bottom-[30%] left-[8%] w-40 h-24 parallax-element sre-icon"
          data-speed="0.28"
        >
          <CircuitPattern />
        </div>
      </div>

      {/* Data Flow Corridor - Center */}
      <div className="absolute inset-0 z-1 opacity-12">
        <div 
          className="absolute top-[15%] left-[45%] w-40 h-20 parallax-element sre-icon"
          data-speed="0.32"
        >
          <DataFlow />
        </div>
        <div 
          className="absolute bottom-[15%] left-[40%] w-36 h-18 parallax-element sre-icon"
          data-speed="0.22"
        >
          <DataFlow />
        </div>
      </div>

      {/* Distributed Systems Grid - Background */}
      <div className="absolute inset-0 z-0 opacity-08">
        <div 
          className="absolute top-[55%] left-[65%] w-32 h-32 parallax-element sre-icon"
          data-speed="0.18"
        >
          <QuantumGrid />
        </div>
        <div 
          className="absolute bottom-[45%] right-[25%] w-28 h-28 parallax-element sre-icon"
          data-speed="0.15"
        >
          <QuantumGrid />
        </div>
      </div>

      {/* Secondary Metrics Layer */}
      <div className="absolute inset-0 z-1 opacity-10">
        <div 
          className="absolute bottom-[8%] right-[15%] w-28 h-14 parallax-element sre-icon"
          data-speed="0.2"
        >
          <MetricWave />
        </div>
      </div>

      {/* SRE Service Topology - Distributed across layout */}
      <div className="absolute inset-0 z-1 opacity-8">
        <div 
          className="absolute top-[60%] left-[25%] w-20 h-20 parallax-element sre-icon"
          data-speed="0.12"
        >
          <HexagonGrid />
        </div>
        <div 
          className="absolute top-[35%] right-[40%] w-16 h-16 parallax-element sre-icon"
          data-speed="0.16"
        >
          <GeometricRings />
        </div>
      </div>
    </div>
  );
};

export default ParallaxBackground;
