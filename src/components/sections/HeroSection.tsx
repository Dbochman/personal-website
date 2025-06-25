
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, MapPin, Activity } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="py-20 px-6 relative">
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 border-2 border-foreground/20 rotate-45 animate-spin" style={{animationDuration: '20s'}}></div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-foreground/10 rotate-12 animate-pulse"></div>
      <div className="absolute bottom-20 left-1/4 w-6 h-6 bg-foreground rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-8">
          {/* Glitch effect title */}
          <div className="relative mb-6">
            <h2 className="text-6xl font-bold text-foreground mb-2 leading-tight font-mono tracking-tighter">
              Dylan Bochman<br />
              <span className="block opacity-0 animate-fade-in-delay text-foreground/80 text-4xl">
                Technical Incident Manager
              </span>
            </h2>

            <div
              className="absolute inset-0 text-6xl font-bold text-foreground/20 mb-2 leading-tight font-mono tracking-tighter animate-pulse"
              style={{ transform: 'translate(2px, 2px)' }}
            >
              Dylan Bochman<br />
              <span className="block opacity-0 animate-fade-in-delay text-foreground/20 text-4xl">
                Technical Incident Manager
              </span>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-foreground/5 to-transparent blur-xl"></div>
            <p className="text-xl text-foreground/90 mb-8 leading-relaxed max-w-3xl mx-auto relative bg-background/30 p-6 border border-foreground/10 backdrop-blur-sm">
              Specializing in <span className="text-foreground font-semibold border-b border-foreground/40">Reliability, Resilience, and Incident Management</span>, with experience spanning SRE 
              and Product Management at <span className="font-mono text-foreground">HashiCorp</span> and <span className="font-mono text-foreground">Spotify</span>. Focused on enhancing service availability 
              and streamlining operations in complex environments.
            </p>
          </div>
          
          <div className="flex justify-center gap-4 mb-8">
            <a href="mailto:dylanbochman@gmail.com">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 transition-all transform hover:scale-105 font-medium">
                <Mail className="w-4 h-4 mr-2" />
                Get In Touch
              </Button>
            </a>
            <a href="/DylanBochmanResume.pdf" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 transition-all transform hover:scale-105 font-medium">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Resume
              </Button>
            </a>
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
