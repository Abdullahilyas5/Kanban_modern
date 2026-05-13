"use client";

import { useDroppable } from "@dnd-kit/core";

import { Plus } from "lucide-react";

import type { Task } from "../store/slices/boardSlice";

import TaskCard from "./TaskCard";

type Props = {
  status: string;
  label: string;
  tasks: Task[];
  activeTaskId: number | null;
  currentUserId: number | null;
  onAddTask: () => void;
  onDeleteTask: (taskId: number) => void;
  onStatusChange: (taskId: number, status: string) => void;
  onEditTask: (task: Task) => void;
};

const BoardColumn = ({
  status,
  label,
  tasks,
  activeTaskId,
  currentUserId,
  onAddTask,
  onDeleteTask,
  onStatusChange,
  onEditTask,
}: Props) => {

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (

    <section
      ref={setNodeRef}
      className={`flex h-full min-h-[560px] flex-col overflow-visible rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-sm transition-all duration-200
      ${
        isOver
          ? "border-[var(--primary-color)] bg-[var(--card-color)] shadow-xl ring-2 ring-[var(--primary-color)]/20"
          : ""
      }`}
    >

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-black/10 !p-4">

        <div className="min-w-0">

          <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">
            {label}
          </h3>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {tasks.length} Tasks
          </p>

        </div>

        <button
          onClick={onAddTask}
          aria-label={`Add task to ${label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--card-color)] transition-all duration-200 hover:bg-[var(--card-hover)]"
        >

          <Plus className="h-4 w-4" />

        </button>

      </div>

      {/* Tasks */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto !p-4">

        {tasks.length > 0 ? (

          tasks.map((task) => (

            <TaskCard
              key={task.id}
              task={task}
              onDelete={() => onDeleteTask(task.id)}
              isActive={activeTaskId === task.id}
              onStatusChange={(nextStatus) => onStatusChange(task.id, nextStatus)}
              onEdit={() => onEditTask(task)}
              currentUserId={currentUserId}
            />

          ))

        ) : (

          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--card-color)]/60 !p-6 text-center">

            <div>

              <p className="text-sm font-medium text-[var(--text-secondary)]">
                No tasks available
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Drag tasks here or create a new one
              </p>

            </div>

          </div>

        )}

      </div>

    </section>

  );
};

export default BoardColumn;
