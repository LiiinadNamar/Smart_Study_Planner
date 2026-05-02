import React, { useEffect, useState, useCallback } from "react";
import { Upload, FileText, Sparkles, Loader2, Brain, Clock, ChevronRight, Copy, Check } from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useSubjectStore } from "../../store/subjectStore";
import api from "../../services/api";
import toast from "react-hot-toast";
import type { SummarizeResponse, MaterialSummaryItem } from "../../types";
import { useNavigate } from "react-router-dom";

export const MaterialsPage: React.FC = () => {
  const navigate = useNavigate();
  const { subjects, fetch: fetchSubjects } = useSubjectStore();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSummary, setActiveSummary] = useState<string | null>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Past materials
  const [materials, setMaterials] = useState<MaterialSummaryItem[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoadingMaterials(true);
    try {
      const res = await api.get<MaterialSummaryItem[]>("/ai/materials");
      setMaterials(res.data);
    } catch {
      // non-critical — just leave the list empty
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchMaterials();
  }, []);

  const handleUpload = async () => {
    if (!selectedSubject) { toast.error("Select a subject first"); return; }
    if (!file && !textInput.trim()) { toast.error("Provide a file or text"); return; }
    setIsProcessing(true);
    setActiveSummary(null);
    setActiveMaterialId(null);
    try {
      const formData = new FormData();
      formData.append("subject_id", selectedSubject);
      if (file) formData.append("file", file);
      if (textInput.trim()) formData.append("content_text", textInput);
      const res = await api.post<SummarizeResponse>("/ai/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Summary generated!");
      setActiveSummary(res.data.summary);
      setActiveMaterialId(res.data.material_id);
      setFile(null);
      setTextInput("");
      // Refresh the materials list
      fetchMaterials();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to process material";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyId = () => {
    if (!activeMaterialId) return;
    navigator.clipboard.writeText(activeMaterialId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToQuiz = () => {
    if (activeMaterialId) navigate("/quizzes", { state: { materialId: activeMaterialId } });
  };

  return (
    <PageLayout title="Learning Materials" subtitle="Upload documents and get AI-powered summaries">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Upload Form ── */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="animate-fade-in">
            <h3 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
              <Upload size={18} className="text-primary-400" /> Process Material
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-300">Subject</label>
                <select
                  className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-300">Upload PDF / TXT</label>
                <div
                  className="border-2 border-dashed border-surface-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500/50 transition-colors"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText size={18} className="text-primary-400" />
                      <span className="text-sm text-surface-200">{file.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} className="mx-auto text-surface-500 mb-2" />
                      <p className="text-sm text-surface-400">Click to upload (PDF, TXT)</p>
                    </div>
                  )}
                  <input id="file-input" type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-300">Or paste text directly</label>
                <textarea
                  className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm min-h-[100px] resize-y"
                  placeholder="Paste your study material text here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleUpload}
                isLoading={isProcessing}
                disabled={!selectedSubject || (!file && !textInput.trim())}
              >
                <Sparkles size={18} className="mr-2" />
                {isProcessing ? "Processing..." : "Generate Summary"}
              </Button>
            </div>
          </Card>

          {/* Past Materials list */}
          <Card className="animate-fade-in">
            <h3 className="text-base font-semibold text-surface-100 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-surface-400" /> Past Materials
            </h3>
            {loadingMaterials ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-primary-400" />
              </div>
            ) : materials.length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-4">No materials yet</p>
            ) : (
              <div className="space-y-2">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700 hover:border-surface-600 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-200 truncate">{m.subject_title}</p>
                      <p className="text-xs text-surface-500">{new Date(m.created_at).toLocaleDateString()}</p>
                      {m.has_quiz && <span className="text-xs text-emerald-400 font-medium">✓ Quiz ready</span>}
                    </div>
                    <button
                      onClick={() => navigate("/quizzes", { state: { materialId: m.id } })}
                      className="ml-2 p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-primary-400 transition-colors flex-shrink-0"
                      title="Go to quiz"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right: Summary Panel ── */}
        <div className="lg:col-span-2">
          <Card className="animate-fade-in h-full">
            <h3 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-accent-400" /> AI Summary
            </h3>

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={32} className="text-primary-400 animate-spin mb-4" />
                <p className="text-surface-400 text-sm">AI is analyzing your material...</p>
                <p className="text-surface-600 text-xs mt-1">This can take 10–30 seconds</p>
              </div>
            ) : activeSummary ? (
              <div>
                {/* Material ID actions */}
                {activeMaterialId && (
                  <div className="mb-4 p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary-300 font-medium mb-0.5">Material saved!</p>
                      <p className="text-xs text-surface-400 font-mono truncate">{activeMaterialId}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyId}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-200 transition-colors"
                      >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Copy ID"}
                      </button>
                      <button
                        onClick={handleGoToQuiz}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors"
                      >
                        <Brain size={12} /> Generate Quiz
                      </button>
                    </div>
                  </div>
                )}
                <div
                  className="text-surface-300 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ maxHeight: "600px", overflowY: "auto" }}
                >
                  {activeSummary}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <FileText size={48} className="mx-auto text-surface-700 mb-4" />
                <p className="text-surface-500 text-sm">Upload a document or paste text to get an AI summary</p>
                <p className="text-surface-600 text-xs mt-2">Supports PDF and plain text files</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
