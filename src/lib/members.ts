import { UNIT_PRICE, type Size, type InvitationStatus } from "./invitation-view";

export { SIZES, UNIT_PRICE } from "./invitation-view";
export type { Size, InvitationStatus } from "./invitation-view";
export const MAX_GROUP_QUANTITY = 500;

export type InvitationType = "individual" | "group";

export type Member = {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
};

export type OcrResult = {
  amount: number | null;
  content: string | null;
  time: string | null;
  transactionId?: string | null;
  transactionStatus?: "success" | "pending" | "failed" | "unknown";
  trustScore?: number | null;
  confidence: "high" | "low" | "mismatch" | "system_error";
  note: string;
  provider: string;
};

export type ReceiptAttempt = {
  url: string;
  ocrResult: OcrResult;
  createdAt: string;
};

export type CheckInEntry = {
  name: string;
  time: string;
  by?: string;
};

export type Invitation = {
  id: string;
  code: string;
  memberId: string;
  nienKhoa?: string;
  type: InvitationType;
  attendeeName: string;
  size: string | null;
  quantity: number;
  sizes: Record<string, number>;
  snacks: number;
  amount: number;
  status: InvitationStatus;
  note: string;
  lastSessionId?: string;
  paymentClaimedAt?: string;
  receiptUrl?: string;
  ocrResult?: OcrResult;
  receiptAttempts?: ReceiptAttempt[];
  checkedIn?: boolean;
  checkedInAt?: string | null;
  checkinEntries?: CheckInEntry[];
  shirtReceived?: boolean;
  shirtReceivedAt?: string | null;
  emailSent?: boolean;
  emailSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvitationInput = {
  type: InvitationType;
  nienKhoa?: string;
  attendeeName: string;
  size: Size | null;
  quantity: number;
  sizes: Record<string, number>;
  snacks: number;
  note: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

function getHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) {
    digits = `0${digits.slice(2)}`;
  }
  if (!/^0\d{8,10}$/.test(digits)) return null;
  return digits;
}

