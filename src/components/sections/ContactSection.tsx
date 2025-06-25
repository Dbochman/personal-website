
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 px-6 bg-gradient-to-t from-foreground/10 to-transparent relative mt-16">
      <div className="container mx-auto max-w-4xl text-center">
        <h3 className="text-4xl font-bold mb-8">
          Let's Connect
        </h3>
        <p className="text-foreground/80 mb-8 text-lg">
          Interested in discussing on-call tooling, challenging incidents, or potential opportunities?
        </p>
        <div className="flex justify-center gap-4 mb-12">
          <a href="mailto:dylanbochman@gmail.com">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 transition-all transform hover:scale-105 font-medium">
              <Mail className="w-4 h-4 mr-2" />
              Email Me
            </Button>
          </a>
          <a href="/DylanBochmanResume.pdf" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 transition-all transform hover:scale-105 font-medium">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Resume
            </Button>
          </a>
        </div>
        <div className="text-foreground/40 text-sm border-t border-foreground/20 pt-8">
          <p>© 2025 Dylan Bochman. All rights reserved.</p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
