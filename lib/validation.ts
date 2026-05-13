import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

export const boardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(50, "Board name is too long"),
});

export const taskSchema = z.object({
  name: z.string().min(1, "Task name is required").max(120, "Task name is too long"),
  boardId: z.number().positive("Board must be selected"),
});
