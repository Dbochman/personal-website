
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mail, Linkedin } from "lucide-react";
import SloGauge from "@/components/icons/SloGauge";
import UptimeTimeline from "@/components/icons/UptimeTimeline";

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 px-6 bg-gradient-to-t from-foreground/10 to-transparent relative mt-16">
      {/* SRE Background Elements - Hidden on mobile */}
      <div className="hidden md:block">
        <div className="absolute top-8 left-12 w-20 h-20 parallax-element" data-speed="0.1" title="SLO Dashboard">
          <SloGauge />
        </div>
        <div className="absolute bottom-20 right-16 w-28 h-12 parallax-element" data-speed="0.08" title="Service Uptime">
          <UptimeTimeline />
        </div>
      </div>
      
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <h3 className="text-4xl font-bold mb-8">
          Let's Connect
        </h3>
        <p className="text-foreground/80 mb-8 text-lg">
          Interested in discussing on-call tooling, challenging incidents, or potential opportunities?
        </p>
        <div className="flex justify-center gap-4 mb-12">
          <a href="mailto:dylanbochman@gmail.com" onClick={() => {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'resume_request', {
                event_category: 'engagement',
                event_label: 'email_contact'
              });
            }
          }}>
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 transition-all transform hover:scale-105 font-medium">
              <Mail className="w-4 h-4 mr-2" />
              Request Resume
            </Button>
          </a>
          <a href="https://www.linkedin.com/in/dbochman/" target="_blank" rel="noopener noreferrer" onClick={() => {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'linkedin_click', {
                event_category: 'engagement',
                event_label: 'external_link'
              });
            }
          }}>
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 transition-all transform hover:scale-105 font-medium">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
          </a>
        </div>
        <div className="text-foreground/40 text-sm border-t border-foreground/20 pt-8">
          <p>© 2025 Dylan Bochman. All rights reserved. | <a href="https://stats.uptimerobot.com/zquZllQfNJ" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/60 transition-colors">Status</a></p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
