import React, { useEffect, useState } from "react";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useSubjectStore } from "../../store/subjectStore";
import api from "../../services/api";
import toast from "react-hot-toast";
import type { SummarizeResponse } from "../../types";

export const MaterialsPage: React.FC = () => {
  const { subjects, fetch: fetchSubjects } = useSubjectStore();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSummary, setActiveSummary] = useState<string | null>(null);

  useEffect(() => { fetchSubjects(); }, []);

  const handleUpload = async () => {
    if (!selectedSubject) { toast.error("Select a subject first"); return; }
    if (!file && !textInput.trim()) { toast.error("Provide a file or text"); return; }
    setIsProcessing(true);
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
      setFile(null);
      setTextInput("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to process material");
    } finally { setIsProcessing(false); }
  };

  return (
    <PageLayout title="Learning Materials" subtitle="Upload documents and get AI-powered summaries">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in">
          <h3 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
            <Upload size={18} className="text-primary-400" /> Process Material
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">Subject</label>
              <select className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">Select subject...</option>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">Upload PDF / TXT</label>
              <div className="border-2 border-dashed border-surface-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500/50 transition-colors" onClick={() => document.getElementById("file-input")?.click()}>
                {file ? (
                  <div className="flex items-center justify-center gap-2"><FileText size={18} className="text-primary-400" /><span className="text-sm text-surface-200">{file.name}</span></div>
                ) : (
                  <div><Upload size={24} className="mx-auto text-surface-500 mb-2" /><p className="text-sm text-surface-400">Click to upload (PDF, TXT)</p></div>
                )}
                <input id="file-input" type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">Or paste text directly</label>
              <textarea className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm min-h-[120px] resize-y" placeholder="Paste your study material text here..." value={textInput} onChange={(e) => setTextInput(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleUpload} isLoading={isProcessing} disabled={!selectedSubject || (!file && !textInput.trim())}>
              <Sparkles size={18} className="mr-2" />{isProcessing ? "Processing..." : "Generate Summary"}
            </Button>
          </div>
        </Card>

        <Card className="animate-fade-in">
          <h3 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-accent-400" /> AI Summary
          </h3>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={32} className="text-primary-400 animate-spin mb-4" />
              <p className="text-surface-400 text-sm">AI is analyzing your material...</p>
            </div>
          ) : activeSummary ? (
            <div className="text-surface-300 text-sm leading-relaxed whitespace-pre-wrap" style={{ maxHeight: "600px", overflowY: "auto" }}>{activeSummary}</div>
          ) : (
            <div className="text-center py-16">
              <FileText size={48} className="mx-auto text-surface-700 mb-4" />
              <p className="text-surface-500 text-sm">Upload a document or paste text to get an AI summary</p>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};
