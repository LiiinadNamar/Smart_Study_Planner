import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  BarChart3,
  Library,
  FileText,
  Brain,
  Map,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/grades", icon: BarChart3, label: "Grades" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/materials", icon: FileText, label: "Materials" },
  { to: "/quizzes", icon: Brain, label: "Quizzes" },
  { to: "/roadmap", icon: Map, label: "Roadmap" },
];

export const Sidebar: React.FC<SidebarProps> = ({ onClose, collapsed = false }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={
        `h-screen shrink-0 glass-strong border-r border-surface-800 flex flex-col z-50 ` +
        `bg-surface-950/95 backdrop-blur-xl overflow-hidden transition-[width] duration-300 ` +
        (collapsed ? "w-20" : "w-64")
      }
    >
      {/* Logo */}
      <div
        className={
          `border-b border-surface-800 flex items-center justify-between ` +
          (collapsed ? "p-4" : "p-6")
        }
      >
        <div className={"flex items-center " + (collapsed ? "justify-center w-full" : "gap-3")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-surface-100 text-lg">SSP</h1>
              <p className="text-xs text-surface-500">Smart Study Planner</p>
            </div>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-surface-800/50 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={
          `flex-1 space-y-1 overflow-y-auto overflow-x-hidden ` +
          (collapsed ? "p-2" : "p-4")
        }
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => onClose?.()}
            aria-label={item.label}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-sm font-medium transition-colors duration-200 ` +
              (collapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3") +
              ` ${
                isActive
                  ? "bg-primary-600/20 text-primary-400 border border-primary-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-surface-400 hover:text-surface-100 hover:bg-surface-800/50"
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className={(collapsed ? "p-3" : "p-4") + " border-t border-surface-800"}>
        <div
          className={
            "flex items-center mb-3 " +
            (collapsed ? "justify-center" : "gap-3 px-3")
          }
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-sm font-bold text-white">
            {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-200 truncate">
                {user?.full_name || "User"}
              </p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
          className={
            "flex items-center rounded-xl text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full cursor-pointer " +
            (collapsed ? "justify-center px-3 py-2.5" : "gap-3 px-4 py-2.5")
          }
        >
          <LogOut size={18} />
          {!collapsed && "Log out"}
        </button>
      </div>
    </aside>
  );
};
