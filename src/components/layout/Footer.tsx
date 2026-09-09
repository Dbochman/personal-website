import { TransitionLink } from '@/hooks/useViewTransition';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="text-muted-foreground text-sm border-t border-foreground/20 pt-8"
      style={{ viewTransitionName: 'site-footer' }}
    >
      <p>
        © {year} Dylan Bochman. All rights reserved. |{' '}
        <a
          href="https://stats.uptimerobot.com/zquZllQfNJ"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Status
        </a>{' '}
        |{' '}
        <TransitionLink to="/runbook" className="hover:text-foreground transition-colors">
          Runbook
        </TransitionLink>
      </p>
    </footer>
  );
}
