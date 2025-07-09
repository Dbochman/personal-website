
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const GoalsSection = () => {
  return (
    <section id="goals" className="py-8">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-foreground mb-4">
          Career Goals
        </h3>
        <div className="w-20 h-0.5 bg-foreground mx-auto"></div>
      </div>
      <Card className="bg-background/30 backdrop-blur-sm border-foreground/20 hover:border-foreground/40 transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-foreground to-transparent"></div>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-lg text-foreground/90 leading-relaxed">
              I'm currently at <a href="https://groq.com/about-us/" className="font-mono text-foreground underline hover:text-foreground/80" target="_blank" rel="noopener noreferrer">Groq</a>,
              where I'm applying my resilience expertise and incident management skills to build
              <span className="text-foreground font-bold border-b-2 border-foreground/40"> sustainable response teams</span>.  
              My goal remains to empower engineers, drive operational excellence, and cultivate collaborative, blameless engineering cultures.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default GoalsSection;
