
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/accordion";
import AccordionSection from "@/components/AccordionSection";
import { experiences } from "@/data/experiences";
import SpotifyLogo from '@/assets/logos/spotify.svg';
import HashiCorpLogo from '@/assets/logos/hashicorp.svg';

const ExperienceSection = () => {
  return (
    <section id="experience">
      <Accordion type="single" collapsible className="space-y-4">
        <AccordionSection
          title="Professional Experience"
          summary="SRE leadership at HashiCorp & Spotify · 7+ years scaling reliability"
          value="experience"
        >
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <Card key={index} className="bg-black/60 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-white font-semibold flex items-center gap-2">
                        <img
                          src={exp.company === 'Spotify' ? SpotifyLogo : HashiCorpLogo}
                          alt={`${exp.company} logo`}
                          className="w-5 h-5"
                        />
                        {exp.company}
                      </CardTitle>
                      <CardDescription className="text-lg text-white/80 font-medium">
                        {exp.role}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-white/80 border-white/40 bg-white/10 font-mono text-xs">
                      {exp.period}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white/80 leading-relaxed">{exp.description}</p>
                  <ul className="space-y-2">
                    {exp.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/80">
                        <span className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></span>
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
