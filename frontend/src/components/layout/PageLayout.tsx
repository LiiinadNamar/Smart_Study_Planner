import React from "react";
import { Sidebar } from "./Sidebar";

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
  return (
    <div className="min-h-screen flex items-start">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-strong border-b border-surface-800 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-100">{title}</h1>
              {subtitle && (
                <p className="text-sm text-surface-400 mt-1">{subtitle}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
};
