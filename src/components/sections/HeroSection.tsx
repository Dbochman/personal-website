
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Github, MapPin, Activity } from "lucide-react";
import ErrorRateChart from "@/components/icons/ErrorRateChart";
import LatencyHistogram from "@/components/icons/LatencyHistogram";
import AlertCounter from "@/components/icons/AlertCounter";

const HeroSection = () => {
  return (
    <section className="py-20 px-6 relative">
      {/* SRE Monitoring Dashboard Elements - Hidden on mobile */}
      <div className="hidden md:block">
        <div className="absolute top-32 right-12 w-32 h-16 parallax-element" data-speed="0.15" title="Error Rate Monitoring">
          <ErrorRateChart />
        </div>
        <div className="absolute bottom-20 left-16 w-24 h-20 parallax-element" data-speed="0.12" title="Latency Distribution">
          <LatencyHistogram />
        </div>
        <div className="absolute top-20 left-8 w-90 h-16 parallax-element" data-speed="0.18" title="Active Alerts">
          <AlertCounter />
        </div>
      </div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-8">
          {/* Glitch effect title */}
          <div className="relative mb-6">
            <h2 className="text-6xl font-bold text-foreground mb-2 leading-tight font-mono tracking-tighter">
              Dylan Bochman<br />
              <span className="block opacity-0 animate-fade-in-delay text-foreground/80 text-3xl">
                Sr. Site Reliability Engineer - Technical Incident Manager
              </span>
            </h2>

            <div
              className="absolute inset-0 text-6xl font-bold text-foreground/20 mb-2 leading-tight font-mono tracking-tighter animate-pulse"
              style={{ transform: 'translate(2px, 2px)' }}
            >
              Dylan Bochman<br />
              <span className="block opacity-0 animate-fade-in-delay text-foreground/20 text-3xl">
                Sr. Site Reliability Engineer - Technical Incident Manager
              </span>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-linear-to-r from-transparent via-foreground/5 to-transparent blur-xl"></div>
            <p className="text-xl text-foreground/90 mb-8 leading-relaxed max-w-3xl mx-auto relative bg-background/30 p-6 border border-foreground/10 backdrop-blur-xs">
              Specializing in <span className="text-foreground font-semibold border-b border-foreground/40">Reliability, Resilience, and Incident Management</span>, with experience spanning SRE
              and Product Management at <span className="font-mono text-foreground">Nvidia</span>, <span className="font-mono text-foreground">Groq</span>, <span className="font-mono text-foreground">HashiCorp</span>, and <span className="font-mono text-foreground">Spotify</span>. Focused on enhancing service availability
              and streamlining operations in complex AI and cloud environments.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8 px-4">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 hover-lift font-medium" asChild>
              <a href="mailto:dylanbochman@gmail.com" aria-label="Send email to Dylan Bochman">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </a>
            </Button>
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 hover-lift font-medium" asChild>
              <a href="https://www.linkedin.com/in/dbochman/" target="_blank" rel="noopener noreferrer" aria-label="Visit Dylan Bochman's LinkedIn profile">
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </a>
            </Button>
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 hover-lift font-medium" asChild>
              <a href="https://github.com/Dbochman" target="_blank" rel="noopener noreferrer" aria-label="Visit Dylan Bochman's GitHub profile">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </a>
            </Button>
          </div>
          
          <div className="flex justify-center gap-6 text-foreground/60 text-sm">
            <div className="flex items-center gap-2 border border-foreground/20 px-3 py-1 bg-foreground/5">
              <MapPin className="w-4 h-4" />
              <span>Remote</span>
            </div>
            <div className="flex items-center gap-2 border border-foreground/20 px-3 py-1 bg-foreground/5">
              <Activity className="w-4 h-4 text-green-400" />
              <span>Currently Employed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
