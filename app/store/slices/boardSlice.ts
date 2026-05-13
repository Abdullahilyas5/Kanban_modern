import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createBoardApi, createTaskApi, deleteTaskApi, fetchBoardsApi, updateTaskApi, updateTaskStatusApi } from "../../../lib/api";

export interface Task {
  id: number;
  name: string;
  description: string;
  boardId: number;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: string | null;
  assigneeId: number | null;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Board {
  id: number;
  name: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  tasks: Task[];
}

interface BoardState {
  boards: Board[];
  selectedBoardId: number | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  mutationStatus: "idle" | "loading";
  error: string | null;
}

const initialState: BoardState = {
  boards: [],
  selectedBoardId: null,
  status: "idle",
  mutationStatus: "idle",
  error: null,
};

export const fetchBoards = createAsyncThunk("boards/fetchBoards", async (options: { silent?: boolean } | undefined, thunkAPI) => {
  const token = (thunkAPI.getState() as { auth: { token: string | null } }).auth.token;
  if (!token) throw new Error("Authentication required");
  const response = await fetchBoardsApi(token);
  return { boards: response.boards as Board[], silent: options?.silent ?? false };
});

export const addBoard = createAsyncThunk("boards/addBoard", async ({ name }: { name: string }, thunkAPI) => {
  const token = (thunkAPI.getState() as { auth: { token: string | null } }).auth.token;
  if (!token) throw new Error("Authentication required");
  const response = await createBoardApi(token, name);
  return response.board as Board;
});

export const addTask = createAsyncThunk("boards/addTask", async ({ boardId, name, status, assigneeId, assignee, description, priority, dueDate }: { boardId: number; name: string; status: string; assigneeId?: number | null; assignee?: string; description?: string; priority?: string; dueDate?: string }, thunkAPI) => {
  const token = (thunkAPI.getState() as { auth: { token: string | null } }).auth.token;
  if (!token) throw new Error("Authentication required");
  const response = await createTaskApi(token, boardId, name, status, assigneeId, assignee, description, priority, dueDate);
  return response.task as Task;
});

export const editTask = createAsyncThunk("boards/editTask", async ({ taskId, updates }: { taskId: number; updates: Partial<Pick<Task, "name" | "description" | "status" | "priority" | "assignee" | "assigneeId" | "dueDate">> }, thunkAPI) => {
  const token = (thunkAPI.getState() as { auth: { token: string | null } }).auth.token;
  if (!token) throw new Error("Authentication required");
  const response = await updateTaskApi(token, taskId, updates);
  return response.task as Task;
});

export const moveTask = createAsyncThunk("boards/moveTask", async ({ taskId, status }: { taskId: number; status: string }, thunkAPI) => {
  const token = (thunkAPI.getState() as { auth: { token: string | null } }).auth.token;
  if (!token) throw new Error("Authentication required");
  const response = await updateTaskStatusApi(token, taskId, status);
  return {
    taskId,
    status,
    task: response.task as Task,
  };
});

export const removeTask = createAsyncThunk("boards/removeTask", async ({ taskId }: { taskId: number }, thunkAPI) => {
  const token = (thunkAPI.getState() as { auth: { token: string | null } }).auth.token;
  if (!token) throw new Error("Authentication required");
  await deleteTaskApi(token, taskId);
  return taskId;
});

const boardSlice = createSlice({
  name: "boards",
  initialState,
  reducers: {
    setSelectedBoardId(state, action: PayloadAction<number>) {
      state.selectedBoardId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.status = "loading";
        }
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.boards = action.payload.boards;
        state.error = null;
        if (!state.selectedBoardId && action.payload.boards.length > 0) {
          state.selectedBoardId = action.payload.boards[0].id;
        }
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Unable to load boards";
      })
      .addCase(addBoard.fulfilled, (state, action) => {
        state.boards.push(action.payload);
        state.selectedBoardId = action.payload.id;
        state.error = null;
      })
      .addCase(addBoard.rejected, (state, action) => {
        state.error = action.error.message || "Unable to add board";
      })
      .addCase(addTask.pending, (state) => {
        state.mutationStatus = "loading";
        state.error = null;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.mutationStatus = "idle";
        const board = state.boards.find((board) => board.id === action.payload.boardId);
        if (board) {
          board.tasks.push(action.payload);
        }
      })
      .addCase(addTask.rejected, (state, action) => {
        state.mutationStatus = "idle";
        state.error = action.error.message || "Unable to add task";
      })
      .addCase(editTask.fulfilled, (state, action) => {
        for (const board of state.boards) {
          const taskIndex = board.tasks.findIndex((item) => item.id === action.payload.id);
          if (taskIndex >= 0) {
            board.tasks[taskIndex] = { ...board.tasks[taskIndex], ...action.payload };
            break;
          }
        }
      })
      .addCase(editTask.rejected, (state, action) => {
        state.error = action.error.message || "Unable to edit task";
      })
      .addCase(moveTask.fulfilled, (state, action) => {
        const { taskId, status, task: updatedTask } = action.payload;
        for (const board of state.boards) {
          const taskIndex = board.tasks.findIndex((item) => item.id === taskId);
          if (taskIndex >= 0) {
            board.tasks[taskIndex] = { ...board.tasks[taskIndex], ...updatedTask, status };
            break;
          }
        }
      })
      .addCase(moveTask.rejected, (state, action) => {
        state.error = action.error.message || "Unable to update task status";
      })
      .addCase(removeTask.pending, (state) => {
        state.mutationStatus = "loading";
        state.error = null;
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        state.mutationStatus = "idle";
        for (const board of state.boards) {
          board.tasks = board.tasks.filter((task) => task.id !== action.payload);
        }
      })
      .addCase(removeTask.rejected, (state, action) => {
        state.mutationStatus = "idle";
        state.error = action.error.message || "Unable to delete task";
      });
  },
});

export const { setSelectedBoardId } = boardSlice.actions;

export const selectCurrentBoard = (state: { boards: BoardState }) => {
  const selectedId = state.boards.selectedBoardId;
  return state.boards.boards.find((board) => board.id === selectedId) ?? state.boards.boards[0] ?? null;
};

export default boardSlice.reducer;
