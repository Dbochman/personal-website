
import React from 'react';
import { navigationItems } from "@/data/navigation";
import MobileNav from "@/components/MobileNav";

const Header = () => {
  return (
    <header className="bg-black/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
              Dylan Bochman
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navigationItems.map((item) => (
              <a 
                key={item.href}
                href={item.href} 
                className="text-white/70 hover:text-white transition-colors font-mono text-sm hover:underline decoration-2 underline-offset-4"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
};

export default Header;
