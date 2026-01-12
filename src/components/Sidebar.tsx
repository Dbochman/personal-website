
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { coreExpertise } from "@/data/expertise";
import { ExpertiseCard } from "./ExpertiseCard";

const Sidebar = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Core Expertise Card */}
      <Card className="bg-background/60 backdrop-blur-sm border-transparent">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Core Expertise</h3>
          <div className="space-y-2">
            {coreExpertise.map((item, index) => (
              <ExpertiseCard
                key={index}
                item={item}
                isExpanded={expandedIndex === index}
                onExpand={() => setExpandedIndex(index)}
                onCollapse={() => setExpandedIndex(null)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
