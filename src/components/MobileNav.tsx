import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navigationItems } from "@/data/navigation";
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TransitionLink } from '@/hooks/useViewTransition';
import { staggerContainer, navItem } from '@/lib/motion';

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
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
          <SheetHeader className="p-6 border-b border-foreground/20">
            <SheetTitle className="text-foreground font-mono text-lg">Menu</SheetTitle>
            <SheetDescription className="sr-only">A list of navigation links.</SheetDescription>
          </SheetHeader>
          
          {/* Navigation items */}
          <nav className="flex-1 p-6">
            <motion.ul
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate={open ? 'visible' : 'hidden'}
            >
              {navigationItems.map((item) => (
                <motion.li key={item.href} variants={navItem}>
                  <TransitionLink
                    to={item.href}
                aria-current={(item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href)) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="block py-4 px-4 text-foreground/70 hover:text-foreground transition-colors font-mono text-lg hover:underline decoration-2 underline-offset-4 hover:bg-foreground/5 rounded-lg min-h-[44px] flex items-center"
                  >
                    {item.label}
                  </TransitionLink>
                </motion.li>
              ))}
            </motion.ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;
