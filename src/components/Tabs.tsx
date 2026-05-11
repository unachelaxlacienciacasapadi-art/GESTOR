import { useState, ReactNode } from "react";
import { cn } from "../lib/utils";

interface Tab {
  value: string;
  label: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  activeTab: string;
  onClick: (value: string) => void;
  children: ReactNode;
}

interface TabsContentProps {
  value: string;
  activeTab: string;
  children: ReactNode;
}

// ─────────────────────────────────────────────
// Context-free Tabs — use via HomeTabs wrapper
// ─────────────────────────────────────────────

export function HomeTabs({ tabs, defaultValue, children }: TabsProps) {
  const [active, setActive] = useState(defaultValue);

  return (
    <div className="w-full">
      {/* Tab Bar */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#222222] pt-2 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActive(tab.value)}
                className={cn(
                  "flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                  active === tab.value
                    ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    : "text-[#A0A0A0] hover:text-white hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      {Array.isArray(children) &&
        children.map((child: any) => {
          if (!child || child.props?.tabValue !== active) return null;
          return child;
        })}
    </div>
  );
}

export function TabPanel({ tabValue, children, className }: { tabValue: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-6xl mx-auto px-4 py-8 animate-fade-in", className)}>
      {children}
    </div>
  );
}
