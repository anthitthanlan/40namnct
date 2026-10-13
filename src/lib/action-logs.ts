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

export type ActionLogQueryOptions = {
  entityId?: string;
  limit?: number;
  page?: number;
  offset?: number;
  action?: string;
  search?: string;
  all?: boolean;
};

export type ActionLogListResult = {
  items: ActionLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function queryActionLogs(
  token?: string,
  options?: ActionLogQueryOptions
): Promise<ActionLogListResult> {
  try {
    const params = new URLSearchParams();
    if (options?.entityId) params.set("entity_id", options.entityId);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.page) params.set("page", String(options.page));
    if (options?.offset !== undefined) params.set("offset", String(options.offset));
    if (options?.action) params.set("action", options.action);
    if (options?.search) params.set("search", options.search);
    if (options?.all) params.set("all", "true");

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_URL}/api/admin/logs${qs}`, {
      headers: getHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) {
      return { items: [], total: 0, page: 1, limit: 50, totalPages: 1 };
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      };
    }
    return {
      items: data.items || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 50,
      totalPages: data.totalPages || 1,
    };
  } catch {
    return { items: [], total: 0, page: 1, limit: 50, totalPages: 1 };
  }
}

export async function listActionLogs(
  token?: string,
  options?: ActionLogQueryOptions
): Promise<ActionLog[]> {
  const result = await queryActionLogs(token, options);
  return result.items;
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
