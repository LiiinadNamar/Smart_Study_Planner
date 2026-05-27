import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Target, Clock } from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { useSubjectStore } from "../../store/subjectStore";
import toast from "react-hot-toast";

export const SubjectsPage: React.FC = () => {
  const { subjects, isLoading, fetch, create, update, remove } = useSubjectStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [targetGrade, setTargetGrade] = useState("90");
  const [creditHours, setCreditHours] = useState("3");

  useEffect(() => {
    fetch();
  }, []);

  const resetForm = () => {
    setTitle("");
    setTargetGrade("90");
    setCreditHours("3");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await update(editingId, {
          title,
          target_grade: parseFloat(targetGrade),
          credit_hours: parseInt(creditHours),
        });
        toast.success("Subject updated");
      } else {
        await create({
          title,
          target_grade: parseFloat(targetGrade),
          credit_hours: parseInt(creditHours),
        });
        toast.success("Subject created");
      }
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save subject");
    }
  };

  const handleEdit = (subject: any) => {
    setEditingId(subject.id);
    setTitle(subject.title);
    setTargetGrade(String(subject.target_grade));
    setCreditHours(String(subject.credit_hours));
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject and all related data?")) return;
    try {
      await remove(id);
      toast.success("Subject deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <PageLayout
      title="Subjects"
      subtitle="Manage your study modules"
      action={
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} className="mr-2" /> Add Subject
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : subjects.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-surface-400 text-lg mb-4">No subjects yet</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={18} className="mr-2" /> Create Your First Subject
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, i) => (
            <Card
              key={subject.id}
              hover
              className="animate-fade-in"
              // @ts-ignore
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-surface-100 truncate flex-1">
                  {subject.title}
                </h3>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleEdit(subject)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Target size={16} className="text-primary-400" />
                  <span className="text-surface-300">Target Grade:</span>
                  <span className="font-semibold text-surface-100">
                    {subject.target_grade}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-accent-500" />
                  <span className="text-surface-300">Credit Hours:</span>
                  <span className="font-semibold text-surface-100">
                    {subject.credit_hours}
                  </span>
                </div>
              </div>
              {/* Progress bar placeholder */}
              <div className="mt-4 h-1.5 rounded-full bg-surface-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400 transition-all duration-500"
                  style={{ width: "0%" }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? "Edit Subject" : "New Subject"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Subject Title"
            placeholder="e.g. Calculus II"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Target Grade (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={targetGrade}
            onChange={(e) => setTargetGrade(e.target.value)}
            required
          />
          <Input
            label="Credit Hours"
            type="number"
            min="1"
            max="10"
            value={creditHours}
            onChange={(e) => setCreditHours(e.target.value)}
            required
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowModal(false); resetForm(); }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
};
