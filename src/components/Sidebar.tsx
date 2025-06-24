
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Linkedin, ExternalLink, MapPin, Activity } from 'lucide-react';

const Sidebar = () => {
  const techStack = [
    "Site Reliability Engineering",
    "Incident Management",
    "SLO Monitoring",
    "Post-Incident Analysis",
    "Automated Response",
    "Cross-functional Communication"
  ];

  return (
    <div className="space-y-6">
      {/* Contact Card */}
      <Card className="bg-black/60 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 font-mono">Get In Touch</h3>
          <div className="space-y-3">
            <a href="mailto:dylanbochman@gmail.com" className="block">
              <Button size="sm" className="w-full bg-white text-black hover:bg-white/90 font-mono">
                <Mail className="w-4 h-4 mr-2" />
                Email Me
              </Button>
            </a>
            <a href="https://www.linkedin.com/in/dbochman/" className="block">
              <Button size="sm" className="w-full bg-white text-black hover:bg-white/90 font-mono">
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
            </a>
            <a href="/DylanBochmanResume.pdf" target="_blank" rel="noopener noreferrer" className="block">
              <Button size="sm" className="w-full bg-white text-black hover:bg-white/90 font-mono">
                <ExternalLink className="w-4 h-4 mr-2" />
                Resume
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className="bg-black/60 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 font-mono">Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/80 font-mono text-sm">
              <MapPin className="w-4 h-4" />
              <span>Remote</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 font-mono text-sm">
              <Activity className="w-4 h-4 text-green-400" />
              <span>Currently Employed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Expertise Card */}
      <Card className="bg-black/60 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 font-mono">Core Expertise</h3>
          <div className="space-y-2">
            {techStack.map((tech, index) => (
              <div 
                key={index}
                className="text-xs font-mono text-white/80 p-2 border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
              >
                {tech}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
