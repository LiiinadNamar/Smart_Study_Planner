import React, { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { PageLayout } from "../../components/layout/PageLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { useTaskStore } from "../../store/taskStore";
import { useSubjectStore } from "../../store/subjectStore";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { TaskStatus } from "../../types";

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "To Do", color: "bg-surface-600" },
  { status: "doing", label: "In Progress", color: "bg-primary-600" },
  { status: "done", label: "Done", color: "bg-success" },
];

const priorityLabels: Record<number, { label: string; class: string }> = {
  1: { label: "High", class: "bg-danger/20 text-danger" },
  2: { label: "Medium", class: "bg-warning/20 text-warning" },
  3: { label: "Low", class: "bg-success/20 text-success" },
};

export const TasksPage: React.FC = () => {
  const { tasks, isLoading, fetch, create, update, remove } = useTaskStore();
  const { subjects, fetch: fetchSubjects } = useSubjectStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("2");
  const [subjectId, setSubjectId] = useState("");

  const editingTask = tasks.find((t) => t.id === editingTaskId) || null;

  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState("2");
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo");

  useEffect(() => {
    fetch();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!editingTask) return;
    setEditDescription(editingTask.description || "");
    setEditDeadline(
      editingTask.deadline
        ? format(new Date(editingTask.deadline), "yyyy-MM-dd'T'HH:mm")
        : ""
    );
    setEditPriority(String(editingTask.priority));
    setEditStatus(editingTask.status);
  }, [editingTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({
        title,
        description: description || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        priority: parseInt(priority),
        subject_id: subjectId || undefined,
      });
      toast.success("Task created");
      setShowModal(false);
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("2");
      setSubjectId("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create task");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await update(taskId, { status: newStatus });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleOpenEdit = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await update(editingTask.id, {
        description: editDescription || undefined,
        deadline: editDeadline ? new Date(editDeadline).toISOString() : undefined,
        priority: parseInt(editPriority, 10),
        status: editStatus,
      });
      toast.success("Task updated");
      setEditingTaskId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update task");
    }
  };

  return (
    <PageLayout
      title="Task Planner"
      subtitle="Organize your study tasks with Kanban board"
      action={
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} className="mr-2" /> Add Task
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="space-y-4">
                {/* Column Header */}
                <div className="flex items-center gap-3 px-2">
                  <span className={`w-3 h-3 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-surface-200">
                    {col.label}
                  </h3>
                  <span className="text-xs text-surface-500 bg-surface-800 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-3 min-h-[200px]">
                  {colTasks.map((task) => {
                    const subj = subjects.find(
                      (s) => s.id === task.subject_id
                    );
                    return (
                      <Card
                        key={task.id}
                        className="animate-fade-in !p-4 relative group cursor-pointer"
                        onClick={() => handleOpenEdit(task.id)}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical
                            size={16}
                            className="text-surface-600 mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-100 mb-1">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-surface-400 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  priorityLabels[task.priority]?.class ||
                                  "bg-surface-700 text-surface-400"
                                }`}
                              >
                                {priorityLabels[task.priority]?.label ||
                                  "Normal"}
                              </span>
                              {subj && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
                                  {subj.title}
                                </span>
                              )}
                              {task.deadline && (
                                <span className="text-xs text-surface-500">
                                  {format(
                                    new Date(task.deadline),
                                    "MMM d, yy"
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {col.status !== "todo" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(
                                  task.id,
                                  col.status === "done" ? "doing" : "todo"
                                );
                              }}
                              className="p-1 rounded text-xs text-surface-400 hover:bg-surface-700 cursor-pointer"
                              title="Move back"
                            >
                              ←
                            </button>
                          )}
                          {col.status !== "done" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(
                                  task.id,
                                  col.status === "todo" ? "doing" : "done"
                                );
                              }}
                              className="p-1 rounded text-xs text-surface-400 hover:bg-surface-700 cursor-pointer"
                              title="Move forward"
                            >
                              →
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id);
                            }}
                            className="p-1 rounded text-surface-400 hover:text-danger hover:bg-danger/10 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Task"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Task Title"
            placeholder="e.g. Read Chapter 5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              Description
            </label>
            <textarea
              className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200 px-4 py-2.5 text-sm min-h-[80px] resize-y"
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Input
            label="Deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">
                Priority
              </label>
              <select
                className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="1">🔴 High</option>
                <option value="2">🟡 Medium</option>
                <option value="3">🟢 Low</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">
                Subject
              </label>
              <select
                className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">None</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editingTaskId && !!editingTask}
        onClose={() => setEditingTaskId(null)}
        title={editingTask ? `Edit: ${editingTask.title}` : "Edit Task"}
      >
        <form onSubmit={handleSaveEdit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              Description
            </label>
            <textarea
              className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200 px-4 py-2.5 text-sm min-h-[80px] resize-y"
              placeholder="Optional details..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>
          <Input
            label="Deadline"
            type="datetime-local"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">
                Priority
              </label>
              <select
                className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="1">🔴 High</option>
                <option value="2">🟡 Medium</option>
                <option value="3">🟢 Low</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">
                Status
              </label>
              <select
                className="w-full rounded-xl bg-surface-800/50 border border-surface-700 text-surface-100 focus:border-primary-500 focus:outline-none px-4 py-2.5 text-sm"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">To Do</option>
                <option value="doing">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingTaskId(null)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
};
