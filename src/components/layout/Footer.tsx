import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="text-foreground/40 text-sm border-t border-foreground/20 pt-8">
      <p>
        © {year} Dylan Bochman. All rights reserved. |{' '}
        <a
          href="https://stats.uptimerobot.com/zquZllQfNJ"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground/60 transition-colors"
        >
          Status
        </a>{' '}
        |{' '}
        <Link to="/runbook" className="hover:text-foreground/60 transition-colors">
          Runbook
        </Link>
      </p>
    </footer>
  );
}
