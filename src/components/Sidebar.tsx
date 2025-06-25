
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const Sidebar = () => {
  const techStack = [
    "Site Reliability Engineering",
    "Incident Command & Coordination",
    "Post-Incident Analysis and Reporting",
    "SLO Monitoring and Strategy",
    "Retrospective Preparation and Facilitation",
    "Cross-functional Stakeholder Communication",
    "Operational Readiness & Game Day Planning",
    "Automated Incident Response"
  ];

  return (
    <div className="space-y-6">
      {/* Core Expertise Card */}
      <Card className="bg-black/60 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 font-mono">Core Expertise</h3>
          <div className="space-y-2">
            {techStack.map((tech, index) => (
              <div 
                key={index}
                className="text-xs font-mono text-white/80 p-2 border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
              >
                {tech}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
