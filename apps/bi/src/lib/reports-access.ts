import type { SavedReport, SharePermission, User } from "./types";

export function permissionFor(
  report: SavedReport,
  user: User,
): SharePermission | "owner" | null {
  if (report.ownerId === user.id || user.role === "admin") return "owner";
  const share = report.shares.find((s) => s.userId === user.id);
  return share ? share.permission : null;
}

export function canView(report: SavedReport, user: User): boolean {
  return permissionFor(report, user) !== null;
}

export function canEdit(report: SavedReport, user: User): boolean {
  const p = permissionFor(report, user);
  return p === "owner" || p === "edit";
}

export function canManage(report: SavedReport, user: User): boolean {
  return report.ownerId === user.id || user.role === "admin";
}
