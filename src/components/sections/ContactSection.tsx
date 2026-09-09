import { Footer } from '@/components/layout/Footer';

export default function ContactSection() {
  return (
    <section id="contact" className="border-t border-border">
      <div className="portfolio-shell py-12 sm:py-16">
        <p className="eyebrow mb-3">Get in touch</p>
        <h2 className="text-3xl font-semibold tracking-tight">Let's Connect</h2>
        <p className="mt-4 max-w-xl text-muted-foreground">Have a question about a tool, an incident response practice, or my work? Email is a good place to start.</p>
        <a className="portfolio-link mt-6 mb-12 break-all" href="mailto:dylanbochman@gmail.com">dylanbochman@gmail.com ↗</a>
        <Footer />
      </div>
    </section>
  );
}
