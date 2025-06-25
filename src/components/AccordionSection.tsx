
import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AccordionSectionProps {
  title: string;
  summary: string;
  children: React.ReactNode;
  value: string;
}

const AccordionSection = ({ title, summary, children, value }: AccordionSectionProps) => {
  return (
    <AccordionItem value={value} className="border-white/20 bg-black/30 backdrop-blur-sm">
      <AccordionTrigger className="text-left px-6 py-4 hover:no-underline hover:bg-white/5 transition-colors">
        <div className="flex flex-col items-start gap-1 w-full">
          <h3 className="text-2xl font-bold text-white font-sans">{title}</h3>
          <p className="text-sm text-white/70 font-sans">{summary}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-0">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
};

export default AccordionSection;
