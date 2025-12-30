
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { coreExpertise } from "@/data/expertise";

const Sidebar = () => {
  return (
    <div className="space-y-6">
      {/* Core Expertise Card */}
      <Card className="bg-background/60 backdrop-blur-sm border-foreground/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Core Expertise</h3>
          <div className="space-y-2">
            {coreExpertise.map((tech, index) => (
              <div
                key={index}
                className="text-xs text-foreground/80 p-2 border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 transition-colors"
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
