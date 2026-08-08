import { z } from "zod";

const optionalString = z.string().trim().min(1, "Value cannot be empty");

export const registerSchema = z.object({
  name: optionalString.min(2, "Name must be at least 2 characters"),
  email: z.email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: optionalString.optional(),
  profilePhoto: optionalString.optional(),
});

export const loginSchema = z.object({
  email: z.email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});
