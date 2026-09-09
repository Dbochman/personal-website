import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TabItem {
  /** The value that identifies this tab (matches TabsContent value) */
  value: string;
  /** Label displayed in the desktop TabsTrigger */
  label: string;
  /** Shorter label for the mobile Select dropdown. Falls back to label. */
  mobileLabel?: string;
}

export interface ResponsiveTabsListProps {
  /** Tab definitions */
  items: TabItem[];
  /** Accessible name for the mobile selector and desktop tab list. */
  label?: string;
  /** Currently active tab value (controlled) */
  value: string;
  /** Called when the user selects a tab (from either Select or TabsTrigger) */
  onValueChange: (value: string) => void;
  /** Additional className for the desktop TabsList */
  tabsListClassName?: string;
  /** Additional className for each desktop TabsTrigger */
  triggerClassName?: string;
  /** Additional className for the mobile SelectTrigger */
  selectClassName?: string;
}

export function ResponsiveTabsList({
  items,
  label = "View",
  value,
  onValueChange,
  tabsListClassName,
  triggerClassName,
  selectClassName,
}: ResponsiveTabsListProps) {
  return (
    <>
      {/* Mobile: Select dropdown (visible below sm breakpoint) */}
      <div className="sm:hidden">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger aria-label={label} className={cn("w-full", selectClassName)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.mobileLabel ?? item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Keep visibility outside the caller's grid/flex classes so they cannot
          expose duplicate desktop controls to mobile keyboard users. */}
      <div className="hidden sm:block">
        <TabsList aria-label={label} className={cn("text-foreground/80", tabsListClassName)}>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={triggerClassName}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </>
  );
}
