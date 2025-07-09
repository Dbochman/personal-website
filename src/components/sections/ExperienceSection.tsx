
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/accordion";
import AccordionSection from "@/components/AccordionSection";
import { experiences } from "@/data/experiences";
import SpotifyLogo from '@/assets/logos/spotify.svg';
import HashiCorpLogo from '@/assets/logos/hashicorp.svg';
import HashiDarkLogo from '@/assets/logos/hashicorp-dark.svg';
import GroqLogo from '@/assets/logos/groq.svg';
import { useTheme } from '@/hooks/useTheme'

interface ExperienceSectionProps {
  value: string;
  onValueChange: (value: string) => void;
}

const ExperienceSection = ({ value, onValueChange }: ExperienceSectionProps) => {
  const { isDark } = useTheme()
  return (
    <section id="experience">
      <Accordion type="single" collapsible value={value} onValueChange={onValueChange} className="space-y-4">
        <AccordionSection
          title="Professional Experience"
          summary="Incident Management @ Groq · SRE @ HashiCorp & Spotify · 7+ years scaling reliability"
          value="experience"
        >
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <Card key={index} className="bg-background/60 backdrop-blur-sm border-foreground/20 hover:border-foreground/40 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-foreground font-semibold flex items-center gap-2">
                        {exp.company === 'Spotify' ? (
                            <img src={SpotifyLogo} alt="Spotify logo" className="w-5 h-5" />
                          ) : exp.company === 'Groq' ? (
                            <img src={GroqLogo} alt="Groq logo" className="w-5 h-5" />
                          ) : (
                            <>
                              {/* default (light) logo */}
                              <img
                                src={HashiDarkLogo}
                                alt="HashiCorp logo"
                                className="w-5 h-5 block dark:hidden"
                              />
                              {/* dark-mode logo */}
                              <img
                                src={HashiCorpLogo}
                                alt="HashiCorp logo"
                                className="w-5 h-5 hidden dark:block"
                              />
                            </>
                          )}
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
                        <span className="w-2 h-2 bg-foreground rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </AccordionSection>
      </Accordion>
    </section>
  );
};

export default ExperienceSection;
