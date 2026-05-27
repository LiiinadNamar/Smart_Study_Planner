import React, { useEffect } from "react";
import {
  BookOpen,
  CheckSquare,
  BarChart3,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { useSubjectStore } from "../../store/subjectStore";
import { useTaskStore } from "../../store/taskStore";
import { useNavigate } from "react-router-dom";
import { format, isPast, isFuture, addDays } from "date-fns";

export const DashboardPage: React.FC = () => {
  const { subjects, fetch: fetchSubjects } = useSubjectStore();
  const { tasks, fetch: fetchTasks } = useTaskStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
    fetchTasks();
  }, []);

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doingTasks = tasks.filter((t) => t.status === "doing");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const overdueTasks = tasks.filter(
    (t) => t.deadline && isPast(new Date(t.deadline)) && t.status !== "done"
  );
  const upcomingTasks = tasks
    .filter(
      (t) =>
        t.deadline &&
        isFuture(new Date(t.deadline)) &&
        new Date(t.deadline) <= addDays(new Date(), 7) &&
        t.status !== "done"
    )
    .sort(
      (a, b) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
    );

  const stats = [
    {
      label: "Subjects",
      value: subjects.length,
      icon: BookOpen,
      color: "bg-primary-600",
    },
    {
      label: "Active Tasks",
      value: todoTasks.length + doingTasks.length,
      icon: CheckSquare,
      color: "bg-warning",
    },
    {
      label: "Completed",
      value: doneTasks.length,
      icon: BarChart3,
      color: "bg-success",
    },
    {
      label: "Overdue",
      value: overdueTasks.length,
      icon: AlertTriangle,
      color: "bg-danger",
    },
  ];

  return (
    <PageLayout title="Dashboard" subtitle="Your study overview at a glance">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className={`animate-fade-in stagger-${i + 1}`} hover>
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 shrink-0 rounded-xl ${stat.color} flex items-center justify-center shadow-sm`}
              >
                <stat.icon size={22} className="text-white shrink-0" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-100">
                  {stat.value}
                </p>
                <p className="text-sm text-surface-400">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card className="animate-fade-in stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-accent-400 shrink-0" />
            <h3 className="text-lg font-semibold text-surface-100 truncate">
              Upcoming This Week
            </h3>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="text-surface-500 text-sm">
              No upcoming tasks this week 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors cursor-pointer"
                  onClick={() => navigate("/tasks")}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 shrink-0 rounded-full priority-${task.priority}`}
                    />
                    <span className="text-sm text-surface-200 truncate">
                      {task.title}
                    </span>
                  </div>
                  <span className="text-xs text-surface-500">
                    {task.deadline
                      ? format(new Date(task.deadline), "MMM d")
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Subjects Overview */}
        <Card className="animate-fade-in stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-accent-400 shrink-0" />
            <h3 className="text-lg font-semibold text-surface-100 truncate">
              Your Subjects
            </h3>
          </div>
          {subjects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-surface-500 text-sm mb-3">
                No subjects yet. Add your first subject!
              </p>
              <button
                onClick={() => navigate("/subjects")}
                className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors cursor-pointer"
              >
                + Add Subject
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.slice(0, 5).map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors cursor-pointer"
                  onClick={() => navigate("/grades")}
                >
                  <span className="text-sm text-surface-200 font-medium">
                    {subject.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-surface-500">
                      Target: {subject.target_grade}%
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
                      {subject.credit_hours}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};
