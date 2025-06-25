
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { coreExpertise } from "@/data/expertise";

const Sidebar = () => {
  return (
    <div className="space-y-6">
      {/* Core Expertise Card */}
      <Card className="bg-black/60 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-6">Core Expertise</h3>
          <div className="space-y-2">
            {coreExpertise.map((tech, index) => (
              <div 
                key={index}
                className="text-xs text-white/80 p-2 border border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
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
