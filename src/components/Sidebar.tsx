
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { coreExpertise } from "@/data/expertise";
import { ExpertiseCard } from "./ExpertiseCard";
import { staggerContainer, staggerItem } from "@/lib/motion";

const Sidebar = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6">
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
                  isExpanded={expandedIndex === index}
                  onExpand={() => setExpandedIndex(index)}
                  onCollapse={() => setExpandedIndex(null)}
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
