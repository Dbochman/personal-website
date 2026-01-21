
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { coreExpertise, allSkills } from "@/data/expertise";
import { ExpertiseCard } from "./ExpertiseCard";
import { staggerContainer, staggerItem } from "@/lib/motion";

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
    <div className="lg:sticky lg:top-24 space-y-6">
      {/* Core Expertise Card */}
      <Card className="bg-background/60 backdrop-blur-xs border-transparent">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Core Expertise</h3>
          <motion.div
            className="space-y-2"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {coreExpertise.map((item, index) => (
              <motion.div key={index} variants={staggerItem}>
                <ExpertiseCard
                  item={item}
                  index={index}
                  isExpanded={expandedIndices.has(index)}
                  onExpand={() => handleExpand(index)}
                  onCollapse={() => handleCollapse(index)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Crawlable skills list - visible to search engines and screen readers */}
          <div className="sr-only">
            <h4>Technical Skills</h4>
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
