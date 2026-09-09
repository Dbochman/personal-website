
export interface NavItem {
  href: string;
  label: string;
}

export const navigationItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
];
