"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  addTask,
  editTask,
  fetchBoards,
  moveTask,
  removeTask,
  selectCurrentBoard,
  setSelectedBoardId,
} from "../store/slices/boardSlice";
import type { Task } from "../store/slices/boardSlice";

import {
  logout,
  logoutUser,
} from "../store/slices/authSlice";

import {
  useAppDispatch,
  useAppSelector,
} from "../store/hooks";

import {
  taskSchema,
} from "../../lib/validation";

import {
  getAllUsers,
  createBoardApi,
} from "../../lib/api";

import BoardColumn from "./BoardColumn";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import AuthPanel from "./AuthPanel";

const statuses = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

type UserOption = {
  id: number;
  name: string;
};

const KanbanApp = () => {
  const dispatch = useAppDispatch();

  const auth = useAppSelector((state) => state.auth);
  const boardState = useAppSelector((state) => state.boards);
  const currentBoard = useAppSelector(selectCurrentBoard);
  const currentUserId = auth.user?.id ?? null;

  const [newBoardName, setNewBoardName] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("todo");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [assignedUser, setAssignedUser] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const boardOptions = useMemo(
    () =>
      boardState.boards.map((board) => ({
        id: board.id,
        name: board.name,
        ownerId: board.userId,
        ownerName: board.user?.name,
      })),
    [boardState.boards]
  );

  const activeTask = useMemo(
    () => currentBoard?.tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, currentBoard]
  );

  const invalidateSession = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  // FETCH BOARDS
  useEffect(() => {
    if (auth.token) {
      dispatch(fetchBoards());
    }
  }, [auth.token, dispatch]);

  useEffect(() => {
    if (!auth.token) return;

    const intervalId = window.setInterval(() => {
      dispatch(fetchBoards({ silent: true }));
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [auth.token, dispatch]);

  useEffect(() => {
    const handleInvalidToken = () => {
      invalidateSession();
    };

    window.addEventListener("kanban:auth-invalidated", handleInvalidToken);

    return () => {
      window.removeEventListener("kanban:auth-invalidated", handleInvalidToken);
    };
  }, [dispatch, invalidateSession]);

  // DEFAULT BOARD
  useEffect(() => {
    if (!boardState.selectedBoardId && boardState.boards.length > 0) {
      dispatch(setSelectedBoardId(boardState.boards[0].id));
    }
  }, [boardState.boards, boardState.selectedBoardId, dispatch]);

  // AUTO LOGOUT ON ERROR
  useEffect(() => {
    if (
      boardState.status === "failed" &&
      boardState.error?.toLowerCase().includes("unauthorized")
    ) {
      invalidateSession();
    }
  }, [boardState.status, boardState.error, dispatch, invalidateSession]);

  // USERS
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!auth.token) return;
        const data = await getAllUsers(auth.token);
        setUsers(data.users || data);
      } catch (err) {
        if (err instanceof Error && err.message.toLowerCase().includes("unauthorized")) {
          invalidateSession();
        }
      }
    };

    fetchUsers();
  }, [auth.token, invalidateSession]);

  if (!auth.token) {
    return <AuthPanel mode="login" />;
  }

  // =========================
  // ✅ FIXED CREATE BOARD FLOW
  // =========================
  const handleBoardCreate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = newBoardName.trim();
    const token = auth.token;
    if (!name || !token) return;

    try {
      // 1. API CALL
      await createBoardApi(token, name);

      // 2. REFRESH BOARDS FROM SERVER (SOURCE OF TRUTH)
      await dispatch(fetchBoards());

      // 3. RESET INPUT
      setNewBoardName("");
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("unauthorized")) {
        invalidateSession();
      }
    }
  };

  // ADD TASK (UNCHANGED LOGIC)
  const handleAddTask = async (
    taskTitle: string,
    status: string
  ) => {
    if (!currentBoard) return;

    const parsed = taskSchema.safeParse({
      name: taskTitle.trim(),
      boardId: currentBoard.id,
    });

    if (!parsed.success) return;

    const assignedUserName =
      users.find((user) => String(user.id) === assignedUser)?.name || "";

    await dispatch(
      addTask({
        boardId: parsed.data.boardId,
        name: parsed.data.name,
        status,
        assigneeId: assignedUser ? Number(assignedUser) : null,
        assignee: assignedUserName,
        description: taskDescription,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      })
    );
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) return;

    if (modalMode === "edit" && editingTask) {
      const assignedUserName =
        users.find((user) => String(user.id) === assignedUser)?.name || "";

      await dispatch(
        editTask({
          taskId: editingTask.id,
          updates: {
            name: taskName.trim(),
            description: taskDescription,
            status: selectedStatus,
            priority: taskPriority,
            assigneeId: assignedUser ? Number(assignedUser) : null,
            assignee: assignedUserName,
            dueDate: taskDueDate || null,
          },
        })
      );
    } else {
      await handleAddTask(taskName, selectedStatus);
    }

    setTaskName("");
    setTaskDescription("");
    setAssignedUser("");
    setTaskPriority("medium");
    setTaskDueDate("");
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };

  const openTaskModal = (status: string) => {
    setModalMode("create");
    setEditingTask(null);
    setTaskName("");
    setTaskDescription("");
    setSelectedStatus(status);
    setAssignedUser("");
    setTaskPriority("medium");
    setTaskDueDate("");
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setModalMode("edit");
    setEditingTask(task);
    setTaskName(task.name || "");
    setTaskDescription(task.description || "");
    setSelectedStatus(task.status || "todo");
    setAssignedUser(task.assigneeId ? String(task.assigneeId) : "");
    setTaskPriority(task.priority || "medium");
    setTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setIsTaskModalOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    if (activeId.startsWith("task-")) {
      setActiveTaskId(Number(activeId.replace("task-", "")));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTaskId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    if (!activeId.startsWith("task-")) return;

    if (!statuses.some((s) => s.key === overId)) return;

    const taskId = Number(activeId.replace("task-", ""));

    const activeTask = currentBoard?.tasks.find((task) => task.id === taskId);

    if (activeTask?.status === overId) return;

    dispatch(
      moveTask({
        taskId,
        status: overId,
      })
    );
  };

  return (
    <div className="flex min-h-screen bg-[var(--background-color)] text-[var(--text-primary)]">

      {/* Sidebar (UNCHANGED UI) */}
      <aside className="hidden w-[300px] flex-col border-r border-[var(--border-color)] bg-[var(--surface-color)] lg:flex">

        <div className="flex items-center gap-4 border-b border-[var(--border-color)] !p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-color)] shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--secondary-color)]">
              Workspace
            </p>
            <h1 className="text-2xl font-bold">KanbanFlow</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto !p-4">
          <div className="space-y-2">
            {boardOptions.map((board) => (
              <button
                key={board.id}
                onClick={() =>
                  dispatch(setSelectedBoardId(board.id))
                }
                className={`flex w-full items-center gap-3 rounded-2xl border !px-4 !py-3 text-left transition-all
                ${
                  board.id === boardState.selectedBoardId
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white shadow-lg"
                    : board.ownerId === currentUserId
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-color)]"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{board.name}</span>
                  <span className="mt-0.5 block truncate text-xs opacity-75">
                    {board.ownerId === currentUserId ? "My board" : `By ${board.ownerName || "Unknown"}`}
                  </span>
                </span>
                {board.ownerId === currentUserId && (
                  <span className="rounded-full bg-amber-300/20 !px-2 !py-1 text-[10px] font-semibold uppercase tracking-wide">
                    Mine
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] !p-4">
          <form onSubmit={handleBoardCreate} className="flex gap-2">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Create board..."
              className="flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !px-4 !py-3 outline-none focus:border-[var(--primary-color)]"
            />

            <button
              type="submit"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-color)]"
            >
              <Plus className="h-5 w-5 text-white" />
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN (UNCHANGED UI) */}
      <div className="flex flex-1 flex-col overflow-hidden">

        <header className="flex flex-col gap-4 border-b border-[var(--border-color)] bg-[var(--surface-color)] !px-5 !py-5 md:flex-row md:items-center md:justify-between md:!px-8">

          <div>
            <h2 className="text-3xl font-bold">
              {currentBoard?.name || "Dashboard"}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {currentBoard ? "Drag tasks between columns to update their status." : "Create a board to start organizing tasks."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <form onSubmit={handleBoardCreate} className="flex min-w-[260px] flex-1 gap-2 lg:hidden">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Create board..."
                className="min-w-0 flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)] !px-4 !py-3 outline-none focus:border-[var(--primary-color)]"
              />

              <button
                type="submit"
                aria-label="Create board"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-color)]"
              >
                <Plus className="h-5 w-5 text-white" />
              </button>
            </form>

            <button
              onClick={() => openTaskModal("todo")}
              disabled={!currentBoard}
              className="flex items-center gap-2 rounded-2xl bg-[var(--primary-color)] !px-5 !py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>

            <button
              onClick={() => dispatch(logoutUser())}
              className="rounded-2xl bg-red-500/10 !px-4 !py-3 text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>

          </div>

        </header>

        {/* BOARD */}
        <div className="flex-1 overflow-x-auto !p-4 md:!p-6">

          {boardState.status === "loading" && (
            <div className="flex h-full min-h-[520px] items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-muted)]">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading boards
            </div>
          )}

          {boardState.status !== "loading" && !currentBoard && (
            <div className="flex h-full min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-color)] !p-6 text-center">
              <div className="max-w-md">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  No board selected
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Create a board from the sidebar or the top bar, then your To Do, In Progress, and Done columns will appear here.
                </p>
              </div>
            </div>
          )}

          {boardState.status !== "loading" && currentBoard && (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveTaskId(null)}
            >
              <div className="grid min-w-[920px] grid-cols-3 gap-5 xl:min-w-0">

                {statuses.map((status) => (
                  <BoardColumn
                    key={status.key}
                    status={status.key}
                    label={status.label}
                    tasks={currentBoard.tasks.filter(
                      (t) => t.status === status.key
                    )}
                    activeTaskId={activeTaskId}
                    currentUserId={currentUserId}
                    onAddTask={() => openTaskModal(status.key)}
                    onDeleteTask={(taskId) =>
                      dispatch(removeTask({ taskId }))
                    }
                    onStatusChange={(taskId, nextStatus) =>
                      dispatch(moveTask({ taskId, status: nextStatus }))
                    }
                    onEditTask={openEditTaskModal}
                  />
                ))}

              </div>
              <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
                {activeTask ? (
                  <div className="w-[280px]">
                      <TaskCard
                        task={activeTask}
                        onDelete={() => undefined}
                        isOverlay
                        currentUserId={currentUserId}
                      />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

        </div>
      </div>

      {/* MODAL (UNCHANGED) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        mode={modalMode}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        taskName={taskName}
        setTaskName={setTaskName}
        description={taskDescription}
        setDescription={setTaskDescription}
        status={selectedStatus}
        setStatus={setSelectedStatus}
        priority={taskPriority}
        setPriority={setTaskPriority}
        dueDate={taskDueDate}
        setDueDate={setTaskDueDate}
        users={users}
        assignedUser={assignedUser}
        setAssignedUser={setAssignedUser}
        createdBy={editingTask?.user?.name}
      />

    </div>
  );
};

export default KanbanApp;
