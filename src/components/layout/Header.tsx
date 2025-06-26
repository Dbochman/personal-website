
import React from 'react';
import { navigationItems } from "@/data/navigation";
import MobileNav from "@/components/MobileNav";
import Link from 'next/link'
import { useNavigation } from '@/context/NavigationContext';
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

const Header = () => {
  const { openExperienceAccordion } = useNavigation();

  const handleExperienceClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    openExperienceAccordion();
  };

const [isDark, setIsDark] = useState(false)

useEffect(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }
}, [])

const toggleTheme = () => {
  document.documentElement.classList.toggle('dark')
  setIsDark(!isDark)
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
            {navigationItems.map((item) => (
              <a 
                key={item.href}
                href={item.href} 
                onClick={item.href === '#experience' ? handleExperienceClick : undefined}
                className="text-foreground/70 hover:text-foreground transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4"
              >
                {item.label}
              </a>
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
