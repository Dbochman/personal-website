
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navigationItems } from "@/data/navigation";
import MobileNav from "@/components/MobileNav";
import { useNavigation } from '@/context/NavigationContext';
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

const Header = () => {
  const navigation = useNavigation();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const handleExperienceClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    // Only call openExperienceAccordion if we're within a NavigationProvider
    navigation?.openExperienceAccordion();
  };

const [isDark, setIsDark] = useState(false)

useEffect(() => {
  // Check URL parameter first, then fall back to system preference
  const urlParams = new URLSearchParams(window.location.search)
  const themeParam = urlParams.get('theme')

  let initialDark = false

  if (themeParam) {
    initialDark = themeParam === 'dark'
  } else if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    initialDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  if (initialDark) {
    document.documentElement.classList.add('dark')
    setIsDark(true)
  } else {
    document.documentElement.classList.remove('dark')
    setIsDark(false)
  }
}, [])

const toggleTheme = () => {
  document.documentElement.classList.toggle('dark')
  const newIsDark = !isDark
  setIsDark(newIsDark)
  // Dispatch custom event for favicon update
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark: newIsDark } }))
}

  return (
    <header className="bg-background/90 backdrop-blur-sm border-b border-foreground/20 sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground font-mono tracking-tight">
              Dylan Bochman
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navigationItems.map((item) => {
              const isHashLink = item.href.startsWith('#');
              const linkClass = "text-foreground/70 hover:text-foreground transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4";

              // If it's a hash link and we're not on the homepage, use Link to navigate home first
              if (isHashLink && !isHomePage) {
                return (
                  <Link
                    key={item.href}
                    to={`/${item.href}`}
                    className={linkClass}
                  >
                    {item.label}
                  </Link>
                );
              }

              // If it's a hash link on the homepage, use anchor tag for smooth scrolling
              if (isHashLink && isHomePage) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={item.href === '#experience' ? handleExperienceClick : undefined}
                    className={linkClass}
                  >
                    {item.label}
                  </a>
                );
              }

              // For regular routes, use Link
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={linkClass}
                >
                  {item.label}
                </Link>
              );
            })}
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
