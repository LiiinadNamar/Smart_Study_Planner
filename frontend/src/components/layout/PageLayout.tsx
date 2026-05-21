import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
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
  const location = useLocation();

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-start">
      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - sliding behavior */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-strong border-b border-surface-800 px-4 md:px-8 py-5">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 -ml-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-surface-800/50 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>
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
