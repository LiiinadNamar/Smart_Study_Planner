import React, { useState } from "react";
import { Brain, CheckCircle, XCircle, RotateCcw, Loader2 } from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../services/api";
import toast from "react-hot-toast";
import type { QuizQuestion, GenerateQuizResponse } from "../../types";

export const QuizPage: React.FC = () => {
  const [materialId, setMaterialId] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!materialId.trim()) { toast.error("Enter a material ID"); return; }
    setIsGenerating(true);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    try {
      const res = await api.post<GenerateQuizResponse>("/ai/generate-quiz", {
        material_id: materialId,
        num_questions: parseInt(numQuestions),
      });
      setQuestions(res.data.questions);
      toast.success(`Generated ${res.data.total_questions} questions!`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate quiz");
    } finally { setIsGenerating(false); }
  };

  const handleAnswer = (qIndex: number, optionIndex: number) => {
    if (showResults) return;
    setAnswers({ ...answers, [qIndex]: optionIndex });
  };

  const handleSubmit = () => setShowResults(true);

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0);

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
  };

  return (
    <PageLayout title="AI Quiz" subtitle="Test your knowledge with AI-generated quizzes">
      {/* Generator */}
      <Card className="mb-6 animate-fade-in">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input label="Material ID" placeholder="Paste material UUID from the Materials page" value={materialId} onChange={(e) => setMaterialId(e.target.value)} />
          </div>
          <div className="w-32">
            <Input label="Questions" type="number" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} />
          </div>
          <Button onClick={handleGenerate} isLoading={isGenerating}>
            <Brain size={18} className="mr-2" /> Generate
          </Button>
        </div>
      </Card>

      {isGenerating && (
        <div className="flex flex-col items-center py-16">
          <Loader2 size={32} className="text-primary-400 animate-spin mb-4" />
          <p className="text-surface-400">Generating quiz questions...</p>
        </div>
      )}

      {questions.length > 0 && (
        <>
          {/* Score Banner */}
          {showResults && (
            <Card className="mb-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold gradient-text">{score}/{questions.length}</p>
                  <p className="text-sm text-surface-400">Correct Answers</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-3 rounded-full bg-surface-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-400 transition-all duration-500" style={{ width: `${(score / questions.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-surface-200">{Math.round((score / questions.length) * 100)}%</span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  <RotateCcw size={16} className="mr-1" /> Retry
                </Button>
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
                      <button key={oi} onClick={() => handleAnswer(qi, oi)} className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 flex items-center gap-3 cursor-pointer ${cls}`}>
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs flex-shrink-0">
                          {showResults && isCorrect ? <CheckCircle size={14} className="text-emerald-400" /> : showResults && isSelected ? <XCircle size={14} className="text-red-400" /> : String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-surface-200">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          {!showResults && Object.keys(answers).length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length}>
                Submit Answers ({Object.keys(answers).length}/{questions.length})
              </Button>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};
