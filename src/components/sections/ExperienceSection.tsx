import { experiences } from '@/data/experiences';

export default function ExperienceSection() {
  return (
    <section id="experience" className="scroll-mt-24">
      <p className="eyebrow mb-3">Background</p>
      <h2 className="text-3xl font-semibold tracking-tight mb-8">Professional Experience</h2>
      <div className="divide-y divide-border">
        {experiences.map(exp => (
          <article key={exp.company} className="py-6 first:pt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-semibold">{exp.company}</h3>
              <p className="text-sm font-mono text-muted-foreground">{exp.period}</p>
            </div>
            <p className="mt-2 font-medium">{exp.role}</p>
            <p className="mt-3 text-muted-foreground leading-relaxed">{exp.description}</p>
            <ul className="mt-4 space-y-2 list-disc pl-5 text-sm text-muted-foreground leading-relaxed">
              {exp.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
