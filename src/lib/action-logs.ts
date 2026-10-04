export type ActionLogGroup = "posts" | "registrations" | "media";

export type ActionLog = {
  id: string;
  action: string;
  group: ActionLogGroup | string;
  entityId: string;
  adminName: string;
  adminUsername: string;
  adminRole: string;
  details: string;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

function getHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function listActionLogs(token?: string): Promise<ActionLog[]> {
  try {
    const res = await fetch(`${API_URL}/api/admin/logs`, {
      headers: getHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function logAction(
  action: ActionLog["action"],
  group: ActionLogGroup,
  entityId: string,
  adminName: string,
  adminUsername: string,
  adminRole: string,
  details: string
): Promise<ActionLog | null> {
  // Action logs are handled automatically by the FastAPI backend
  // when the Next.js app sends the authenticated API request.
  // This function is kept for backward compatibility if needed.
  return null;
}
