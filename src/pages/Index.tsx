import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Calendar, ExternalLink, Linkedin, Terminal, Activity, Zap } from "lucide-react";
import { useParallax } from "@/hooks/useParallax";
import SimpleTriangle from "@/components/icons/SimpleTriangle";
import HexagonGrid from "@/components/icons/HexagonGrid";
import CircuitPattern from "@/components/icons/CircuitPattern";
import ServerStack from "@/components/icons/ServerStack";
import DataFlow from "@/components/icons/DataFlow";
import GeometricRings from "@/components/icons/GeometricRings";
import AlertBeacon from "@/components/icons/AlertBeacon";
import QuantumGrid from "@/components/icons/QuantumGrid";
import MetricWave from "@/components/icons/MetricWave";
import MobileNav from "@/components/MobileNav";
import SpotifyLogo from '@/assets/logos/spotify.svg'
import HashiCorpLogo from '@/assets/logos/hashicorp.svg'


const Index = () => {
  useParallax();

  const skills = [
    "Site Reliability Engineering",
    "Incident Command & Coordination",
    "Post-Incident Analysis and Reporting",
    "SLO Monitoring and Strategy",
    "Retrospective Preparation and Facilitation",
    "Automated Incident Response",
    "Cross-functional Stakeholder Communication",
    "Operational Readiness & Game Day Planning"
  ];

  const experiences = [
    {
      company: "HashiCorp (IBM)",
      role: "SRE II",
      period: "2024 - 2025",
      description: "Leading initiatives to strengthen service-level infrastructure and optimize availability monitoring in complex cloud environments.",
      highlights: [
       "Presented incident and reliability metrics to senior leadership to guide prioritization and clarify operational risk",
       "Partnered with Legal and Comms to standardize customer-facing emergency messaging",
       "Acted as primary Incident Commander for high-severity incidents involving engineering, product, and support teams"
     ]
    },
    {
      company: "Spotify",
      role: "SRE & Reliability PM",
      period: "2017 - 2023",
      description: "Developed scalable infrastructure solutions while bridging technical and product perspectives.",
      highlights: [
        "Improved organizational reliability at scale with Synthetic Testing",
        "Optimized on-call practices for incident on-call team",
        "Developed SLO Backstage Plugin and facilitated SLO workshops"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'pulse 4s ease-in-out infinite'
        }}></div>
      </div>

      {/* Parallax Décor Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Simple Triangle - Top Left */}
        <div 
          className="absolute top-20 left-[5%] w-16 h-16"
          data-speed="0.2"
        >
          <SimpleTriangle />
        </div>
        
        {/* Hexagon Grid - Top Right */}
        <div 
          className="absolute top-32 right-[10%] w-24 h-24"
          data-speed="0.3"
        >
          <HexagonGrid />
        </div>
        
        {/* Circuit Pattern - Middle Left */}
        <div 
          className="absolute top-[45%] left-[8%] w-40 h-24"
          data-speed="0.4"
        >
          <CircuitPattern />
        </div>
        
        {/* Server Stack - Bottom Right */}
        <div 
          className="absolute bottom-20 right-[12%] w-20 h-32"
          data-speed="0.35"
        >
          <ServerStack />
        </div>

        {/* Data Flow - Top Center */}
        <div 
          className="absolute top-16 left-[40%] w-36 h-20"
          data-speed="0.25"
        >
          <DataFlow />
        </div>

        {/* Geometric Rings - Middle Right */}
        <div 
          className="absolute top-[35%] right-[25%] w-28 h-28"
          data-speed="0.45"
        >
          <GeometricRings />
        </div>

        {/* Alert Beacon - Bottom Left */}
        <div 
          className="absolute bottom-32 left-[15%] w-20 h-20"
          data-speed="0.3"
        >
          <AlertBeacon />
        </div>

        {/* Quantum Grid - Middle Center */}
        <div 
          className="absolute top-[60%] left-[45%] w-32 h-32"
          data-speed="0.55"
        >
          <QuantumGrid />
        </div>

        {/* Metric Wave - Bottom Center */}
        <div 
          className="absolute bottom-8 left-[35%] w-40 h-16"
          data-speed="0.2"
        >
          <MetricWave />
        </div>
      </div>

      {/* Header with Terminal Style */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">

              <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
                Dylan Bochman
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-6">
              <a href="#about" className="text-white/70 hover:text-white transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4">
                About
              </a>
              <a href="#experience" className="text-white/70 hover:text-white transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4">
                Experience
              </a>
              <a href="#goals" className="text-white/70 hover:text-white transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4">
                Goals
              </a>
              <a href="#contact" className="text-white/70 hover:text-white transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4">
                Contact
              </a>
            </nav>

            {/* Mobile Navigation */}
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section with Geometric Elements */}
      <section className="py-20 px-6 relative">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-20 h-20 border-2 border-white/20 rotate-45 animate-spin" style={{animationDuration: '20s'}}></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-white/10 rotate-12 animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-6 h-6 bg-white rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="mb-8">
            {/* Glitch effect title */}
            <div className="relative mb-6">
              <h2 className="text-6xl font-bold text-white mb-2 leading-tight font-mono tracking-tighter">
                Dylan Bochman<br />
                <span className="block opacity-0 animate-fade-in-delay text-white/80 text-4xl">
                  Technical Incident Manager
                </span>
              </h2>

              <div
                className="absolute inset-0 text-6xl font-bold text-white/20 mb-2 leading-tight font-mono tracking-tighter animate-pulse"
                style={{ transform: 'translate(2px, 2px)' }}
              >
                Dylan Bochman<br />
                <span className="block opacity-0 animate-fade-in-delay text-white/20 text-4xl">
                  Technical Incident Manager
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl"></div>
              <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto relative bg-black/30 p-6 border border-white/10 backdrop-blur-sm">
                Specializing in <span className="text-white font-semibold border-b border-white/40">Reliability, Resilience, and Incident Management</span>, with experience spanning SRE 
                and Product Management at <span className="font-mono text-white">HashiCorp</span> and <span className="font-mono text-white">Spotify</span>. Focused on enhancing service availability 
                and streamlining operations in complex environments.
              </p>
            </div>
            
            <div className="flex justify-center gap-4 mb-8">
              <a href="mailto:dylanbochman@gmail.com">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 transition-all transform hover:scale-105 font-mono">
                <Mail className="w-4 h-4 mr-2" />
                Get In Touch
              </Button>
            </a>
              <a href="/DylanBochmanResume.pdf" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 transition-all transform hover:scale-105 font-mono">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Resume
              </Button>
            </a>
            </div>
            
            <div className="flex justify-center gap-6 text-white/60 font-mono text-sm">
              <div className="flex items-center gap-2 border border-white/20 px-3 py-1 bg-white/5">
                <MapPin className="w-4 h-4" />
                <span>Remote</span>
              </div>
              <div className="flex items-center gap-2 border border-white/20 px-3 py-1 bg-white/5">
                <Activity className="w-4 h-4 text-green-400" />
                <span>Currently Employed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section with Matrix Effect */}
      <section id="about" className="py-16 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-white mb-4 font-mono">
               Core Expertise
            </h3>
            <div className="w-20 h-0.5 bg-white mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {skills.map((skill, index) => (
              <div 
                key={index} 
                className="group relative p-4 border border-white/20 bg-white/5 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:border-white/40"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="absolute top-2 right-2 w-2 h-2 bg-white/40 group-hover:bg-white"></div>
                <span className="text-sm font-mono text-white/90 group-hover:text-white">
                  {skill}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section with Timeline */}
      <section id="experience" className="py-16 px-6 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h3 className="relative z-10 inline-block bg-black px-4 text-4xl font-bold text-white mb-4 font-mono">
              Professional Experience
            </h3>
            <div className="w-20 h-0.5 bg-white mx-auto"></div>
          </div>
          
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-px w-0.5 bg-white/20 h-full top-0"></div>
          
          <div className="space-y-12">
            {experiences.map((exp, index) => (
              <div key={index} className={`relative ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                {/* Timeline dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full border-4 border-black z-10"></div>
                
                <Card className={`hover:shadow-xl transition-all duration-300 bg-black border-white/20 hover:border-white/40 transform hover:scale-105 relative ${
                  index % 2 === 0 ? 'mr-auto ml-0 max-w-md' : 'ml-auto mr-0 max-w-md'
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl text-white font-mono flex items-center gap-2">
                          <img
                            src={exp.company === 'Spotify' ? SpotifyLogo : HashiCorpLogo}
                            alt={`${exp.company} logo`}
                            className="w-6 h-6"        // 24×24 px
                          />
                          {exp.company}
                        </CardTitle>
                        <CardDescription className="text-lg text-white/80 font-medium font-mono">
                          {exp.role}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-white/80 border-white/40 bg-white/10 font-mono">
                        {exp.period}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-left space-y-4">
                    <p className="text-white/80 mb-4 leading-relaxed">{exp.description}</p>
                    <ul className="space-y-2">
                      {exp.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-3 text-white/80">
                          <span className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></span>
                          <span className="font-mono text-sm">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Goals Section */}
      <section id="goals" className="py-16 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-white mb-4 font-mono">
              Career Goals
            </h3>
            <div className="w-20 h-0.5 bg-white mx-auto"></div>
          </div>
          <Card className="bg-black/60 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-lg text-white/90 leading-relaxed font-mono">
                  I’ll soon be joining <a href="https://groq.com/about-us/" className="font-mono text-white underline hover:text-white/80" target="_blank" rel="noopener noreferrer">Groq</a>,
                  where I look forward to applying my resilience expertise and incident management skills to build
                  <span className="text-white font-bold border-b-2 border-white/40"> sustainable response teams</span>.  
                  My goal remains to empower engineers, drive operational excellence, and cultivate collaborative, blameless engineering cultures.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-6 bg-gradient-to-t from-white/10 to-transparent relative">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-4xl font-bold mb-8 font-mono">
             Let's Connect
          </h3>
          <p className="text-white/80 mb-8 text-lg font-mono">
            Interested in discussing Incident management, Reliability challenges, or potential opportunities?
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <a href="mailto:dylanbochman@gmail.com">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 transition-all transform hover:scale-105 font-mono">
              <Mail className="w-4 h-4 mr-2" />
              Email Me
            </Button>
          </a>
            <a href="https://www.linkedin.com/in/dbochman/">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 transition-all transform hover:scale-105 font-mono">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
          </a>
          </div>
          <div className="text-white/40 text-sm font-mono border-t border-white/20 pt-8">
            <p>© 2025 Dylan Bochman. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
