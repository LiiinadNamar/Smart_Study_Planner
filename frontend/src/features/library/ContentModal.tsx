import React, { useMemo } from "react";
import { Modal } from "../../components/ui/Modal";
import { Card } from "../../components/ui/Card";
import { MarkdownRenderer } from "../../components/ui/MarkdownRenderer";
import type { LibraryItem, QuizQuestion, RoadmapStep } from "../../types";

interface ContentModalProps {
  item: LibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const ContentModal: React.FC<ContentModalProps> = ({ item, isOpen, onClose }) => {
  const quizQuestions = useMemo(() => {
    if (!item || item.type !== "quiz") return [] as QuizQuestion[];
    return safeJsonParse<QuizQuestion[]>(item.content, []);
  }, [item]);

  const roadmapSteps = useMemo(() => {
    if (!item || item.type !== "roadmap") return [] as RoadmapStep[];
    return safeJsonParse<RoadmapStep[]>(item.content, []);
  }, [item]);

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.title} size="lg">
      {item.type === "quiz" && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {quizQuestions.length === 0 ? (
            <p className="text-surface-400 text-sm">No quiz content</p>
          ) : (
            quizQuestions.map((q, idx) => (
              <Card key={idx} className="!p-4">
                <p className="text-sm font-semibold text-surface-100 mb-2">
                  Q{idx + 1}. {q.question}
                </p>
                <ul className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <li
                      key={oi}
                      className="text-sm px-3 py-2 rounded-lg bg-surface-800/40 border border-surface-700 text-surface-200"
                    >
                      <span className="text-surface-500 mr-2">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          )}
        </div>
      )}

      {item.type === "roadmap" && (
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {roadmapSteps.length === 0 ? (
            <p className="text-surface-400 text-sm">No roadmap content</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-700" />
              <div className="space-y-4 pl-10">
                {roadmapSteps.map((s, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-7 top-1 w-4 h-4 rounded-full bg-primary-500" />
                    <div className="p-4 rounded-xl bg-surface-800/40 border border-surface-700">
                      <p className="text-xs text-surface-500 mb-1">Week {s.week}</p>
                      <p className="text-sm font-semibold text-surface-100">{s.title}</p>
                      <p className="text-sm text-surface-300 mt-1">{s.description}</p>
                      {s.tasks?.length > 0 && (
                        <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-surface-200">
                          {s.tasks.map((t, ti) => (
                            <li key={ti} className="text-surface-300">
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {item.type === "note" && (
        <MarkdownRenderer content={item.content || ""} className="max-h-[70vh] overflow-y-auto pr-1" />
      )}
    </Modal>
  );
};
