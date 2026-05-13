import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginUserApi, logoutUserApi, registerUserApi } from "../../../lib/api";

export interface User { id: number; name: string; email: string; }

type AuthState = {
  token: string | null;
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const getSavedUser = () => {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("kanbanUser");
  if (!saved) return null;
  try {
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
};

const isUsableToken = (token: string | null) => {
  if (!token) return false;

  try {
    const [, payload] = token.split(".");
    if (!payload) return false;

    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };

    return !decoded.exp || decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const getSavedToken = () => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("kanbanToken");
  if (isUsableToken(token)) return token;

  localStorage.removeItem("kanbanToken");
  localStorage.removeItem("kanbanUser");
  return null;
};

const initialToken = getSavedToken();
const initialUser = getSavedUser();

const initialState: AuthState = {
  token: initialToken,
  user: initialUser,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk("auth/login", async (credentials: { email: string; password: string }) => {
  const response = await loginUserApi(credentials);
  return response;
});

export const register = createAsyncThunk(
  "auth/register",
  async (credentials: { name: string; email: string; password: string }) => {
    const response = await registerUserApi(credentials);
    return response;
  }
);

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  await logoutUserApi();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("kanbanToken");
        localStorage.removeItem("kanbanUser");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        if (typeof window !== "undefined") {
          localStorage.setItem("kanbanToken", action.payload.token);
          localStorage.setItem("kanbanUser", JSON.stringify(action.payload.user));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Login failed";
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        if (typeof window !== "undefined") {
          localStorage.setItem("kanbanToken", action.payload.token);
          localStorage.setItem("kanbanUser", JSON.stringify(action.payload.user));
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Registration failed";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.status = "idle";
        state.error = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("kanbanToken");
          localStorage.removeItem("kanbanUser");
        }
      })
      .addCase(logoutUser.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.status = "idle";
        state.error = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("kanbanToken");
          localStorage.removeItem("kanbanUser");
        }
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
