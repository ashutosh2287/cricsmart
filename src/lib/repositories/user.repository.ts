import type { User } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateUserInput = {
  username: string;
  email: string;
  passwordHash: string;
  role?: string;
  avatarUrl?: string | null;
};

export async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

export async function findByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { username: username.trim() },
  });
}

export async function findByEmailOrUsername(identifier: string): Promise<User | null> {
  const normalized = identifier.trim();
  if (!normalized) return null;

  return prisma.user.findFirst({
    where: {
      OR: [
        { username: normalized },
        { email: normalized.toLowerCase() },
      ],
    },
  });
}

export async function createUser(input: CreateUserInput): Promise<User> {
  return prisma.user.create({
    data: {
      username: input.username.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      role: input.role ?? "public",
      avatarUrl: input.avatarUrl ?? null,
    },
  });
}

export async function findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

