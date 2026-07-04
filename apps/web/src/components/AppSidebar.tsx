import { Link, useRouterState } from "@tanstack/react-router";
import {
  FolderClosed,
  LayoutTemplate,
  Palette,
  History,
  Settings,
  HelpCircle,
  Plus,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { title: "My Files", to: "/", icon: FolderClosed },
  { title: "Templates", to: "/templates", icon: LayoutTemplate },
  { title: "Brand Kit", to: "/brand-kit", icon: Palette },
  { title: "Recent Projects", to: "/recent", icon: History },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col bg-sidebar px-5 py-6 text-sidebar-foreground">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
          <Presentation className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="font-display text-lg font-bold leading-tight text-white">Sophie's Space</div>
          <div className="text-xs text-sidebar-foreground/60">Pro Plan</div>
        </div>
      </div>

      <Link
        to="/create"
        className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        New Presentation
      </Link>

      <nav className="mt-8 flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border pt-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white">
          <Settings className="h-5 w-5" />
          Settings
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white">
          <HelpCircle className="h-5 w-5" />
          Help
        </button>
      </div>
    </aside>
  );
}
