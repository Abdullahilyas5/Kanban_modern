const BASE_URL = process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, "");

type ApiOptions = { method?: string; body?: unknown; token?: string };

async function apiFetch(path: string, options: ApiOptions = {}) {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("kanbanToken");
      localStorage.removeItem("kanbanUser");
      window.dispatchEvent(new Event("kanban:auth-invalidated"));
    }

    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function loginUserApi(credentials: { email: string; password: string }) {
  return apiFetch("/users/login", {
    method: "POST",
    body: credentials,
  });
}

export async function registerUserApi(credentials: { name: string; email: string; password: string }) {
  return apiFetch("/users/register", {
    method: "POST",
    body: credentials,
  });
}

export async function logoutUserApi() {
  return apiFetch("/users/logout", {
    method: "GET",
  });
}

export async function fetchBoardsApi(token: string) {
  return apiFetch("/boards", {
    token,
  });
}

export async function createBoardApi(token: string, name: string) {
  return apiFetch("/boards/", {
    method: "POST",
    token,
    body: { name },
  });
}

export async function createTaskApi(
  token: string,
  boardId: number,
  name: string,
  status = "todo",
  assigneeId?: number | null,
  assignee?: string,
  description = "",
  priority = "medium",
  dueDate?: string
) {
  return apiFetch("/tasks", {
    method: "POST",
    token,
    body: { boardId, name, status, assigneeId, assignee, description, priority, dueDate },
  });
}

export async function updateTaskStatusApi(token: string, taskId: number, status: string) {
  return apiFetch("/tasks/status", {
    method: "PATCH",
    token,
    body: { taskId, status },
  });
}

export async function deleteTaskApi(token: string, taskId: number) {
  return apiFetch(`/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
}

export async function updateTaskApi(
  token: string,
  taskId: number,
  payload: {
    name?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string | null;
    assigneeId?: number | null;
    dueDate?: string | null;
  }
) {
  return apiFetch(`/tasks/${taskId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function getAllUsers(token: string) {
  return apiFetch("/users/getusers", {
    token,
    method: "GET",
  });
}
