
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
import { useNavigation } from '@/context/NavigationContext';
import { useState } from 'react';

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const { openExperienceAccordion } = useNavigation();

  const handleExperienceClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpen(false);
    const targetId = e.currentTarget.href.split('#')[1];
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    openExperienceAccordion();
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="p-2 text-foreground/70 hover:text-foreground transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-full bg-background/95 backdrop-blur-md border-foreground/20 p-0"
        >
          <SheetHeader className="flex flex-row justify-between items-center p-6 border-b border-foreground/20">
            <SheetTitle className="text-foreground font-mono text-lg">Menu</SheetTitle>
            <SheetDescription className="sr-only">A list of navigation links.</SheetDescription>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-foreground/70 hover:text-foreground transition-colors"
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
                    onClick={item.href === '#experience' ? handleExperienceClick : () => setOpen(false)}
                    className="block py-4 px-4 text-foreground/70 hover:text-foreground transition-colors font-mono text-lg hover:underline decoration-2 underline-offset-4 hover:bg-foreground/5 rounded-lg min-h-[44px] flex items-center"
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
