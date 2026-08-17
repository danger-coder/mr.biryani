import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(160)
  .email("Enter a valid email address.")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password is too long.");

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number.")
  .max(20)
  .regex(/^[0-9+\-\s()]+$/, "Phone can only contain digits and + - ( ) .");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "This reset link is invalid."),
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: phoneSchema.optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: passwordSchema,
});

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(40),
  address: z.string().trim().min(5, "Enter a street address.").max(200),
  city: z.string().trim().min(2, "City is required.").max(80),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
