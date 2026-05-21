import React, { useEffect, useMemo, useState } from "react";
import { Library as LibraryIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { useLibraryStore } from "../../store/libraryStore";
import type { LibraryItem } from "../../types";
import { LibraryFilters } from "./LibraryFilters";
import { LibraryCard } from "./LibraryCard";
import { ContentModal } from "./ContentModal";

export const LibraryPage: React.FC = () => {
  const { items, filters, isLoading, error, fetch, remove, setFilter } = useLibraryStore();
  const [activeItem, setActiveItem] = useState<LibraryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tagsKey = useMemo(() => (filters.tags || []).join("|"), [filters.tags]);

  useEffect(() => {
    fetch();
  }, [filters.type, filters.subject, filters.sort, tagsKey]);

  const handleOpen = (item: LibraryItem) => {
    setActiveItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this item from your library?")) return;
    try {
      await remove(id);
      toast.success("Deleted");
      if (activeItem?.id === id) {
        setActiveItem(null);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete");
    }
  };

  return (
    <PageLayout title="📚 My Library" subtitle="All your learning items in one place">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <Card className="animate-fade-in">
            <LibraryFilters items={items} filters={filters} onChange={(p) => setFilter(p)} />
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex flex-col items-center py-16">
              <Loader2 size={32} className="text-primary-400 animate-spin mb-4" />
              <p className="text-surface-400">Loading your library…</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <LibraryIcon size={48} className="mx-auto text-surface-700 mb-4" />
              <p className="text-surface-500 text-sm">Your library is empty</p>
              <p className="text-surface-600 text-xs mt-2">
                Upload a PDF, generate a quiz, or create a roadmap to see items here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((it) => (
                <LibraryCard key={it.id} item={it} onOpen={handleOpen} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ContentModal
        item={activeItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveItem(null);
        }}
      />
    </PageLayout>
  );
};