export async function listMembers(token?: string): Promise<Member[]> {
  const res = await fetch(`${API_URL}/api/members`, {
    headers: getHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) return [];
  return await res.json();
}

export async function findMemberByPhone(
  phone: string,
  token?: string,
): Promise<Member | null> {
  // Try to search via all members - or a specific backend endpoint if available.
  const res = await fetch(`${API_URL}/api/members`, {
    headers: getHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const members: Member[] = await res.json();
  return members.find((m) => m.phone === phone) || null;
}

export async function createMember(
  name: string,
  phone: string,
  email: string,
): Promise<{ ok: true; member: Member } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${API_URL}/api/members`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name, phone, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, message: data.detail || "Đã xảy ra lỗi khi tạo thành viên." };
    }
    return { ok: true, member: data };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

export async function getMemberById(id: string): Promise<Member | null> {
  const res = await fetch(`${API_URL}/api/members/${id}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function listInvitations(token?: string): Promise<Invitation[]> {
  const res = await fetch(`${API_URL}/api/invitations`, {
    headers: getHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) return [];
  return await res.json();
}

export type PublicStats = {
  orderCount: number;
  attendeeCount: number;
  memberCount: number;
  totalAmount: number;
};

export async function getPublicStats(): Promise<PublicStats> {
  try {
    const res = await fetch(`${API_URL}/api/invitations/public-stats`, {
      next: { revalidate: 60 },
    });
    if (res.ok) return await res.json();
  } catch {}
  return { orderCount: 0, attendeeCount: 0, memberCount: 0, totalAmount: 0 };
}

export async function findInvitationByCode(code: string): Promise<Invitation | null> {
  const res = await fetch(`${API_URL}/api/invitations/${code.trim()}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function findInvitationById(id: string): Promise<Invitation | null> {
  const res = await fetch(`${API_URL}/api/invitations/${id}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function listInvitationsByMember(memberId: string): Promise<Invitation[]> {
  const res = await fetch(`${API_URL}/api/invitations?member_id=${memberId}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function createInvitation(
  memberId: string,
  input: InvitationInput,
): Promise<Invitation> {
  const body = {
    memberId,
    nienKhoa: input.nienKhoa,
    type: input.type,
    attendeeName: input.attendeeName || "",
    size: input.size,
    quantity: input.quantity,
    sizes: input.sizes,
    snacks: input.snacks,
    note: input.note,
  };
  const res = await fetch(`${API_URL}/api/invitations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error("Failed to create invitation");
  }
  return await res.json();
}

export async function setInvitationStatus(
  id: string,
  status: InvitationStatus,
  token?: string,
): Promise<Invitation | null> {
  const res = await fetch(`${API_URL}/api/invitations/${id}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function setShirtReceived(
  id: string,
  shirtReceived: boolean,
  token?: string,
): Promise<Invitation | null> {
  const res = await fetch(`${API_URL}/api/invitations/${id}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify({ shirtReceived }),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function updateInvitationDetails(
  id: string,
  updates: any,
  token?: string,
): Promise<Invitation | null> {
  const res = await fetch(`${API_URL}/api/invitations/${id}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify(updates),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function claimPayment(
  id: string,
  sessionId?: string,
): Promise<Invitation | null> {
  // If we just need to set status to pending_approval and log sessionId
  const res = await fetch(`${API_URL}/api/invitations/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status: "pending_approval", lastSessionId: sessionId }),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function updateInvitationReceipt(
  id: string,
  receiptUrl: string,
  ocrResult: OcrResult,
  token?: string,
): Promise<Invitation | null> {
  // In FastAPI, receiptUrl and ocrResult update is likely done via PATCH /api/invitations/{id}
  // Let's pass the new status based on OCR confidence
  let status = "pending_approval";
  if (ocrResult.confidence === "high") {
    status = "confirmed";
  }
  
  const res = await fetch(`${API_URL}/api/invitations/${id}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify({ receiptUrl, ocrResult, status }),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function checkInInvitation(
  id: string,
  options?: { attendeeName?: string; adminName?: string; token?: string },
): Promise<{ ok: boolean; invitation?: Invitation; message?: string }> {
  const token = options?.token;
  const inv = await findInvitationById(id);
  if (!inv) return { ok: false, message: "Không tìm thấy vé trong hệ thống" };
  if (inv.status !== "confirmed") {
    return {
      ok: false,
      message: `Vé chưa được duyệt phát hành (trạng thái: ${inv.status})`,
    };
  }

  const nowIso = new Date().toISOString();
  const existingEntries: CheckInEntry[] = Array.isArray(inv.checkinEntries) ? [...inv.checkinEntries] : [];

  if (inv.type === "group") {
    const maxQty = inv.quantity || 1;
    if (existingEntries.length >= maxQty) {
      return {
        ok: false,
        invitation: inv,
        message: `Vé tập thể này đã hoàn tất check-in đủ ${existingEntries.length}/${maxQty} suất.`,
      };
    }

    const attendeeName = options?.attendeeName?.trim();
    if (!attendeeName) {
      return {
        ok: false,
        invitation: inv,
        message: "Vui lòng nhập họ và tên của người tham dự cho lượt check-in này.",
      };
    }

    existingEntries.push({
      name: attendeeName,
      time: nowIso,
      by: options?.adminName || "Check-in Staff",
    });

    const isFull = existingEntries.length >= maxQty;
    const res = await fetch(`${API_URL}/api/invitations/${id}`, {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({
        checkinEntries: existingEntries,
        checkedIn: isFull,
      }),
    });
    if (!res.ok) return { ok: false, message: "Lỗi cập nhật server" };
    const updated = await res.json();
    return {
      ok: true,
      invitation: updated,
      message: `Check-in thành công: ${attendeeName} (Lượt ${existingEntries.length}/${maxQty})`,
    };
  } else {
    // Individual
    if (inv.checkedIn) {
      return {
        ok: false,
        invitation: inv,
        message: `Vé này đã được quét vào cổng lúc ${new Date(inv.checkedInAt || "").toLocaleTimeString("vi-VN")}`,
      };
    }

    const attendeeName = options?.attendeeName?.trim() || inv.attendeeName;
    existingEntries.push({
      name: attendeeName,
      time: nowIso,
      by: options?.adminName || "Check-in Staff",
    });

    const res = await fetch(`${API_URL}/api/invitations/${id}`, {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({
        checkedIn: true,
        checkinEntries: existingEntries,
      }),
    });
    if (!res.ok) return { ok: false, message: "Lỗi cập nhật server" };
    const updated = await res.json();
    return { ok: true, invitation: updated, message: "Check-in thành công!" };
  }
}

export async function shirtCheckInByQr(
  id: string,
  token?: string,
): Promise<{ ok: boolean; invitation?: Invitation; message?: string }> {
  const inv = await findInvitationById(id);
  if (!inv) return { ok: false, message: "Không tìm thấy vé trong hệ thống" };
  if (inv.status !== "confirmed") {
    return {
      ok: false,
      message: `Vé chưa được duyệt phát hành (trạng thái: ${inv.status})`,
    };
  }
  if (inv.shirtReceived) {
    return {
      ok: false,
      invitation: inv,
      message: `Vé này đã được trao áo lúc ${new Date(inv.shirtReceivedAt || "").toLocaleTimeString("vi-VN")}`,
    };
  }
  
  const res = await fetch(`${API_URL}/api/invitations/${id}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify({ shirtReceived: true }),
  });
  if (!res.ok) return { ok: false, message: "Lỗi cập nhật server" };
  const updated = await res.json();
  return { ok: true, invitation: updated, message: "Đã trao áo thành công!" };
}

export async function submitQrScanAction(
  id: string,
  data: {
    doCheckIn?: boolean;
    attendeeName?: string;
    doShirt?: boolean;
    adminName?: string;
  },
  token?: string,
): Promise<{ ok: boolean; invitation?: Invitation; message: string }> {
  const inv = await findInvitationById(id);
  if (!inv) return { ok: false, message: "Không tìm thấy vé trong hệ thống" };

  let currentInv = inv;
  const messages: string[] = [];

  // 1. Process Check-in if requested
  if (data.doCheckIn) {
    const checkInRes = await checkInInvitation(id, {
      attendeeName: data.attendeeName,
      adminName: data.adminName,
      token,
    });
    if (!checkInRes.ok) {
      return { ok: false, invitation: currentInv, message: checkInRes.message || "Lỗi check-in" };
    }
    if (checkInRes.invitation) currentInv = checkInRes.invitation;
    messages.push(checkInRes.message || "Đã check-in");
  }

  // 2. Process Shirt if requested
  if (data.doShirt && !currentInv.shirtReceived) {
    const shirtRes = await shirtCheckInByQr(id, token);
    if (!shirtRes.ok) {
      return { ok: false, invitation: currentInv, message: shirtRes.message || "Lỗi trao áo" };
    }
    if (shirtRes.invitation) currentInv = shirtRes.invitation;
    messages.push(shirtRes.message || "Đã trao áo");
  }

  return {
    ok: true,
    invitation: currentInv,
    message: messages.length > 0 ? messages.join(" · ") : "Đã cập nhật vé thành công",
  };
}

export async function vietqrUrl(amount: number, content: string): Promise<string> {
  // Ideally, use FastAPI /api/invitations/{id}/vietqr if we have an ID
  // Otherwise just use standard vietqr dot io logic
  const bin = process.env.PAY_BANK_BIN || "970422";
  const acc = process.env.PAY_BANK_ACCOUNT || "123456789";
  return `https://img.vietqr.io/image/${bin}-${acc}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
}

export async function deleteInvitation(id: string, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/invitations/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return res.ok;
}

export async function checkDuplicateTransaction(transactionId: string): Promise<boolean> {
  // FastAPI might need an endpoint to check this. For now, assuming no duplication unless checked.
  return false;
}
