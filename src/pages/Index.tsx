
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Calendar, ExternalLink, Github, Linkedin } from "lucide-react";

const Index = () => {
  const skills = [
    "Site Reliability Engineering",
    "Incident Management",
    "Service Monitoring",
    "Infrastructure Automation",
    "Product Management",
    "On-call Optimization",
    "Scalability Solutions",
    "Availability Engineering"
  ];

  const experiences = [
    {
      company: "HashiCorp",
      role: "Site Reliability Engineer",
      period: "Present",
      description: "Leading initiatives to strengthen service-level infrastructure and optimize availability monitoring in complex cloud environments.",
      highlights: [
        "Enhanced service availability through improved monitoring systems",
        "Streamlined incident response processes",
        "Elevated incident management practices organization-wide"
      ]
    },
    {
      company: "Spotify",
      role: "Engineering & Product Management",
      period: "Previous",
      description: "Developed scalable infrastructure solutions while bridging technical and product perspectives.",
      highlights: [
        "Improved organizational reliability at scale",
        "Optimized on-call practices for engineering teams",
        "Delivered product management expertise in technical environments"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Dylan Bochman</h1>
            <nav className="flex gap-6">
              <a href="#about" className="text-slate-600 hover:text-blue-600 transition-colors">About</a>
              <a href="#experience" className="text-slate-600 hover:text-blue-600 transition-colors">Experience</a>
              <a href="#goals" className="text-slate-600 hover:text-blue-600 transition-colors">Goals</a>
              <a href="#contact" className="text-slate-600 hover:text-blue-600 transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <h2 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Site Reliability Engineer
            </h2>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Specializing in Reliability and Incident Management, with experience spanning Engineering 
              and Product Management at HashiCorp and Spotify. Focused on enhancing service availability 
              and streamlining operations in complex environments.
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Mail className="w-4 h-4 mr-2" />
                Get In Touch
              </Button>
              <Button variant="outline" size="lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Resume
              </Button>
            </div>
            <div className="flex justify-center gap-4 text-slate-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>Remote</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="about" className="py-16 px-6 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-slate-900 mb-8 text-center">Core Expertise</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {skills.map((skill, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-sm py-2 px-4 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-slate-900 mb-12 text-center">Professional Experience</h3>
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl text-slate-900">{exp.company}</CardTitle>
                      <CardDescription className="text-lg text-blue-600 font-medium">
                        {exp.role}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-slate-600">
                      {exp.period}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4 leading-relaxed">{exp.description}</p>
                  <ul className="space-y-2">
                    {exp.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Career Goals Section */}
      <section id="goals" className="py-16 px-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-slate-900 mb-8 text-center">Career Goals</h3>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <p className="text-lg text-slate-700 leading-relaxed text-center">
                I'm seeking a role that leverages my technical expertise and product management skills 
                to develop <strong className="text-blue-700">scalable infrastructure solutions</strong>, 
                empowering engineers and driving operational excellence. My goal is to continue building 
                systems that enhance reliability while fostering collaborative, efficient engineering cultures.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-6 bg-slate-900 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold mb-8">Let's Connect</h3>
          <p className="text-slate-300 mb-8 text-lg">
            Interested in discussing reliability engineering, infrastructure challenges, or potential opportunities?
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Mail className="w-4 h-4 mr-2" />
              Email Me
            </Button>
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </div>
          <div className="text-slate-400 text-sm">
            <p>© 2024 Dylan Bochman. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
