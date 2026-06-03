import React, { useEffect, useState } from "react";
import { Plus, Trash2, TrendingUp, Target } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { useGradeStore } from "../../store/gradeStore";
import { useSubjectStore } from "../../store/subjectStore";
import toast from "react-hot-toast";

export const GradesPage: React.FC = () => {
  const {
    grades,
    forecast,
    methods,
    isLoading,
    fetch,
    create,
    remove,
    fetchForecast,
    fetchMethods,
    createMethod,
  } = useGradeStore();
  const { subjects, fetch: fetchSubjects } = useSubjectStore();
  const [searchParams] = useSearchParams();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [methodId, setMethodId] = useState("");
  const [creatingMethod, setCreatingMethod] = useState(false);
  const [methodName, setMethodName] = useState("");
  const [methodWeight, setMethodWeight] = useState("");
  const [methodPlannedCount, setMethodPlannedCount] = useState("");
  const [score, setScore] = useState("");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetch(selectedSubject);
      fetchForecast(selectedSubject);
      fetchMethods(selectedSubject);
    }
  }, [selectedSubject]);

  // Auto-select subject from URL param or fall back to first
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      const urlSubjectId = searchParams.get("subject_id");
      if (urlSubjectId && subjects.some((s) => s.id === urlSubjectId)) {
        setSelectedSubject(urlSubjectId);
      } else {
        setSelectedSubject(subjects[0].id);
      }
    }
  }, [subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalMethodId = methodId;
      if (!finalMethodId) {
        if (!creatingMethod) {
          toast.error("Select a method first");
          return;
        }

        const created = await createMethod({
          subject_id: selectedSubject,
          name: methodName,
          weight_percent: parseFloat(methodWeight),
          planned_count: parseInt(methodPlannedCount, 10),
        });
        finalMethodId = created.id;
        setMethodId(created.id);
      }

      await create({
        score: parseFloat(score),
        method_id: finalMethodId,
        label: label || undefined,
        date,
        subject_id: selectedSubject,
      });
      toast.success("Grade added");
      setShowModal(false);
      setMethodId("");
      setCreatingMethod(false);
      setMethodName("");
      setMethodWeight("");
      setMethodPlannedCount("");
      setScore("");
      setLabel("");
      fetchForecast(selectedSubject);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add grade");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id, selectedSubject);
      toast.success("Grade removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return value.toFixed(2);
  };

  return (
    <PageLayout
      title="Grade Tracker"
      subtitle="Track your scores and forecast your grades"
      action={
        selectedSubject ? (
          <Button onClick={() => setShowModal(true)}>
            <Plus size={18} className="mr-2" /> Add Grade
          </Button>
        ) : undefined
      }
    >
      {/* Subject Selector */}
      <div className="mb-6">
        <div className="flex gap-3 flex-wrap">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                ${
                  selectedSubject === s.id
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                    : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200"
                }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {!selectedSubject ? (
        <Card className="text-center py-16">
          <p className="text-surface-400 text-lg">
            Select a subject to view grades
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forecast Card */}
          <Card className="lg:col-span-1 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-primary-400" />
              <h3 className="font-semibold text-surface-100">
                Grade Forecast
              </h3>
            </div>

            {forecast ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-4xl font-bold gradient-text">
                    {formatPercent(forecast.current_weighted_average)}%
                  </p>
                  <p className="text-sm text-surface-400 mt-1">
                    Current Average
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-surface-400">Target</span>
                    <span className="text-surface-200 font-medium">
                      {formatPercent(forecast.target_grade)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">Weight Used</span>
                    <span className="text-surface-200 font-medium">
                      {formatPercent(forecast.total_weight_used)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">Remaining</span>
                    <span className="text-surface-200 font-medium">
                      {formatPercent(forecast.remaining_weight)}%
                    </span>
                  </div>
                  {forecast.required_score !== null && (
                    <div className="flex justify-between pt-2 border-t border-surface-700">
                      <span className="text-surface-400">Need</span>
                      <span
                        className={`font-bold ${
                          forecast.is_achievable
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {formatPercent(forecast.required_score)}%
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className={`p-3 rounded-xl text-xs ${
                    forecast.is_achievable
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {forecast.message}
                </div>

                {/* Visual progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-surface-500">
                    <span>0%</span>
                    <span>{currentSubject?.target_grade}%</span>
                    <span>100%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-800 overflow-hidden relative">
                    {/* Target marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent-500 z-10"
                      style={{
                        left: `${forecast.target_grade}%`,
                      }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        forecast.is_achievable
                          ? "bg-gradient-to-r from-primary-500 to-success"
                          : "bg-gradient-to-r from-primary-500 to-danger"
                      }`}
                      style={{
                        width: `${Math.min(
                          forecast.current_weighted_average,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-surface-500 text-sm text-center py-8">
                Add grades to see your forecast
              </p>
            )}
          </Card>

          {/* Grades Table */}
          <Card className="lg:col-span-2 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-accent-500" />
              <h3 className="font-semibold text-surface-100">
                Grade Entries
              </h3>
            </div>

            {grades.length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-8">
                No grades recorded yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-surface-700">
                      <th className="py-3 px-2 text-surface-400 font-medium">
                        Method
                      </th>
                      <th className="py-3 px-2 text-surface-400 font-medium">
                        Label
                      </th>
                      <th className="py-3 px-2 text-surface-400 font-medium">
                        Score
                      </th>
                      <th className="py-3 px-2 text-surface-400 font-medium">
                        Weight
                      </th>
                      <th className="py-3 px-2 text-surface-400 font-medium">
                        Date
                      </th>
                      <th className="py-3 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade) => (
                      <tr
                        key={grade.id}
                        className="border-b border-surface-800 hover:bg-surface-800/30 transition-colors"
                      >
                        <td className="py-3 px-2 text-surface-200">
                          {grade.method?.name || "—"}
                        </td>
                        <td className="py-3 px-2 text-surface-300">
                          {grade.label || "—"}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`font-medium ${
                              grade.score >= 70
                                ? "text-success"
                                : grade.score >= 50
                                ? "text-warning"
                                : "text-danger"
                            }`}
                          >
                            {formatPercent(grade.score)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-surface-300">
                          {formatPercent(grade.weight)}%
                        </td>
                        <td className="py-3 px-2 text-surface-400">
                          {grade.date}
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => handleDelete(grade.id)}
                            className="p-1 rounded text-surface-500 hover:text-danger transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Add Grade Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Grade"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              Method
            </label>
            <select
              className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
              value={methodId}
              onChange={(e) => {
                setMethodId(e.target.value);
                if (e.target.value) setCreatingMethod(false);
              }}
              disabled={creatingMethod}
            >
              <option value="">Select method…</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.weight_percent}%, {m.planned_count}x)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-surface-500">
              Create a new method if it doesn't exist yet.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreatingMethod((v) => !v);
                setMethodId("");
              }}
            >
              {creatingMethod ? "Use Existing" : "New Method"}
            </Button>
          </div>

          {creatingMethod && (
            <div className="space-y-4 rounded-xl border border-surface-700 bg-surface-800/30 p-4">
              <Input
                label="Method Name"
                placeholder="e.g. Quizzes"
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Planned Count"
                  type="number"
                  min="1"
                  step="1"
                  value={methodPlannedCount}
                  onChange={(e) => setMethodPlannedCount(e.target.value)}
                  required
                />
                <Input
                  label="Weight (%)"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={methodWeight}
                  onChange={(e) => setMethodWeight(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <Input
            label="Assessment Label (optional)"
            placeholder="e.g. Quiz 1"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Score (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">
                Weight
              </label>
              <div className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-300 px-4 py-2.5 text-sm">
                Auto (from method)
              </div>
            </div>
          </div>
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Grade</Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
};
