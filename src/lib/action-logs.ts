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
  if (entityId === "sample" || entityId === "sample-group") {
    return null;
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.COOKIE_NAME || "nct_admin")?.value;

    const res = await fetch(`${API_URL}/api/admin/logs`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({
        action,
        entityId,
        adminName,
        adminRole,
        details
      }),
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to log action:", err);
    return null;
  }
}
