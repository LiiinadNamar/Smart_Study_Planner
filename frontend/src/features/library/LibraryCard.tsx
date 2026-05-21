import React, { useMemo } from "react";
import { FileText, Brain, Map, StickyNote, Download, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import type { LibraryItem } from "../../types";

interface LibraryCardProps {
  item: LibraryItem;
  onOpen: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
}

function getTypeMeta(type: LibraryItem["type"]) {
  switch (type) {
    case "pdf":
      return { label: "PDF", icon: FileText, cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    case "quiz":
      return { label: "Quiz", icon: Brain, cls: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
    case "roadmap":
      return { label: "Roadmap", icon: Map, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    case "note":
      return { label: "Note", icon: StickyNote, cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  }
}

export const LibraryCard: React.FC<LibraryCardProps> = ({ item, onOpen, onDelete }) => {
  const meta = getTypeMeta(item.type);
  const Icon = meta.icon;

  const relative = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    } catch {
      return "";
    }
  }, [item.created_at]);

  const canOpen = item.type === "quiz" || item.type === "roadmap" || item.type === "note";
  const canDownload = item.type === "pdf" && !!item.file_path;

  return (
    <Card hover className="!p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${meta.cls}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-surface-500 mb-1">
            {meta.label}
            {relative ? ` • ${relative}` : ""}
          </p>
          <h3 className="text-sm font-semibold text-surface-100 truncate" title={item.title}>
            {item.title}
          </h3>
          {item.subject && (
            <span className="inline-flex mt-2 text-[11px] px-2 py-1 rounded-lg bg-surface-800/60 border border-surface-700 text-surface-300">
              {item.subject}
            </span>
          )}
        </div>
      </div>

      {(item.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(item.tags || []).map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-1 rounded-lg bg-surface-800/40 border border-surface-700 text-surface-300"
              title={t}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {canOpen && (
          <Button variant="secondary" size="sm" onClick={() => onOpen(item)} title="Open">
            <ExternalLink size={14} className="mr-1" /> Open
          </Button>
        )}

        {canDownload && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(item.file_path as string, "_blank", "noopener,noreferrer")}
            title="Download"
          >
            <Download size={14} className="mr-1" /> Download
          </Button>
        )}

        <Button variant="danger" size="sm" onClick={() => onDelete(item.id)} title="Delete">
          <Trash2 size={14} className="mr-1" /> Delete
        </Button>
      </div>
    </Card>
  );
};
