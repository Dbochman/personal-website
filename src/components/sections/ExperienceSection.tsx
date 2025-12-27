import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/accordion";
import AccordionSection from "@/components/AccordionSection";
import { experiences } from "@/data/experiences";
import { slowStaggerContainer, slowStaggerItem } from '@/lib/motion';
import SpotifyLogo from '@/assets/logos/spotify.svg';
import HashiCorpLogo from '@/assets/logos/hashicorp.svg';
import HashiDarkLogo from '@/assets/logos/hashicorp-dark.svg';
import GroqLogo from '@/assets/logos/groq.svg';
import NvidiaLogo from '@/assets/logos/nvidia.png';

const EXPAND_DELAY = 1000; // 1 second before expanding on hover

// Company logo configuration for consistent rendering
const companyLogos: Record<string, { light: string; dark?: string; alt: string }> = {
  'Nvidia': { light: NvidiaLogo, alt: 'Nvidia logo' },
  'Groq': { light: GroqLogo, alt: 'Groq logo' },
  'Spotify': { light: SpotifyLogo, alt: 'Spotify logo' },
  'HashiCorp (IBM)': { light: HashiDarkLogo, dark: HashiCorpLogo, alt: 'HashiCorp logo' }
};

interface ExperienceSectionProps {
  value: string;
  onValueChange: (value: string) => void;
}

const ExperienceSection = ({ value, onValueChange }: ExperienceSectionProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate when accordion is open (value === 'experience')
  const isOpen = value === 'experience';

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);

    // If already open, no need to set timeout
    if (isOpen) return;

    // Schedule expansion after delay
    expandTimeoutRef.current = setTimeout(() => {
      onValueChange('experience');
      expandTimeoutRef.current = null;
    }, EXPAND_DELAY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    // Cancel any pending expand
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
  };

  return (
    <section id="experience">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`transition-all duration-200 rounded-lg ${isHovered && !isOpen ? 'ring-2 ring-foreground/20' : ''}`}
      >
        <Accordion type="single" collapsible value={value} onValueChange={onValueChange} className="space-y-4">
          <AccordionSection
          title="Professional Experience"
          summary="Incident Management @ Nvidia · Previously Groq, HashiCorp & Spotify · 7+ years scaling reliability"
          value="experience"
        >
          <motion.div
            className="space-y-8"
            variants={slowStaggerContainer}
            initial="hidden"
            animate={isOpen ? 'visible' : 'hidden'}
          >
            {experiences.map((exp, index) => (
              <motion.div key={index} variants={slowStaggerItem}>
                <Card className="bg-background/60 backdrop-blur-xs border-foreground/20 hover:border-foreground/40 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-foreground font-semibold flex items-center gap-2">
                        {companyLogos[exp.company] ? (
                          companyLogos[exp.company].dark ? (
                            <>
                              {/* Light mode logo */}
                              <img
                                src={companyLogos[exp.company].light}
                                alt={companyLogos[exp.company].alt}
                                className="w-5 h-5 block dark:hidden"
                              />
                              {/* Dark mode logo */}
                              <img
                                src={companyLogos[exp.company].dark}
                                alt={companyLogos[exp.company].alt}
                                className="w-5 h-5 hidden dark:block"
                              />
                            </>
                          ) : (
                            <img
                              src={companyLogos[exp.company].light}
                              alt={companyLogos[exp.company].alt}
                              className="w-5 h-5"
                            />
                          )
                        ) : null}
                        {exp.company}
                      </CardTitle>
                      <CardDescription className="text-lg text-foreground/80 font-medium">
                        {exp.role}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-foreground/80 border-foreground/40 bg-foreground/10 font-mono text-xs">
                      {exp.period}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground/80 leading-relaxed">{exp.description}</p>
                  <ul className="space-y-2">
                    {exp.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground/80">
                        <span className="w-2 h-2 bg-foreground rounded-full mt-2 shrink-0"></span>
                        <span className="text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          </AccordionSection>
        </Accordion>
      </div>
    </section>
  );
};

export default ExperienceSection;
