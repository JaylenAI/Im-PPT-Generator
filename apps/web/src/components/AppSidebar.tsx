import { Link, useRouterState } from "@tanstack/react-router";
import { FolderClosed, LayoutTemplate, Palette, Settings, History, Plus, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { title: "내 파일", to: "/", icon: FolderClosed },
  { title: "템플릿", to: "/templates", icon: LayoutTemplate },
  { title: "브랜드 킷", to: "/brand-kit", icon: Palette },
  { title: "AI 설정", to: "/settings", icon: Settings },
  { title: "최근 작업", to: "/recent", icon: History },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col bg-sidebar px-5 py-6 text-sidebar-foreground">
      <Link to="/" className="flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
          <Presentation className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="font-display text-lg font-bold leading-tight text-white">Im PPT</div>
          <div className="text-xs text-sidebar-foreground/60">AI 프레젠테이션 에이전트</div>
        </div>
      </Link>

      <Link
        to="/create"
        className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        새 프레젠테이션
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

      <div className="mt-auto px-1 text-xs text-sidebar-foreground/40">v0.1.0 · 셀프호스트</div>
    </aside>
  );
}
