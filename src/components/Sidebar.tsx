
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { coreExpertise } from "@/data/expertise";
import { ExpertiseCard } from "./ExpertiseCard";
import { staggerContainer, staggerItem } from "@/lib/motion";

const Sidebar = () => {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const handleExpand = useCallback((index: number) => {
    setExpandedIndices(prev => new Set(prev).add(index));
  }, []);

  return (
    <div className="lg:sticky lg:top-24 space-y-6">
      {/* Core Expertise Card */}
      <Card className="bg-background/60 backdrop-blur-sm border-transparent">
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
                  isExpanded={expandedIndices.has(index)}
                  onExpand={() => handleExpand(index)}
                />
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
