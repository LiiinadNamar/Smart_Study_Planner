import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  BarChart3,
  FileText,
  Brain,
  Map,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/grades", icon: BarChart3, label: "Grades" },
  { to: "/materials", icon: FileText, label: "Materials" },
  { to: "/quizzes", icon: Brain, label: "Quizzes" },
  { to: "/roadmap", icon: Map, label: "Roadmap" },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 glass-strong border-r border-surface-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-surface-100 text-lg">SSP</h1>
            <p className="text-xs text-surface-500">Smart Study Planner</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? "bg-primary-600/20 text-primary-400 border border-primary-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-surface-400 hover:text-surface-100 hover:bg-surface-800/50 hover:translate-x-1"
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-surface-800">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-sm font-bold text-white">
            {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-200 truncate">
              {user?.full_name || "User"}
            </p>
            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full cursor-pointer"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
};
