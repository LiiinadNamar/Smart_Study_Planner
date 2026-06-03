import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  BarChart3,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { useSubjectStore } from "../../store/subjectStore";
import { useTaskStore } from "../../store/taskStore";
import { useNavigate } from "react-router-dom";
import { format, isPast, isFuture, addDays } from "date-fns";
import api from "../../services/api";
import type { GradeForecast } from "../../types";

export const DashboardPage: React.FC = () => {
  const { subjects, fetch: fetchSubjects } = useSubjectStore();
  const { tasks, fetch: fetchTasks } = useTaskStore();
  const navigate = useNavigate();
  const [forecastBySubject, setForecastBySubject] = useState<
    Record<string, GradeForecast | null>
  >({});

  useEffect(() => {
    fetchSubjects();
    fetchTasks();
  }, []);

  const uniqueSubjects = useMemo(() => {
    const seen = new Set<string>();
    return subjects.filter((subject) => {
      if (seen.has(subject.id)) return false;
      seen.add(subject.id);
      return true;
    });
  }, [subjects]);

  const subjectById = useMemo(() => {
    return new Map(uniqueSubjects.map((subject) => [subject.id, subject]));
  }, [uniqueSubjects]);

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks]
  );

  const doneTasks = useMemo(
    () => tasks.filter((t) => t.status === "done"),
    [tasks]
  );

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.deadline && isPast(new Date(t.deadline)) && t.status !== "done"
      ),
    [tasks]
  );

  const upcomingTasks = useMemo(
    () =>
      tasks
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
        ),
    [tasks]
  );

  const pendingCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of pendingTasks) {
      if (!task.subject_id) continue;
      counts[task.subject_id] = (counts[task.subject_id] || 0) + 1;
    }
    return counts;
  }, [pendingTasks]);

  useEffect(() => {
    let cancelled = false;

    const loadForecasts = async () => {
      if (uniqueSubjects.length === 0) {
        setForecastBySubject({});
        return;
      }

      const entries = await Promise.all(
        uniqueSubjects.map(async (subject) => {
          try {
            const res = await api.get<GradeForecast>(
              `/grades/forecast/${subject.id}`
            );
            return [subject.id, res.data] as const;
          } catch {
            return [subject.id, null] as const;
          }
        })
      );

      if (cancelled) return;

      const next: Record<string, GradeForecast | null> = {};
      for (const [id, forecast] of entries) {
        next[id] = forecast;
      }
      setForecastBySubject(next);
    };

    loadForecasts();

    return () => {
      cancelled = true;
    };
  }, [uniqueSubjects]);

  const stats = [
    {
      label: "Subjects",
      value: uniqueSubjects.length,
      icon: BookOpen,
      color: "bg-primary-600",
      route: "/subjects",
    },
    {
      label: "Completed",
      value: doneTasks.length,
      icon: BarChart3,
      color: "bg-success",
      route: "/tasks",
    },
    {
      label: "Overdue",
      value: overdueTasks.length,
      icon: AlertTriangle,
      color: "bg-danger",
      route: "/tasks",
    },
  ];

  const getSubjectTitle = (subjectId: string | null) => {
    if (!subjectId) return "No subject";
    return subjectById.get(subjectId)?.title || "Unknown subject";
  };

  const formatGrade = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return "—";
    return `${Math.round(value * 10) / 10}%`;
  };

  return (
    <PageLayout title="Dashboard" subtitle="Your study overview at a glance">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className={`animate-fade-in stagger-${i + 1}`}
            hover
            onClick={() => navigate(stat.route)}
          >
            <div className="flex items-center justify-between">
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
              <ChevronRight size={18} className="text-surface-600" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-6 xl:col-span-1">
          {/* Overdue Tasks */}
          <Card className="animate-fade-in stagger-2">
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-danger" />
                </div>
                <h3 className="text-lg font-semibold text-surface-100 truncate">
                  Overdue
                </h3>
              </div>
              <span className="text-xs font-medium text-danger bg-danger/10 px-2.5 py-1 rounded-full">
                {overdueTasks.length}
              </span>
            </div>
            {overdueTasks.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-surface-500 text-sm">
                  No overdue tasks. Nice work! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/60 transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate("/tasks")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 shrink-0 rounded-full priority-${task.priority}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-surface-200 truncate group-hover:text-surface-50 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-surface-500 truncate">
                          {getSubjectTitle(task.subject_id)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-danger/80 font-medium shrink-0">
                      {task.deadline
                        ? format(new Date(task.deadline), "MMM d")
                        : ""}
                    </span>
                  </div>
                ))}
                {overdueTasks.length > 5 && (
                  <button
                    onClick={() => navigate("/tasks")}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                  >
                    View all {overdueTasks.length} overdue
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* Upcoming Tasks */}
          <Card className="animate-fade-in stagger-3">
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-accent-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-100 truncate">
                  This Week
                </h3>
              </div>
              <span className="text-xs font-medium text-accent-400 bg-accent-500/10 px-2.5 py-1 rounded-full">
                {upcomingTasks.length}
              </span>
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="py-6 px-2 text-center">
                <p className="text-surface-500 text-sm">
                  No upcoming tasks this week 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-2 px-2">
                {upcomingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/60 transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate("/tasks")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 shrink-0 rounded-full priority-${task.priority}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-surface-200 truncate group-hover:text-surface-50 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-surface-500 truncate">
                          {getSubjectTitle(task.subject_id)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-surface-400 shrink-0">
                      {task.deadline
                        ? format(new Date(task.deadline), "MMM d")
                        : ""}
                    </span>
                  </div>
                ))}
                {upcomingTasks.length > 5 && (
                  <button
                    onClick={() => navigate("/tasks")}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                  >
                    View all {upcomingTasks.length} upcoming
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Subjects Overview */}
        <Card className="animate-fade-in stagger-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-100 truncate">
                Your Subjects
              </h3>
            </div>
            <button
              onClick={() => navigate("/subjects")}
              className="flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
            >
              Manage
              <ArrowRight size={12} />
            </button>
          </div>
          {uniqueSubjects.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-surface-500" />
              </div>
              <p className="text-surface-400 text-sm mb-4">
                No subjects yet. Add your first subject!
              </p>
              <button
                onClick={() => navigate("/subjects")}
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors cursor-pointer"
              >
                + Add Subject
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {uniqueSubjects.map((subject) => {
                const forecast = forecastBySubject[subject.id];
                const currentGrade = forecast
                  ? formatGrade(forecast.current_weighted_average)
                  : "—";
                const pendingCount = pendingCountBySubject[subject.id] || 0;

                return (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-surface-800/30 hover:bg-surface-800/60 border border-transparent hover:border-surface-700/50 transition-all duration-200 cursor-pointer group"
                    onClick={() =>
                      navigate(`/grades?subject_id=${subject.id}`)
                    }
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-400/10 flex items-center justify-center shrink-0">
                        <BookOpen size={18} className="text-primary-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-100 truncate group-hover:text-surface-50 transition-colors">
                          {subject.title}
                        </p>
                        <p className="text-xs text-surface-500 truncate mt-0.5">
                          {pendingCount > 0
                            ? `${pendingCount} task${pendingCount === 1 ? "" : "s"} to do`
                            : "No pending tasks"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-surface-500">
                          {forecast ? "Current grade" : "No grades yet"}
                        </p>
                        <p className={`text-lg font-bold ${forecast ? "gradient-text" : "text-surface-500"}`}>
                          {currentGrade}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-surface-600 group-hover:text-surface-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};
