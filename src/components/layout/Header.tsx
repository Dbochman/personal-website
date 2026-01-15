import { useLocation } from 'react-router-dom';
import { navigationItems } from "@/data/navigation";
import MobileNav from "@/components/MobileNav";
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { TransitionLink } from '@/hooks/useViewTransition';

const Header = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const isBlogPage = location.pathname.startsWith('/blog');
  const isProjectsPage = location.pathname.startsWith('/projects');
  const isRunbookPage = location.pathname === '/runbook';

  // Show simplified nav on blog, projects, and runbook pages
  let navItemsToShow = navigationItems;
  if (isBlogPage) {
    navItemsToShow = [{ href: "/", label: "Home" }, { href: "/projects", label: "Projects" }, { href: "/blog", label: "Blog" }];
  } else if (isProjectsPage) {
    navItemsToShow = [{ href: "/", label: "Home" }, { href: "/projects", label: "Projects" }, { href: "/blog", label: "Blog" }];
  } else if (isRunbookPage) {
    navItemsToShow = [{ href: "/", label: "Home" }, { href: "/blog", label: "Blog" }];
  }

  return (
    <header className="bg-background/90 backdrop-blur-sm border-b border-foreground/20 sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TransitionLink to="/" className="text-2xl font-bold text-foreground font-mono tracking-tight hover:no-underline">
              Dylan Bochman
            </TransitionLink>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navItemsToShow.map((item) => (
              <TransitionLink
                key={item.href}
                to={item.href}
                className="text-foreground/70 hover:text-foreground transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4"
              >
                {item.label}
              </TransitionLink>
            ))}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              aria-pressed={isDark}
              className="text-foreground/70 hover:text-foreground transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4"
            >
              {isDark ? <Sun data-testid="icon-sun" className="w-5 h-5"/> : <Moon data-testid="icon-moon" className="w-5 h-5"/>}
            </button>
          </nav>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              aria-pressed={isDark}
              className="p-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
