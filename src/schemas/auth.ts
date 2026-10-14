import { z } from 'zod';

export const UserRoleSchema = z.enum(['CITIZEN', 'VOLUNTEER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SendOtpRequestSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.'),
});
export type SendOtpRequest = z.infer<typeof SendOtpRequestSchema>;

export const LoginRequestSchema = z.object({
  role: UserRoleSchema,
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain numbers only'),
  volunteer_id: z.string().optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const UserProfileSchema = z.object({
  user_id: z.string(),
  name: z.string(),
  role: UserRoleSchema,
  masked_phone: z.string(),
  district: z.string(),
  mandal: z.string().optional(),
  cluster_id: z.string().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const AuthSessionSchema = z.object({
  user: UserProfileSchema,
  token: z.string(),
  expires_at: z.string(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
