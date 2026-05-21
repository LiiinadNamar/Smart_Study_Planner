import React, { useMemo } from "react";
import { FileText, Brain, Map, StickyNote, ArrowUpDown } from "lucide-react";
import { Input } from "../../components/ui/Input";
import type { LibraryFilter, LibraryItem, LibraryItemType } from "../../types";

interface LibraryFiltersProps {
  items: LibraryItem[];
  filters: LibraryFilter;
  onChange: (partial: Partial<LibraryFilter>) => void;
}

const typeOptions: Array<{
  label: string;
  value?: LibraryItemType;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  cls: string;
}> = [
  { label: "All", value: undefined, icon: ArrowUpDown, cls: "text-surface-300" },
  { label: "PDF", value: "pdf", icon: FileText, cls: "text-blue-400" },
  { label: "Quiz", value: "quiz", icon: Brain, cls: "text-purple-400" },
  { label: "Roadmap", value: "roadmap", icon: Map, cls: "text-emerald-400" },
  { label: "Note", value: "note", icon: StickyNote, cls: "text-amber-400" },
];

export const LibraryFilters: React.FC<LibraryFiltersProps> = ({ items, filters, onChange }) => {
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      for (const t of it.tags || []) set.add(t);
    }
    for (const t of filters.tags || []) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items, filters.tags]);

  const selectedTags = filters.tags || [];

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onChange({ tags: next });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-surface-300 mb-3">Type</p>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((opt) => {
            const active = filters.type === opt.value || (!filters.type && opt.value === undefined);
            const Icon = opt.icon;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onChange({ type: opt.value })}
                className={
                  `inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ` +
                  (active
                    ? "bg-primary-600/20 text-primary-300 border-primary-500/30"
                    : "bg-surface-800/40 text-surface-300 border-surface-700 hover:border-surface-600")
                }
              >
                <Icon size={14} className={active ? "text-primary-300" : opt.cls} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <Input
        label="Subject"
        placeholder="Search by subject…"
        value={filters.subject || ""}
        onChange={(e) => onChange({ subject: e.target.value })}
      />

      <div>
        <p className="text-sm font-medium text-surface-300 mb-3">Tags</p>
        {availableTags.length === 0 ? (
          <p className="text-xs text-surface-500">No tags yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={
                    `px-3 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer ` +
                    (active
                      ? "bg-accent-500/15 text-accent-300 border-accent-500/30"
                      : "bg-surface-800/40 text-surface-300 border-surface-700 hover:border-surface-600")
                  }
                  title={tag}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
        {selectedTags.length > 0 && (
          <p className="text-[11px] text-surface-500 mt-2">
            Matching items must include all selected tags
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-surface-300">Sort</label>
        <select
          className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
          value={filters.sort || "newest"}
          onChange={(e) => onChange({ sort: e.target.value as any })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="az">A→Z</option>
        </select>
      </div>
    </div>
  );
};
