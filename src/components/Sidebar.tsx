
import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { coreExpertise, allSkills } from "@/data/expertise";
import { ExpertiseCard } from "./ExpertiseCard";

const Sidebar = () => {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const handleExpand = useCallback((index: number) => {
    setExpandedIndices(prev => new Set(prev).add(index));
  }, []);

  const handleCollapse = useCallback((index: number) => {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Core Expertise Card */}
      <Card className="bg-transparent border-border shadow-none">
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-foreground mb-6">Core Expertise</h2>
          <div
            className="space-y-2"
          >
            {coreExpertise.map((item, index) => (
              <div key={index}>
                <ExpertiseCard
                  item={item}
                  index={index}
                  isExpanded={expandedIndices.has(index)}
                  onExpand={() => handleExpand(index)}
                  onCollapse={() => handleCollapse(index)}
                />
              </div>
            ))}
          </div>

          {/* Crawlable skills list - visible to search engines and screen readers */}
          <div className="sr-only">
            <h3>Technical Skills</h3>
            <ul>
              {allSkills.map(skill => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
