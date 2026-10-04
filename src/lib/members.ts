import { randomUUID } from "node:crypto";
import { UNIT_PRICE, type Size, type InvitationStatus } from "./invitation-view";
import { db } from "./firebase";

export { SIZES, UNIT_PRICE } from "./invitation-view";
export type { Size, InvitationStatus } from "./invitation-view";
export const MAX_GROUP_QUANTITY = 500;

export type InvitationType = "individual" | "group";

export type Member = {
  id: string;
  name: string;
  /** SĐT chuẩn hoá (bắt đầu 0) */
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
  shirtReceived?: boolean;
  shirtReceivedAt?: string | null;
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

export async function listMembers(): Promise<Member[]> {
  const snap = await db.collection("members").get();
  return snap.docs.map((doc) => doc.data() as Member);
}

export async function listInvitations(): Promise<Invitation[]> {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT) return [];
  const snap = await db.collection("invitations").get();
  return snap.docs.map((doc) => doc.data() as Invitation);
}

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) {
    digits = `0${digits.slice(2)}`;
  }
  if (!/^0\d{8,10}$/.test(digits)) return null;
  return digits;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len: number): string {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export async function findMemberByPhone(phone: string): Promise<Member | null> {
  const snap = await db.collection("members").where("phone", "==", phone).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data() as Member;
}

export async function createMember(
  name: string,
  phone: string,
  email: string,
): Promise<{ ok: true; member: Member } | { ok: false; message: string }> {
  const existing = await findMemberByPhone(phone);
  if (existing) {
    return {
      ok: false,
      message: "Số điện thoại này đã đăng ký tham gia. Vui lòng sử dụng mã định danh đã được cấp.",
    };
  }
  const member: Member = {
    id: randomUUID(),
    name,
    phone,
    email,
    createdAt: new Date().toISOString(),
  };
  await db.collection("members").doc(member.id).set(member);
  return { ok: true, member };
}

export async function getMemberById(id: string): Promise<Member | null> {
  const doc = await db.collection("members").doc(id).get();
  return doc.exists ? (doc.data() as Member) : null;
}

export async function findInvitationByCode(code: string): Promise<Invitation | null> {
  const normalized = code.trim().toUpperCase();
  const snap = await db.collection("invitations").where("code", "==", normalized).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data() as Invitation;
}

function generateInvitationCode(order: number): string {
  const orderStr = String(order).padStart(3, "0");
  return `NCT19862026-${orderStr}${randomCode(5)}`;
}

export async function createInvitation(
  memberId: string,
  input: InvitationInput,
): Promise<Invitation> {
  const invitationsSnap = await db.collection("invitations").get();
  const order = invitationsSnap.size + 1;
  let code = generateInvitationCode(order);
  
  while (invitationsSnap.docs.some((d) => (d.data() as Invitation).code === code)) {
    code = generateInvitationCode(order);
  }
  
  const now = new Date().toISOString();
  const invitation: Invitation =
    input.type === "individual"
      ? {
          id: randomUUID(),
          code,
          memberId,
          nienKhoa: input.nienKhoa,
          type: "individual",
          attendeeName: input.attendeeName,
          size: input.size,
          quantity: 1,
          sizes: input.size ? { [input.size]: 1 } : {},
          snacks: input.snacks,
          amount: input.snacks * UNIT_PRICE,
          status: input.snacks > 0 ? "pending_payment" : "confirmed",
          note: input.note,
          checkedIn: false,
          checkedInAt: null,
          createdAt: now,
          updatedAt: now,
        }
      : {
          id: randomUUID(),
          code,
          memberId,
          nienKhoa: input.nienKhoa,
          type: "group",
          attendeeName: "",
          size: null,
          quantity: input.quantity,
          sizes: input.sizes,
          snacks: input.snacks,
          amount: input.snacks * UNIT_PRICE,
          status: input.snacks > 0 ? "pending_payment" : "confirmed",
          note: input.note,
          checkedIn: false,
          checkedInAt: null,
          createdAt: now,
          updatedAt: now,
        };
        
  await db.collection("invitations").doc(invitation.id).set(invitation);
  return invitation;
}

export async function listInvitationsByMember(memberId: string): Promise<Invitation[]> {
  const snap = await db.collection("invitations").where("memberId", "==", memberId).get();
  const list = snap.docs.map((d) => d.data() as Invitation);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findInvitationById(id: string): Promise<Invitation | null> {
  const doc = await db.collection("invitations").doc(id).get();
  return doc.exists ? (doc.data() as Invitation) : null;
}

export async function setInvitationStatus(
  id: string,
  status: InvitationStatus,
): Promise<Invitation | null> {
  const docRef = db.collection("invitations").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  
  const now = new Date().toISOString();
  await docRef.update({ status, updatedAt: now });
  
  const updated = await docRef.get();
  return updated.data() as Invitation;
}

export async function setShirtReceived(
  id: string,
  shirtReceived: boolean,
): Promise<Invitation | null> {
  const docRef = db.collection("invitations").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  
  const now = new Date().toISOString();
  await docRef.update({ shirtReceived, shirtReceivedAt: now, updatedAt: now });
  
  const updated = await docRef.get();
  return updated.data() as Invitation;
}

export async function claimPayment(
  id: string,
  sessionId?: string,
): Promise<Invitation | null> {
  const docRef = db.collection("invitations").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  
  const current = doc.data() as Invitation;
  const now = new Date().toISOString();
  await docRef.update({
    status: "pending_approval",
    lastSessionId: sessionId || current.lastSessionId,
    paymentClaimedAt: now,
    updatedAt: now,
  });
  
  const updated = await docRef.get();
  return updated.data() as Invitation;
}

export async function updateInvitationReceipt(
  id: string,
  receiptUrl: string,
  ocrResult: OcrResult,
): Promise<Invitation | null> {
  const docRef = db.collection("invitations").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  
  const current = doc.data() as Invitation;
  const now = new Date().toISOString();
  
  const attempt: ReceiptAttempt = {
    url: receiptUrl,
    ocrResult,
    createdAt: now,
  };
  const newAttempts = [...(current.receiptAttempts || []), attempt];

  let newStatus = current.status;
  if (ocrResult.confidence === "high") {
    newStatus = "confirmed";
  } else if (
    ocrResult.confidence === "low" ||
    ocrResult.confidence === "system_error" ||
    newAttempts.length >= 3
  ) {
    newStatus = "pending_approval";
  }

  const updates: any = {
    receiptUrl,
    ocrResult,
    receiptAttempts: newAttempts,
    status: newStatus,
    updatedAt: now,
  };
  
  if (newStatus !== current.status) {
    updates.paymentClaimedAt = now;
  }
  
  await docRef.update(updates);
  
  const updated = await docRef.get();
  return updated.data() as Invitation;
}

export async function checkInInvitation(
  id: string,
): Promise<{ ok: boolean; invitation?: Invitation; message?: string }> {
  const docRef = db.collection("invitations").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return { ok: false, message: "Không tìm thấy vé trong hệ thống" };
  
  const t = doc.data() as Invitation;
  if (t.status !== "confirmed") {
    return {
      ok: false,
      message: `Vé chưa được duyệt phát hành (trạng thái: ${t.status})`,
    };
  }
  if (t.checkedIn) {
    return {
      ok: false,
      invitation: t,
      message: `Vé này đã được quét vào cổng lúc ${new Date(t.checkedInAt || "").toLocaleTimeString("vi-VN")}`,
    };
  }
  
  const now = new Date().toISOString();
  await docRef.update({
    checkedIn: true,
    checkedInAt: now,
    updatedAt: now,
  });
  
  const updated = await docRef.get();
  return { ok: true, invitation: updated.data() as Invitation };
}

export async function shirtCheckInByQr(
  id: string,
): Promise<{ ok: boolean; invitation?: Invitation; message?: string }> {
  const docRef = db.collection("invitations").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return { ok: false, message: "Không tìm thấy vé trong hệ thống" };
  
  const t = doc.data() as Invitation;
  if (t.status !== "confirmed") {
    return {
      ok: false,
      message: `Vé chưa được duyệt phát hành (trạng thái: ${t.status})`,
    };
  }
  if (t.shirtReceived) {
    return {
      ok: false,
      invitation: t,
      message: `Vé này đã được trao áo lúc ${new Date(t.shirtReceivedAt || "").toLocaleTimeString("vi-VN")}`,
    };
  }
  
  const now = new Date().toISOString();
  await docRef.update({
    shirtReceived: true,
    shirtReceivedAt: now,
    updatedAt: now,
  });
  
  const updated = await docRef.get();
  return { ok: true, invitation: updated.data() as Invitation };
}

export { vietqrUrl } from "./vietqr";

export async function deleteInvitation(id: string): Promise<boolean> {
  const docRef = db.collection("invitations").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  
  await docRef.delete();
  return true;
}

export async function checkDuplicateTransaction(transactionId: string): Promise<boolean> {
  if (!transactionId) return false;
  const snap = await db.collection("invitations")
    .where("ocrResult.transactionId", "==", transactionId)
    .where("status", "==", "confirmed")
    .limit(1)
    .get();
  return !snap.empty;
}
