"use client";

import type { HTMLAttributes } from "react";

import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { Eye, GripVertical, Trash2, UserRound } from "lucide-react";

type TaskType = {
  id: number;
  name?: string;
  title?: string;
  status: string;
  description?: string;
  priority?: string;
  dueDate?: string | null;
  assignee?: string | null;
  assigneeId?: number | null;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
  assignedUser?: {
    id: number;
    name: string;
  };
};

type Props = {
  task: TaskType;
  onDelete: () => void;
  isActive?: boolean;
  isOverlay?: boolean;
  onStatusChange?: (status: string) => void;
  onEdit?: () => void;
  currentUserId?: number | null;
};

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const TaskCardView = ({
  task,
  onDelete,
  isActive,
  isOverlay,
  onStatusChange,
  onEdit,
  currentUserId,
  dragHandleProps,
  setDragHandleRef,
}: Props & {
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  setDragHandleRef?: (element: HTMLButtonElement | null) => void;
}) => {
  const assigneeName = task.assignedUser?.name || task.assignee;
  const createdBy = task.user?.name || "Unknown";
  const isAssignedToMe = Boolean(currentUserId && task.assigneeId === currentUserId);
  const isCreatedByMe = Boolean(currentUserId && task.user?.id === currentUserId);

  return (
    <article
      className={`group rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !p-4 shadow-sm transition-[border-color,background-color,box-shadow,opacity] duration-200 hover:border-[var(--primary-color)] hover:bg-[var(--card-hover)] ${
        isActive ? "opacity-40" : ""
      } ${isAssignedToMe && !isOverlay ? "border-[var(--secondary-color)] bg-cyan-500/10 ring-1 ring-cyan-400/30" : ""} ${
        isOverlay ? "z-[9999] cursor-grabbing border-[var(--primary-color)] shadow-2xl ring-2 ring-[var(--primary-color)]/20" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          ref={setDragHandleRef}
          type="button"
          aria-label="Drag task"
          className="mt-0.5 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-color)] hover:text-[var(--text-primary)] active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h4 className="break-words text-sm font-semibold leading-6 text-[var(--text-primary)]">
            {task.name || task.title || "Untitled task"}
          </h4>

          {assigneeName && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <UserRound className="h-3.5 w-3.5" />
              <span className="truncate">
                Assigned to {isAssignedToMe ? "me" : assigneeName}
              </span>
            </div>
          )}

          <div className="mt-2 text-xs text-[var(--text-muted)]">
            Created by {isCreatedByMe ? "me" : createdBy}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {isAssignedToMe && (
              <span className="rounded-full bg-cyan-400/15 !px-2.5 !py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
                Assigned to me
              </span>
            )}
            {task.priority && (
              <span className="rounded-full bg-[var(--surface-color)] !px-2.5 !py-1 text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                {task.priority}
              </span>
            )}
            {task.dueDate && (
              <span className="rounded-full bg-[var(--surface-color)] !px-2.5 !py-1 text-[11px] text-[var(--text-secondary)]">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {onStatusChange && !isOverlay && (
            <select
              value={task.status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="mt-3 w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] !px-3 !py-2 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--primary-color)]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {!isOverlay && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onEdit}
              aria-label="View or edit task"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-muted)] transition-all hover:bg-[var(--surface-color)] hover:text-[var(--text-primary)]"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete task"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-muted)] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

const TaskCard = ({
  task,
  onDelete,
  isActive = false,
  isOverlay = false,
  onStatusChange,
  onEdit,
  currentUserId,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task-${task.id}`,
      data: {
        taskId: task.id,
        status: task.status,
      },
      disabled: isOverlay,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
      }}
      className={isDragging ? "relative z-[999]" : "relative"}
    >
      <TaskCardView
        task={task}
        onDelete={onDelete}
        isActive={isDragging || isActive}
        isOverlay={isOverlay}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        currentUserId={currentUserId}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
};

export default TaskCard;
