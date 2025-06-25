
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navigationItems } from "@/data/navigation";

const MobileNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-full bg-black/95 backdrop-blur-md border-white/20 p-0"
        >
          <SheetHeader className="flex flex-row justify-between items-center p-6 border-b border-white/20">
            <SheetTitle className="text-white font-mono text-lg">Menu</SheetTitle>
            <SheetDescription className="sr-only">A list of navigation links.</SheetDescription>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </SheetHeader>
          
          {/* Navigation items */}
          <nav className="flex-1 p-6">
            <ul className="space-y-4">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 px-4 text-white/70 hover:text-white transition-colors font-mono text-lg hover:underline decoration-2 underline-offset-4 hover:bg-white/5 rounded-lg min-h-[44px] flex items-center"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;
