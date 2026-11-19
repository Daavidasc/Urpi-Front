import { Link, useLocation } from "wouter";
import {
  Package,
  LayoutDashboard,
  ArrowRightLeft,
  MessageSquare,
  Menu,
  Sun,
  Moon,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import urpiLogo from "@/assets/urpi-logo.png";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/movements", label: "Movimientos", icon: ArrowRightLeft },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/chat", label: "Asistente IA", icon: MessageSquare, isAi: true },
];

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="rounded-full w-9 h-9 border border-border bg-card text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </Button>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function SidebarContent({ collapsed, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col w-full h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground overflow-hidden">
      <div className={`py-5 flex items-center justify-center gap-2.5 ${collapsed ? "px-3" : "px-5"}`}>
        <img src={urpiLogo} alt="urpi" className="w-10 h-10 object-contain flex-shrink-0" />
        {!collapsed && (
          <h2 className="font-brand text-[28px] font-extrabold tracking-tight lowercase text-foreground leading-none">
            urpi
          </h2>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          const inner = collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all cursor-pointer ${
                      item.isAi
                        ? isActive
                          ? "bg-gradient-primary shadow-lg shadow-[#46557a]/25"
                          : "bg-gradient-primary opacity-90 hover:opacity-100"
                        : isActive
                        ? "bg-sidebar-accent text-primary"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  item.isAi
                    ? isActive
                      ? "bg-gradient-primary text-white shadow-lg shadow-[#46557a]/25"
                      : "bg-gradient-primary text-white opacity-90 hover:opacity-100"
                    : isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive && !item.isAi ? "text-primary" : ""}`} />
                <span className="flex-1 text-sm">{item.label}</span>
              </div>
            </Link>
          );

          return <div key={item.href}>{inner}</div>;
        })}
      </nav>

      <div className="px-2 pb-2">
        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <div
          className={`flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors cursor-pointer ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-sidebar flex-shrink-0">
            RC
          </div>
          {!collapsed && (
            <div className="text-sm flex-1 overflow-hidden">
              <p className="font-medium truncate text-[13px]">Raúl Cáceres</p>
              <p className="text-muted-foreground text-[11px] truncate">Administrador</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const sectionTitle = navItems.find((i) => i.href === location)?.label ?? "Dashboard";

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored !== "light") {
      window.document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-primary/30">
      <aside className={`hidden md:flex flex-shrink-0 z-10 h-screen sticky top-0 transition-all duration-300 ${collapsed ? "w-[64px]" : "w-[240px]"}`}>
        <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 md:px-8 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[240px] border-sidebar-border">
                <SidebarContent collapsed={false} onToggleCollapse={() => {}} />
              </SheetContent>
            </Sheet>
            <h1 className="text-[15px] font-semibold tracking-tight">{sectionTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
