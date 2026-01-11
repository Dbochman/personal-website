import type { CompanyId } from '@/data/expertise';
import SpotifyLogo from '@/assets/logos/spotify.svg';
import HashiCorpLogo from '@/assets/logos/hashicorp.svg';
import HashiDarkLogo from '@/assets/logos/hashicorp-dark.svg';
import GroqLogo from '@/assets/logos/groq.svg';

interface CompanyLogoProps {
  company: CompanyId;
  className?: string;
}

export function CompanyLogo({ company, className = 'w-4 h-4' }: CompanyLogoProps) {
  switch (company) {
    case 'spotify':
      return <img src={SpotifyLogo} alt="Spotify" className={className} />;
    case 'groq':
      return <img src={GroqLogo} alt="Groq" className={className} />;
    case 'hashicorp':
      return (
        <>
          <img
            src={HashiDarkLogo}
            alt="HashiCorp"
            className={`${className} block dark:hidden`}
          />
          <img
            src={HashiCorpLogo}
            alt="HashiCorp"
            className={`${className} hidden dark:block`}
          />
        </>
      );
    default:
      return null;
  }
}
