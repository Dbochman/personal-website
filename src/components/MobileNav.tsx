
import { Menu } from 'lucide-react';
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
import { Link, useLocation } from 'react-router-dom';

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
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
    navItemsToShow = [{ href: "/", label: "Home" }, { href: "/blog", label: "Blog" }, { href: "/runbook", label: "Runbook" }];
  }

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
            <ul className="space-y-4">
              {navItemsToShow.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 px-4 text-foreground/70 hover:text-foreground transition-colors font-mono text-lg hover:underline decoration-2 underline-offset-4 hover:bg-foreground/5 rounded-lg min-h-[44px] flex items-center"
                  >
                    {item.label}
                  </Link>
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
