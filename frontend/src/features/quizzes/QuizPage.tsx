import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Brain, CheckCircle, XCircle, RotateCcw, Loader2, Trophy, History } from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import api from "../../services/api";
import toast from "react-hot-toast";
import type {
  QuizQuestion,
  GenerateQuizResponse,
  MaterialSummaryItem,
  QuizAttempt,
  QuizAttemptCreate,
} from "../../types";

export const QuizPage: React.FC = () => {
  const location = useLocation();
  const incomingMaterialId = (location.state as any)?.materialId ?? "";

  // ── Materials dropdown ──
  const [materials, setMaterials] = useState<MaterialSummaryItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState(incomingMaterialId);
  const [numQuestions, setNumQuestions] = useState("5");
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // ── Quiz state ──
  const [quizId, setQuizId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Attempt history ──
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoadingMaterials(true);
    try {
      const res = await api.get<MaterialSummaryItem[]>("/ai/materials");
      setMaterials(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, []);

  // When a material is selected, pre-load its existing quiz attempts
  useEffect(() => {
    if (!selectedMaterialId) { setAttempts([]); return; }
    const mat = materials.find((m) => m.id === selectedMaterialId);
    if (mat?.quiz_id) {
      fetchAttempts(mat.quiz_id);
    } else {
      setAttempts([]);
    }
  }, [selectedMaterialId, materials]);

  const fetchAttempts = async (qId: string) => {
    setLoadingAttempts(true);
    try {
      const res = await api.get<QuizAttempt[]>(`/ai/quiz-attempts/${qId}`);
      setAttempts(res.data);
    } catch {
      setAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedMaterialId) { toast.error("Select a material first"); return; }
    setIsGenerating(true);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    setQuizId(null);
    try {
      const res = await api.post<GenerateQuizResponse>("/ai/generate-quiz", {
        material_id: selectedMaterialId,
        num_questions: parseInt(numQuestions),
      });
      setQuizId(res.data.quiz_id);
      setQuestions(res.data.questions);
      // Refresh materials to get quiz_id populated
      await fetchMaterials();
      toast.success(`Generated ${res.data.total_questions} questions!`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate quiz");
    } finally {
      setIsGenerating(false); }
  };

  const handleAnswer = (qIndex: number, optionIndex: number) => {
    if (showResults) return;
    setAnswers({ ...answers, [qIndex]: optionIndex });
  };

  const handleSubmit = async () => {
    setShowResults(true);
    if (!quizId) return;

    const score = questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0),
      0
    );

    setIsSaving(true);
    try {
      const payload: QuizAttemptCreate = {
        quiz_id: quizId,
        score,
        total: questions.length,
        answers: Object.fromEntries(
          Object.entries(answers).map(([k, v]) => [k, v])
        ),
      };
      await api.post("/ai/quiz-attempt", payload);
      toast.success("Score saved!");
      await fetchAttempts(quizId);
    } catch {
      toast.error("Could not save score");
    } finally {
      setIsSaving(false);
    }
  };

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0),
    0
  );

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
  };

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  return (
    <PageLayout title="AI Quiz" subtitle="Test your knowledge with AI-generated quizzes">
      {/* ── Generator control bar ── */}
      <Card className="mb-6 animate-fade-in">
        <div className="flex flex-wrap items-end gap-4">
          {/* Material dropdown */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Study Material</label>
            {loadingMaterials ? (
              <div className="flex items-center gap-2 text-surface-400 text-sm py-2.5">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : (
              <select
                className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
                value={selectedMaterialId}
                onChange={(e) => {
                  setSelectedMaterialId(e.target.value);
                  setQuestions([]);
                  setAnswers({});
                  setShowResults(false);
                  setQuizId(null);
                }}
              >
                <option value="">Select material…</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.subject_title} — {new Date(m.created_at).toLocaleDateString()}
                    {m.has_quiz ? " ✓" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Number of questions */}
          <div className="w-28">
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Questions</label>
            <input
              type="number"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
            />
          </div>

          <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!selectedMaterialId}>
            <Brain size={18} className="mr-2" />
            {selectedMaterial?.has_quiz ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </Card>

      {isGenerating && (
        <div className="flex flex-col items-center py-16">
          <Loader2 size={32} className="text-primary-400 animate-spin mb-4" />
          <p className="text-surface-400">Generating quiz questions…</p>
          <p className="text-surface-600 text-xs mt-1">This can take 10–30 seconds</p>
        </div>
      )}

      {questions.length > 0 && (
        <>
          {/* Score banner */}
          {showResults && (
            <Card className="mb-6 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Trophy size={28} className="text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold gradient-text">{score}/{questions.length}</p>
                    <p className="text-sm text-surface-400">
                      {Math.round((score / questions.length) * 100)}% — {
                        score === questions.length ? "Perfect! 🎉" :
                        score / questions.length >= 0.7 ? "Great work!" :
                        score / questions.length >= 0.5 ? "Keep practicing" : "Keep studying!"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-36 h-3 rounded-full bg-surface-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-400 transition-all duration-700"
                      style={{ width: `${(score / questions.length) * 100}%` }}
                    />
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    <RotateCcw size={14} className="mr-1" /> Retry
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Questions */}
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <Card key={qi} className="animate-fade-in">
                <p className="font-medium text-surface-100 mb-4">
                  <span className="text-primary-400 mr-2">Q{qi + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[qi] === oi;
                    const isCorrect = q.correct_index === oi;
                    let cls = "border-surface-700 hover:border-surface-600";
                    if (showResults && isCorrect) cls = "border-emerald-500 bg-emerald-500/10";
                    else if (showResults && isSelected && !isCorrect) cls = "border-red-500 bg-red-500/10";
                    else if (isSelected) cls = "border-primary-500 bg-primary-500/10";

                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(qi, oi)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 flex items-center gap-3 cursor-pointer ${cls}`}
                      >
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                          {showResults && isCorrect
                            ? <CheckCircle size={14} className="text-emerald-400" />
                            : showResults && isSelected
                            ? <XCircle size={14} className="text-red-400" />
                            : String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-surface-200">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          {/* Submit button */}
          {!showResults && Object.keys(answers).length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={handleSubmit}
                isLoading={isSaving}
                disabled={Object.keys(answers).length < questions.length}
              >
                Submit Answers ({Object.keys(answers).length}/{questions.length})
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Attempt history ── */}
      {attempts.length > 0 && (
        <Card className="mt-6 animate-fade-in">
          <h3 className="text-base font-semibold text-surface-100 mb-4 flex items-center gap-2">
            <History size={16} className="text-surface-400" /> Past Attempts
          </h3>
          <div className="space-y-2">
            {attempts.map((a) => {
              const pct = Math.round((a.score / a.total) * 100);
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700">
                  <div>
                    <p className="text-sm font-medium text-surface-200">
                      {a.score}/{a.total} correct
                    </p>
                    <p className="text-xs text-surface-500">
                      {new Date(a.completed_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-surface-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-surface-200 w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty state when no material selected */}
      {!isGenerating && questions.length === 0 && !selectedMaterialId && (
        <div className="text-center py-16">
          <Brain size={48} className="mx-auto text-surface-700 mb-4" />
          <p className="text-surface-500 text-sm">Select a study material above to generate a quiz</p>
          <p className="text-surface-600 text-xs mt-2">First upload a material on the Materials page</p>
        </div>
      )}
    </PageLayout>
  );
};
