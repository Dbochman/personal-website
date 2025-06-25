
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const GoalsSection = () => {
  return (
    <section id="goals" className="py-8">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-white mb-4">
          Career Goals
        </h3>
        <div className="w-20 h-0.5 bg-white mx-auto"></div>
      </div>
      <Card className="bg-black/60 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-lg text-white/90 leading-relaxed">
              I'll soon be joining <a href="https://groq.com/about-us/" className="font-mono text-white underline hover:text-white/80" target="_blank" rel="noopener noreferrer">Groq</a>,
              where I look forward to applying my resilience expertise and incident management skills to build
              <span className="text-white font-bold border-b-2 border-white/40"> sustainable response teams</span>.  
              My goal remains to empower engineers, drive operational excellence, and cultivate collaborative, blameless engineering cultures.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default GoalsSection;
