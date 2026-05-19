import { TeamVisibility } from "@prisma/client";
import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(50, "Team name must be under 50 characters")
    .trim(),
  description: z
    .string()
    .max(300, "Description must be under 300 characters")
    .optional(),
  visibility: z.nativeEnum(TeamVisibility).optional().default("PUBLIC"),
  logoUrl: z.string().url("Invalid logo URL").optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  description: z.string().max(300).optional().nullable(),
  visibility: z.nativeEnum(TeamVisibility).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
