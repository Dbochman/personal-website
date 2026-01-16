
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { coreExpertise } from "@/data/expertise";
import { ExpertiseCard } from "./ExpertiseCard";
import { staggerContainer, staggerItem } from "@/lib/motion";

const Sidebar = () => {
  // Track expansion order - last item is most recently expanded
  const [expandOrder, setExpandOrder] = useState<number[]>([]);

  const handleExpand = useCallback((index: number) => {
    setExpandOrder(prev => {
      // If already expanded, move to end (most recent)
      const filtered = prev.filter(i => i !== index);
      return [...filtered, index];
    });
  }, []);

  const handleCollapse = useCallback((index: number) => {
    setExpandOrder(prev => prev.filter(i => i !== index));
  }, []);

  // Only the most recently expanded card can collapse
  const newestIndex = expandOrder.length > 0 ? expandOrder[expandOrder.length - 1] : null;

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
                  isExpanded={expandOrder.includes(index)}
                  canCollapse={newestIndex === index}
                  onExpand={() => handleExpand(index)}
                  onCollapse={() => handleCollapse(index)}
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
