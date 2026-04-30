import React, { useState } from "react";
import { Map, Loader2, CheckSquare, Calendar } from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useSubjectStore } from "../../store/subjectStore";
import api from "../../services/api";
import toast from "react-hot-toast";
import type { RoadmapResponse, RoadmapStep } from "../../types";
import { useEffect } from "react";

export const RoadmapPage: React.FC = () => {
  const { subjects, fetch: fetchSubjects } = useSubjectStore();
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState("4");
  const [subjectId, setSubjectId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [tasksCreated, setTasksCreated] = useState(0);

  useEffect(() => { fetchSubjects(); }, []);

  const handleGenerate = async () => {
    if (!goal.trim()) { toast.error("Enter a learning goal"); return; }
    setIsGenerating(true);
    try {
      const res = await api.post<RoadmapResponse>("/ai/roadmap", {
        goal, weeks: parseInt(weeks), subject_id: subjectId || undefined,
      });
      setRoadmap(res.data.roadmap);
      setTasksCreated(res.data.tasks_created);
      toast.success(`Roadmap created! ${res.data.tasks_created} tasks added.`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate roadmap");
    } finally { setIsGenerating(false); }
  };

  return (
    <PageLayout title="Learning Roadmap" subtitle="AI-generated study plans tailored to your goals">
      <Card className="mb-6 animate-fade-in">
        <div className="space-y-4">
          <Input label="Learning Goal" placeholder="e.g. Learn React, Master Linear Algebra, Prepare for IELTS" value={goal} onChange={(e) => setGoal(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Duration (weeks)" type="number" min="1" max="12" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">Link to Subject (optional)</label>
              <select className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">None</option>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
              </select>
            </div>
          </div>
          <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!goal.trim()}>
            <Map size={18} className="mr-2" /> Generate Roadmap
          </Button>
        </div>
      </Card>

      {isGenerating && (
        <div className="flex flex-col items-center py-16">
          <Loader2 size={32} className="text-primary-400 animate-spin mb-4" />
          <p className="text-surface-400">Creating your personalized roadmap...</p>
        </div>
      )}

      {roadmap.length > 0 && (
        <div>
          {tasksCreated > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <CheckSquare size={18} className="text-emerald-400" />
              <span className="text-sm text-emerald-400">{tasksCreated} tasks have been automatically added to your planner!</span>
            </div>
          )}

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-accent-400 to-emerald-400" />

            <div className="space-y-6">
              {roadmap.map((step, i) => (
                <div key={i} className="relative pl-16 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  {/* Timeline dot */}
                  <div className="absolute left-4 w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-400 border-2 border-surface-950 z-10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{step.week}</span>
                  </div>

                  <Card>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-primary-400" />
                      <span className="text-xs text-surface-400">Week {step.week}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-surface-100 mb-2">{step.title}</h4>
                    <p className="text-sm text-surface-400 mb-4">{step.description}</p>
                    <div className="space-y-2">
                      {step.tasks.map((task, ti) => (
                        <div key={ti} className="flex items-start gap-2 text-sm">
                          <CheckSquare size={14} className="text-surface-500 mt-0.5 flex-shrink-0" />
                          <span className="text-surface-300">{task}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
