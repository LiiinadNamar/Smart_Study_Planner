import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  action,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const location = useLocation();

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    setIsDesktop(media.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (!isDesktop) setIsSidebarOpen(false);
  }, [location.pathname, isDesktop]);

  // When switching to mobile viewport, close any open desktop sidebar
  useEffect(() => {
    if (!isDesktop) setIsSidebarOpen(false);
  }, [isDesktop]);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {isSidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar (off-canvas) */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar (in-flow, no overlap) */}
      {isSidebarOpen && (
        <div className="hidden md:block sticky top-0 h-screen">
          <Sidebar collapsed={isSidebarCollapsed} />
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-strong border-b border-surface-800 px-4 md:px-8 py-5">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <button
              className="md:hidden p-2 -ml-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-surface-800/50 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>

            {/* Desktop menu + collapse */}
            <div className="hidden md:flex items-center gap-2 -ml-2">
              <button
                className="p-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-surface-800/50 transition-colors"
                onClick={() => setIsSidebarOpen((v) => !v)}
                aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                <Menu size={22} />
              </button>

              {isSidebarOpen && (
                <button
                  className="p-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-surface-800/50 transition-colors"
                  onClick={() => setIsSidebarCollapsed((v) => !v)}
                  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                </button>
              )}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-surface-100">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-surface-400 mt-1 hidden sm:block">{subtitle}</p>
                )}
              </div>
              {action && <div>{action}</div>}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
};
