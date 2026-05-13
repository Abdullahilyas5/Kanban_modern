"use client";

import { X } from "lucide-react";

type UserOption = {
  id: number;
  name: string;
};

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: () => void;
  taskName: string;
  setTaskName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  priority: string;
  setPriority: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  users: UserOption[];
  assignedUser: string;
  setAssignedUser: (value: string) => void;
  createdBy?: string;
};

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TaskModal = ({
  isOpen,
  mode,
  onClose,
  onSubmit,
  taskName,
  setTaskName,
  description,
  setDescription,
  status,
  setStatus,
  priority,
  setPriority,
  dueDate,
  setDueDate,
  users,
  assignedUser,
  setAssignedUser,
  createdBy,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 !p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[var(--surface-color)] !p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "edit" ? "Task Details" : "Create Task"}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {mode === "edit" ? "View and update task information." : "Add a new task to the shared dashboard."}
            </p>
            {createdBy && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Created by {createdBy}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--card-color)] !p-2 hover:bg-[var(--card-hover)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">Title</span>
            <input
              type="text"
              placeholder="Task title..."
              value={taskName}
              onChange={(event) => setTaskName(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !px-4 !py-3 outline-none focus:border-[var(--primary-color)]"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">Description</span>
            <textarea
              placeholder="What needs to be done?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !px-4 !py-3 outline-none focus:border-[var(--primary-color)]"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !px-4 !py-3 outline-none focus:border-[var(--primary-color)]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">Priority</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !px-4 !py-3 outline-none focus:border-[var(--primary-color)]"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">Assignee</span>
            <select
              value={assignedUser}
              onChange={(event) => setAssignedUser(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !px-4 !py-3 outline-none focus:border-[var(--primary-color)]"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">Due Date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !px-4 !py-3 outline-none focus:border-[var(--primary-color)]"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[var(--card-color)] !px-5 !py-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-2xl bg-[var(--primary-color)] !px-5 !py-3 font-medium text-white"
          >
            {mode === "edit" ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
