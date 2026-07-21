import type { UserRole } from "@/types/sourcing";

export const taliaAppRoles = {
  platformAdmin: "Talia.PlatformAdmin",
  sourcingManager: "Talia.SourcingManager",
} as const;

export function resolveWorkspaceRole(claims: unknown): { role: UserRole; roles: string[] } {
  const record = claims && typeof claims === "object" ? claims as Record<string, unknown> : {};
  const roles = Array.isArray(record.roles) ? record.roles.filter((role): role is string => typeof role === "string") : [];
  const normalized = roles.map((role) => role.toLowerCase());
  const isAdmin = normalized.includes(taliaAppRoles.platformAdmin.toLowerCase());
  return { role: isAdmin ? "Platform Admin" : "Sourcing Manager", roles };
}
