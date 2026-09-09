import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="portfolio-shell py-16 sm:py-24">
      <p className="eyebrow mb-6">Reliability engineering · Incident management</p>
      <h1 className="max-w-4xl text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.05]">Dylan Bochman</h1>
      <p className="mt-8 max-w-2xl text-xl sm:text-2xl leading-relaxed text-muted-foreground">
        I lead incident response for AI inference infrastructure at NVIDIA.
        Previously, I worked on reliability at Groq, HashiCorp, and Spotify.
      </p>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Here I share tools and lessons from operating systems, coordinating incidents, and improving on-call work.</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <a className="portfolio-button" href="#selected-work">Explore the tools <ArrowDown size={16} aria-hidden="true" /></a>
        <Link className="portfolio-link py-3" to="/blog">Read the writing <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-mono">
        <a className="hover:underline" href="mailto:dylanbochman@gmail.com">Email</a>
        <a className="hover:underline" href="https://www.linkedin.com/in/dbochman/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a className="hover:underline" href="https://github.com/Dbochman" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </section>
  );
}
