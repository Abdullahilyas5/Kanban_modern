"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Lock, Loader2, Mail, User, UserPlus, LogIn } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login, register } from "../store/slices/authSlice";
import { loginSchema, registerSchema } from "../../lib/validation";

interface AuthPanelProps {
  mode: "login" | "register";
}

const AuthPanel = ({ mode }: AuthPanelProps) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const showSuccess = auth.status === "succeeded";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validation = mode === "login"
      ? loginSchema.safeParse({ email, password })
      : registerSchema.safeParse({ name, email, password });

    if (!validation.success) {
      setFormError(validation.error.errors[0]?.message ?? "Please fix the form");
      return;
    }

    if (mode === "login") {
      await dispatch(login({ email, password }));
    } else {
      await dispatch(register({ name, email, password }));
    }
  };

  return (
    <div className="auth-shell min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-sky-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {showSuccess && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Welcome back!
            </div>
          </div>
        )}

        <div className="auth-card rounded-3xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-slate-950/50">
          <div className="auth-header text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-sky-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              {mode === "login" ? (
                <LogIn className="w-6 h-6 text-white" />
              ) : (
                <UserPlus className="w-6 h-6 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === "login" ? "Welcome back" : "Join the team"}
            </h1>
            <p className="text-slate-400">
              {mode === "login"
                ? "Sign in to access your Kanban boards"
                : "Create your account to get started"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "register" && (
              <div className="auth-field space-y-2">
                <label className="auth-label text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="auth-input w-full rounded-2xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-white outline-none transition-all duration-200 focus:border-sky-500 focus:bg-slate-800 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-500"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="auth-field space-y-2">
              <label className="auth-label text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input w-full rounded-2xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-white outline-none transition-all duration-200 focus:border-sky-500 focus:bg-slate-800 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-500"
                placeholder="Enter your email"
              />
            </div>

            <div className="auth-field space-y-2">
              <label className="auth-label text-sm font-medium text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input w-full rounded-2xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-white outline-none transition-all duration-200 focus:border-sky-500 focus:bg-slate-800 focus:ring-2 focus:ring-sky-500/20 placeholder-slate-500"
                placeholder="Enter your password"
              />
            </div>

            {(formError || auth.error) && (
              <div className="auth-error rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{formError || auth.error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={auth.status === "loading"}
              className="auth-button w-full rounded-2xl bg-gradient-to-r from-sky-500 to-purple-600 px-6 py-4 text-sm font-semibold text-white transition-all duration-200 hover:from-sky-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {auth.status === "loading" ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </div>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          <div className="auth-footer mt-8 text-center">
            {mode === "login" ? (
              <Link href="/signup" className="text-sm text-slate-400 hover:text-sky-400 transition-colors duration-200">
                New to Kanban? <span className="font-semibold text-sky-400">Create an account</span>
              </Link>
            ) : (
              <Link href="/" className="text-sm text-slate-400 hover:text-sky-400 transition-colors duration-200">
                Already have an account? <span className="font-semibold text-sky-400">Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPanel;
