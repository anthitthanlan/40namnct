"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/modal";
import {
  formatVnd,
  sizesLabel,
  invitationStatusInfo,
  SIZES,
  type InvitationView,
} from "@/lib/invitation-view";
import type { ActionLog } from "@/lib/action-logs";

type MemberRow = {
  id: string;
  name: string;
  phone: string;
  code: string;
  createdAt: string;
  invitationCount: number;
  peopleCount: number;
  confirmedAmount: number;
  pendingAmount: number;
};

type InvitationRow = InvitationView & {
  memberName: string;
  memberPhone: string;
  memberCode: string;
};

function vi(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

export default function AdminRegistrations({
  onAuthError,
}: {
  onAuthError?: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [invitations, setInvitations] = useState<InvitationRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending_approval" | "confirmed" | "pending_payment" | "rejected" | "checked_in" | "shirt_received"
  >("all");
  const [emailFilter, setEmailFilter] = useState<"all" | "sent" | "not_sent">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "individual" | "group">("all");
  const [multiTicketPhoneFilter, setMultiTicketPhoneFilter] = useState(false);
  const [mobileSubTab, setMobileSubTab] = useState<"overview" | "list">("overview");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [mainTab, setMainTab] = useState<"approve" | "sizes" | "transactions">("approve");
  const [editingInvitation, setEditingInvitation] = useState<InvitationRow | null>(null);
  const [rejectingInvitation, setRejectingInvitation] = useState<InvitationRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [inviIdInput, setInviIdInput] = useState("");
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [viewingLogsFor, setViewingLogsFor] = useState<InvitationRow | null>(null);
  const [entityLogs, setEntityLogs] = useState<ActionLog[]>([]);
  const [loadingEntityLogs, setLoadingEntityLogs] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [expandedOcrIds, setExpandedOcrIds] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleOcrExpand = (id: string) => {
    setExpandedOcrIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const flash = useCallback((ok: boolean, text: string) => {
    if (ok) {
      toast.success(text);
    } else {
      toast.error(text);
    }
  }, []);

  const [page, setPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/registrations", { cache: "no-store" });
    if (res.status === 401) {
      onAuthError?.();
      return;
    }
    const text = await res.text();
    if (!text) {
      console.error("Empty response from /api/admin/registrations");
      return;
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      return;
    }

    if (data.ok) {
      setMembers(data.members as MemberRow[]);
      setInvitations(data.invitations as InvitationRow[]);
      if (data.logs) setLogs(data.logs);
    }
  }, [onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!viewingLogsFor) {
      setEntityLogs([]);
      return;
    }
    let cancelled = false;
    setLoadingEntityLogs(true);
    fetch(`/api/admin/accounts/logs?entityId=${encodeURIComponent(viewingLogsFor.id)}`, { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) onAuthError?.();
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data && data.ok) {
          setEntityLogs(data.logs || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load entity logs:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingEntityLogs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewingLogsFor, onAuthError]);

  const duplicateInvitations = useMemo(() => {
    if (!rejectingInvitation) return [];
    const phone = rejectingInvitation.memberPhone?.trim();
    return (invitations || []).filter(
      (inv) =>
        inv.id !== rejectingInvitation.id &&
        Boolean(phone && inv.memberPhone?.trim() === phone)
    );
  }, [rejectingInvitation, invitations]);

  function openRejectModal(t: InvitationRow) {
    setRejectingInvitation(t);
    const match = t.note?.match(/\[Lý do từ chối: (.*?)\]/);
    const existingReason = match ? match[1].trim() : "";
    setRejectReason(existingReason);

    const phone = t.memberPhone?.trim();
    const other = (invitations || []).find(
      (inv) =>
        inv.id !== t.id &&
        ((phone && inv.memberPhone?.trim() === phone) ||
          (inv.memberId && inv.memberId === t.memberId))
    );
    setInviIdInput(other?.code || "");
  }

  function applyPreset1(overrideCode?: string) {
    const code = overrideCode || inviIdInput.trim() || "[invi_id]";
    setRejectReason(`Đã tồn tại mã thư mời ${code}. Vui lòng tra cứu để biết thêm thông tin chi tiết!`);
  }

  function applyPreset2() {
    setRejectReason("Đã hết thời gian đăng kí và thực hiện giao dịch đợt 1. Quý khách vui lòng thực hiện đăng kí mới ở đợt sau.");
  }

  function applyPreset3() {
    setRejectReason("Hệ thống tự động lọc ảo. Vui lòng thử đăng kí lại!");
  }

  function handleInviIdChange(newVal: string) {
    const val = newVal.trim().toUpperCase();
    setInviIdInput(val);
    if (rejectReason.includes("Đã tồn tại mã thư mời")) {
      setRejectReason(`Đã tồn tại mã thư mời ${val || "[invi_id]"}. Vui lòng tra cứu để biết thêm thông tin chi tiết!`);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingInvitation) return;
    const t = rejectingInvitation;
    const reason = rejectReason.trim();

    if (!reason) {
      if (!window.confirm("Bạn chưa nhập lý do từ chối. Vẫn tiếp tục từ chối thư mời này?")) return;
    }

    let finalNote = t.note || "";
    finalNote = finalNote.split(" | [Lý do từ chối:")[0].split("[Lý do từ chối:")[0].trim();

    if (reason) {
      finalNote += (finalNote ? " | " : "") + `[Lý do từ chối: ${reason}]`;
    }

    setBusy(true);
    try {
      const payload: any = {
        id: t.id,
        status: "rejected",
        rejectReason: finalNote,
      };

      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!data.ok) {
        flash(false, data.message || "Thao tác thất bại.");
        return;
      }
      flash(true, `Đã từ chối thư mời ${t.code}`);
      setRejectingInvitation(null);
      await load();
    } catch {
      flash(false, "Lỗi kết nối.");
    } finally {
      setBusy(false);
    }
  }

  async function act(
    t: InvitationRow,
    status: InvitationView["status"],
    okText: string,
  ) {
    let finalNote = t.note || "";
    if (status === "rejected") {
      openRejectModal(t);
      return;
    } else if (status === "confirmed") {
      finalNote = finalNote.split(" | [Lý do từ chối:")[0].trim();
    }

    setBusy(true);
    try {
      const payload: any = { id: t.id, status };
      if (status === "confirmed") {
        payload.rejectReason = finalNote;
      }

      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Thao tác thất bại.");
        return;
      }
      setInvitations((prev) =>
        prev
          ? prev.map((x) =>
            x.id === t.id ? { ...x, status: data.invitation.status, note: finalNote } : x,
          )
          : prev,
      );
      flash(true, okText);
    } finally {
      setBusy(false);
    }
  }

  async function toggleShirt(t: InvitationRow) {
    setBusy(true);
    const newStatus = !t.shirtReceived;
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, action: "update_shirt", shirtReceived: newStatus }),
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Lỗi cập nhật nhận áo.");
        return;
      }
      setInvitations((prev) =>
        prev
          ? prev.map((x) =>
            x.id === t.id ? { ...x, shirtReceived: data.invitation.shirtReceived } : x,
          )
          : prev,
      );
      flash(true, newStatus ? `Đã đánh dấu ${t.code} nhận áo.` : `Bỏ đánh dấu nhận áo ${t.code}.`);
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail(t: InvitationRow) {
    if (!window.confirm(`Xác nhận gửi thư mời về email của ${t.memberName}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/registrations/${t.id}`, {
        method: "POST",
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Gửi email thất bại.");
        return;
      }
      flash(true, `Đã gửi thư mời ${t.code} qua email.`);
      load();
    } finally {
      setBusy(false);
    }
  }

  function handleStatClick(status: typeof statusFilter) {
    setStatusFilter(status);
    setTypeFilter("all");
    setEmailFilter("all");
    setMobileSubTab("list");
  }

  async function handleExportExcel() {
    setExportingExcel(true);
    try {
      const res = await fetch("/api/admin/registrations/export-excel");
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      if (!res.ok) {
        flash(false, "Không thể xuất file Excel. Vui lòng thử lại sau.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      a.download = `Danh_sach_tham_du_NCT40_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      flash(true, "Đã tải xuống danh sách Excel thành công!");
    } catch (err) {
      flash(false, "Có lỗi xảy ra khi tải file Excel.");
    } finally {
      setExportingExcel(false);
    }
  }

  async function handleDeleteInvitation(t: InvitationRow) {
    if (!window.confirm(`Xoá thư mời "${t.code}" của ${t.memberName}? Thao tác không thể hoàn tác.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/registrations/${t.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Xóa thư mời thất bại.");
        return;
      }
      setInvitations((prev) => prev ? prev.filter((x) => x.id !== t.id) : prev);
      flash(true, "Đã xóa thư mời.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!editingInvitation) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/registrations/${editingInvitation.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendeeName: editingInvitation.attendeeName,
          nienKhoa: editingInvitation.nienKhoa,
          size: editingInvitation.size,
          sizes: editingInvitation.type === "group" ? editingInvitation.sizes : undefined,
          note: editingInvitation.note || "",
          memberEmail: editingInvitation.memberEmail,
          memberPhone: editingInvitation.memberPhone,
          attendees: editingInvitation.type === "group" ? editingInvitation.attendees : undefined,
        }),
      });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        flash(false, data.message || "Cập nhật thất bại.");
        return;
      }
      setInvitations((prev) =>
        prev ? prev.map((t) => (t.id === editingInvitation.id ? { 
          ...t, 
          attendeeName: editingInvitation.attendeeName, 
          memberName: editingInvitation.attendeeName,
          nienKhoa: editingInvitation.nienKhoa, 
          size: editingInvitation.size, 
          sizes: editingInvitation.sizes,
          note: editingInvitation.note || "",
          memberEmail: editingInvitation.memberEmail,
          memberPhone: editingInvitation.memberPhone || t.memberPhone,
          attendees: editingInvitation.attendees,
        } : t)) : prev
      );
      if (editingInvitation.memberPhone) {
        setMembers((prev) =>
          prev
            ? prev.map((m) =>
                m.id === editingInvitation.memberId
                  ? { ...m, phone: editingInvitation.memberPhone!, name: editingInvitation.attendeeName }
                  : m
              )
            : prev
        );
      }
      flash(true, "Đã cập nhật thông tin thành công.");
      setEditingInvitation(null);
    } catch (err) {
      flash(false, "Có lỗi xảy ra khi cập nhật.");
    } finally {
      setBusy(false);
    }
  }

  // =========================================================================
  // LƯU Ý QUAN TRỌNG VỀ REACT HOOKS:
  // useMemo BẮT BUỘC phải nằm TRƯỚC khối "đang tải" (early return) bên dưới.
  // Nếu đặt sau, lần render đầu (dữ liệu còn null) hook sẽ bị bỏ qua →
  // lỗi "change in the order of Hooks".
  // =========================================================================
  const q = query.trim().toUpperCase();

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, typeFilter, multiTicketPhoneFilter, emailFilter]);

  const filteredInvitations = useMemo(() => {
    const phoneCounts: Record<string, number> = {};
    if (multiTicketPhoneFilter && invitations) {
      for (const t of invitations) {
        if (t.memberPhone) {
          phoneCounts[t.memberPhone] = (phoneCounts[t.memberPhone] || 0) + 1;
        }
      }
    }

    const filtered = (invitations ?? []).filter((t) => {
      if (typeFilter === "individual" && t.type !== "individual") {
        return false;
      }
      if (typeFilter === "group" && t.type !== "group") {
        return false;
      }

      // Lọc theo tab trạng thái
      if (statusFilter === "pending_approval" && t.status !== "pending_approval") {
        return false;
      }
      if (statusFilter === "confirmed" && t.status !== "confirmed") {
        return false;
      }
      if (
        statusFilter === "pending_payment" &&
        t.status !== "pending_payment" &&
        (t.status as string) !== "pending"
      ) {
        return false;
      }
      if (statusFilter === "rejected" && t.status !== "rejected") {
        return false;
      }
      if (statusFilter === "checked_in" && !t.checkedIn) {
        return false;
      }
      if (statusFilter === "shirt_received" && !t.shirtReceived) {
        return false;
      }

      if (statusFilter === "confirmed" && emailFilter !== "all") {
        const emailCount =
          typeof t.emailSentCount === "number" && t.emailSentCount > 0
            ? t.emailSentCount
            : Boolean(t.emailSent) ||
              (logs || []).some(
                (l) =>
                  l.entityId === t.id &&
                  (l.action === "send_email" ||
                    l.details?.toLowerCase().includes("gửi email"))
              )
            ? 1
            : 0;
        const isSent = emailCount > 0;
        if (emailFilter === "sent" && !isSent) return false;
        if (emailFilter === "not_sent" && isSent) return false;
      }

      if (multiTicketPhoneFilter && t.memberPhone) {
        if ((phoneCounts[t.memberPhone] || 0) < 2) {
          return false;
        }
      }

      // Lọc theo từ khóa tìm kiếm
      if (!q) return true;
      return [
        t.code,
        t.memberCode,
        t.memberName,
        t.memberPhone,
        t.attendeeName,
        t.lastSessionId,
        t.note,
      ].some((s) => (s ?? "").toUpperCase().includes(q));
    });

    if (multiTicketPhoneFilter) {
      filtered.sort((a, b) => {
        const phoneA = a.memberPhone || "";
        const phoneB = b.memberPhone || "";
        if (phoneA < phoneB) return -1;
        if (phoneA > phoneB) return 1;
        // Nếu cùng SĐT, sort theo thời gian tạo để vé cũ nằm trên
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeA - timeB;
      });
    }

    return filtered;
  }, [invitations, statusFilter, typeFilter, q, multiTicketPhoneFilter, emailFilter, logs]);

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil((filteredInvitations?.length || 0) / PAGE_SIZE) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedInvitations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return (filteredInvitations || []).slice(start, start + PAGE_SIZE);
  }, [filteredInvitations, currentPage]);

  const handleJumpPage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPageInput("");
    } else {
      toast.error(`Vui lòng nhập số trang từ 1 đến ${totalPages}`);
    }
  };

  if (members === null || invitations === null) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-400">
        Đang tải dữ liệu đăng ký &amp; sao kê…
      </div>
    );
  }

  // =========================================================================
  // SAO KÊ TỰ ĐỘNG: CHỈ TÍNH TIỀN KHI VÉ ĐÃ THỰC SỰ ĐƯỢC DUYỆT PHÁT HÀNH
  // =========================================================================
  const confirmedInvitations = invitations.filter((t) => t.status === "confirmed");
  const totalConfirmedRevenue = confirmedInvitations.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0,
  );
  const totalConfirmedPeople = confirmedInvitations.reduce(
    (sum, t) => sum + (t.type === "group" ? (Number(t.quantity) || 1) : 1),
    0,
  );
  const pendingApprovalInvitations = invitations.filter(
    (t) => t.status === "pending_approval",
  );
  const totalCheckedIn = invitations.filter((t) => t.checkedIn).length;
  const totalShirtInvs = invitations.filter((t) => t.shirtReceived).length;
  const totalShirtsReceived = invitations.filter((t) => t.shirtReceived).reduce((sum, t) => sum + (Number(t.snacks) || 0), 0);

  return (
    <div className="mt-4 space-y-6 sm:mt-8 sm:space-y-10">

      {/* Main Tabs */}
      <div className="mb-6">
        <div className="sm:hidden relative z-50 mb-6">
          <div
            className="t-morph shadow-sm"
            data-open={isMenuOpen}
            style={{ "--morph-height-open": "148px" } as React.CSSProperties}
          >
            <div className="t-morph-menu">
              {[
                { id: "approve", label: "Quản lý Đăng ký" },
                { id: "sizes", label: "Thống kê Size áo" },
                { id: "transactions", label: "Thống kê Giao dịch" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMainTab(tab.id as typeof mainTab);
                    setIsMenuOpen(false);
                  }}
                  className={`flex-1 flex items-center px-4 text-left text-sm font-bold rounded-xl transition-colors ${mainTab === tab.id
                      ? "bg-slate-100 text-blue-600"
                      : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="t-morph-plus text-sm font-bold text-slate-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
            >
              <span>
                {mainTab === "approve"
                  ? "Quản lý Đăng ký"
                  : mainTab === "sizes"
                    ? "Thống kê Size áo"
                    : mainTab === "transactions"
                      ? "Thống kê Giao dịch"
                      : "Nhật ký Hệ thống"}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden sm:flex flex-wrap gap-2 border-b border-slate-100 pb-4 text-sm font-bold">
          {[
            { id: "approve", label: "Quản lý Đăng ký" },
            { id: "sizes", label: "Thống kê Size áo" },
            { id: "transactions", label: "Thống kê Giao dịch" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMainTab(tab.id as typeof mainTab)}
              className={`rounded-xl px-4 py-2.5 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${mainTab === tab.id
                  ? "bg-[#1d4ed8] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {mainTab === "approve" && (
        <>
          {/* Mobile Sub-Tabs (Overview / List) */}
          <div className="relative flex sm:hidden p-1 bg-slate-100 rounded-xl mb-6">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileSubTab === "overview" ? "translate-x-0" : "translate-x-full"
                }`}
            />
            <button
              type="button"
              onClick={() => setMobileSubTab("overview")}
              className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-300 ${mobileSubTab === "overview"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Tổng quát
            </button>
            <button
              type="button"
              onClick={() => setMobileSubTab("list")}
              className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-300 ${mobileSubTab === "list"
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Danh sách
            </button>
          </div>

          {/* ===================================================================
              1. BẢNG SAO KÊ TÀI CHÍNH TỰ ĐỘNG (CHỈ TÍNH VÉ ĐÃ DUYỆT)
              =================================================================== */}
          <section className={`sm:rounded-3xl sm:bg-white sm:p-8 ${mobileSubTab === "overview" ? "block anim-slide-left sm:anim-none" : "hidden sm:block"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>

                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Tổng quan
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Hệ thống tự động sao kê: chỉ ghi nhận số tiền khi thư mời đã được Ban
                  Tổ chức phê duyệt chính thức.
                </p>
              </div>

            </div>

            {/* 5 Khối thống kê KPI sao kê */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div onClick={() => handleStatClick("confirmed")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                  <span className="material-symbols-rounded inline-block align-middle text-[14px]">payments</span> Thực nhận (Đã duyệt)
                </span>
                <div className="mt-2">
                  <p className="text-xl font-black text-white sm:text-2xl">
                    {formatVnd(totalConfirmedRevenue)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-emerald-100">
                    Từ {confirmedInvitations.length} đơn hợp lệ
                  </p>
                </div>
              </div>

              <div onClick={() => handleStatClick("confirmed")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                  <span className="material-symbols-rounded inline-block align-middle text-[14px]">confirmation_number</span> Người dự duyệt
                </span>
                <div className="mt-2">
                  <p className="text-xl font-black text-white sm:text-2xl">
                    {totalConfirmedPeople} <span className="text-xs font-bold">suất</span>
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-blue-100">
                    Bao gồm cá nhân &amp; tập thể
                  </p>
                </div>
              </div>

              <div onClick={() => handleStatClick("pending_approval")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                  <span className="material-symbols-rounded inline-block align-middle text-[14px]">hourglass_empty</span> Chờ đối soát (48h)
                </span>
                <div className="mt-2">
                  <p className="text-xl font-black text-white sm:text-2xl">
                    {pendingApprovalInvitations.length} <span className="text-xs font-bold">thư mời</span>
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-amber-100">
                    Đã báo chuyển khoản
                  </p>
                </div>
              </div>

              <div onClick={() => handleStatClick("checked_in")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                  <span className="material-symbols-rounded inline-block align-middle text-[14px]">gps_fixed</span> Đã Check-in cổng
                </span>
                <div className="mt-2">
                  <p className="text-xl font-black text-white sm:text-2xl">
                    {totalCheckedIn} <span className="text-xs font-bold">thư mời</span>
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-purple-100">
                    Quét QR code thành công
                  </p>
                </div>
              </div>

              <div onClick={() => handleStatClick("shirt_received")} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                  <span className="material-symbols-rounded inline-block align-middle text-[14px]">checkroom</span> Đã trao áo / F&B
                </span>
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-xl font-black text-white sm:text-2xl">
                    {totalShirtsReceived} <span className="text-xs font-bold">áo đã trao</span>
                  </p>
                  <p className="text-[11px] font-bold text-pink-100">
                    Cho {totalShirtInvs} thư mời
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
          2. DANH SÁCH VÉ & PHÊ DUYỆT CẤP VÉ
          =================================================================== */}
          <section className={`mt-8 sm:mt-0 sm:rounded-3xl sm:bg-white sm:p-8 ${mobileSubTab === "list" ? "block anim-slide-right sm:anim-none" : "hidden sm:block"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Quản lý Đăng ký ({invitations.length})
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Hệ thống tự động duyệt nếu AI đọc đúng (Khớp hoàn toàn). Cần đối soát thủ công các thư mời cảnh báo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={exportingExcel}
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  title="Xuất file Excel cho tất cả các đơn đăng ký đã được duyệt"
                >
                  <span className={`material-symbols-rounded text-[18px] ${exportingExcel ? "animate-spin" : ""}`}>
                    {exportingExcel ? "progress_activity" : "table_view"}
                  </span>
                  <span>{exportingExcel ? "Đang xuất..." : "Xuất Excel (Đã duyệt)"}</span>
                </button>

                {/* Ô tìm kiếm */}
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo mã thư mời, Session ID, tên, SĐT…"
                  className="flex-1 sm:w-72 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Lọc danh sách (Button mở Modal) */}
            <div className="mt-5 border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setShowFilterModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="material-symbols-rounded text-[18px]">filter_list</span>
                Bộ lọc hiện tại: {
                  statusFilter === "all" ? "Tất cả" :
                    statusFilter === "pending_approval" ? "Chờ đối soát (48h)" :
                      statusFilter === "confirmed" ? "Đã duyệt" :
                        statusFilter === "pending_payment" ? "Chờ thanh toán" :
                          statusFilter === "checked_in" ? "Đã check-in" :
                            statusFilter === "shirt_received" ? "Đã nhận áo" :
                              statusFilter === "rejected" ? "Đã từ chối" : statusFilter
                }
                {statusFilter === "confirmed" && emailFilter !== "all" && ` - ${emailFilter === "sent" ? "Đã gửi mail" : "Chưa gửi mail"}`}
                {typeFilter !== "all" && ` - ${typeFilter === "individual" ? "Cá nhân" : "Tập thể"}`}
                {multiTicketPhoneFilter && ` - SĐT có ≥ 2 vé`}
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-700">
                  {filteredInvitations.length}
                </span>
              </button>
            </div>

            {/* Danh sách thẻ thư mời */}
            <div className="mt-6 space-y-4">
              {filteredInvitations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  Không có thư mời nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                <>
                  {paginatedInvitations.map((t) => {
                    const status = invitationStatusInfo(t.status);
                    const isGroup = t.type === "group";
                    const isConfirmed = t.status === "confirmed";

                    const receiptImages = Array.from(
                      new Set([
                        ...((t.receiptAttempts || [])
                          .map((a) => (typeof a === "string" ? a : a?.url))
                          .filter(Boolean)),
                        t.receiptUrl,
                      ].filter(Boolean))
                    ) as string[];

                    const hasReceipt = receiptImages.length > 0;
                    const isOcrAutoApproved =
                      isConfirmed &&
                      t.ocrResult?.confidence === "high";

                    const isOcrExpanded =
                      expandedOcrIds[t.id] !== undefined
                        ? expandedOcrIds[t.id]
                        : !isOcrAutoApproved;

                    return (
                      <div
                        key={t.id}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] shadow-2xs ${
                          t.status === "pending_approval"
                            ? "border-blue-300 bg-blue-50/40"
                            : isConfirmed
                              ? "border-emerald-200 bg-white"
                              : "border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        {/* Header: Mã vé, Badges & Số tiền */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-mono font-black text-slate-900 tracking-tight">
                              {t.code}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${status.cls}`}
                            >
                              {status.label}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 inline-flex items-center gap-1">
                              {isGroup ? (
                                <>
                                  <span className="material-symbols-rounded text-[13px]">group</span>
                                  Tập thể ({t.quantity} suất)
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-rounded text-[13px]">person</span>
                                  Cá nhân
                                </>
                              )}
                            </span>
                            {(() => {
                              const emailCount =
                                typeof t.emailSentCount === "number" && t.emailSentCount > 0
                                  ? t.emailSentCount
                                  : Boolean(t.emailSent) ||
                                    (logs || []).some(
                                      (l) =>
                                        l.entityId === t.id &&
                                        (l.action === "send_email" ||
                                          l.details?.toLowerCase().includes("gửi email"))
                                    )
                                  ? 1
                                  : 0;
                              if (emailCount <= 0) return null;
                              return (
                                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-extrabold text-indigo-700 inline-flex items-center gap-1">
                                  <span className="material-symbols-rounded text-[13px]">mail</span>
                                  Đã gửi mail ({emailCount})
                                </span>
                              );
                            })()}
                            {t.checkedIn && (
                              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700 inline-flex items-center gap-1">
                                <span className="material-symbols-rounded text-[13px]">gps_fixed</span>
                                Đã vào cổng
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-right">
                            {t.amount === 0 ? (
                              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-700 inline-flex items-center gap-1">
                                <span className="material-symbols-rounded text-[13px]">card_giftcard</span>
                                Miễn phí
                              </span>
                            ) : (
                              <span className="text-base font-black text-slate-900 tracking-tight">
                                {formatVnd(t.amount)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Thông tin người đăng ký */}
                        <div className="mt-3 grid gap-2.5 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-[13px]">
                                {t.attendeeName || t.memberName}
                              </span>
                              <span className="text-slate-500 font-medium">
                                ({t.memberPhone})
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                              {t.nienKhoa && (
                                <span className="inline-flex items-center gap-1">
                                  <span className="material-symbols-rounded text-[13px] text-slate-400">school</span>
                                  Niên khóa: <strong className="text-slate-700">{t.nienKhoa}</strong>
                                </span>
                              )}
                              {t.memberEmail && (
                                <span className="inline-flex items-center gap-1 break-all text-slate-600" title={t.memberEmail}>
                                  <span className="material-symbols-rounded text-[13px] text-slate-400 shrink-0">alternate_email</span>
                                  <span>{t.memberEmail}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[11px]">
                              <span className="material-symbols-rounded text-[15px] text-indigo-600">checkroom</span>
                              <span className="font-bold text-slate-800">{t.snacks} suất</span>
                              <span className="text-slate-500">({sizesLabel(t.type, t.size, t.sizes) || "-"})</span>
                            </div>
                            {t.lastSessionId && (
                              <p className="mt-1 font-mono text-[11px] text-indigo-600 font-bold truncate" title={t.lastSessionId}>
                                Session CK: {t.lastSessionId}
                              </p>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <span className="material-symbols-rounded text-[13px] text-slate-400">schedule</span>
                              <span>Ngày tạo: {vi(t.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ghi chú & Lời nhắn đầy đủ (không bị che lấp / cắt bớt) */}
                        {t.note && (
                          <div className="mt-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 px-3 py-2 text-xs text-amber-950 flex items-start gap-2">
                            <span className="material-symbols-rounded text-amber-600 text-[16px] shrink-0 mt-0.5">sticky_note_2</span>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-[11px] uppercase tracking-wider text-amber-800 block mb-0.5">Ghi chú / Lời nhắn:</span>
                              <p className="text-[11px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed font-medium">
                                {t.note}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Danh sách thành viên dự kiến (đối với vé tập thể) */}
                        {isGroup && Array.isArray(t.attendees) && t.attendees.length > 0 && (
                          <div className="mt-3 rounded-xl bg-indigo-50/60 border border-indigo-200/70 p-3 text-xs">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-extrabold text-[11px] uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-[15px] text-indigo-600">groups</span>
                                Danh sách đoàn dự kiến ({t.attendees.length} thành viên):
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                              {t.attendees.map((att, idx) => {
                                const isCheckedIn = (t.checkinEntries || []).some(
                                  (e) => e.name.trim().toLowerCase() === att.name.trim().toLowerCase()
                                );
                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] ${
                                      isCheckedIn
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold"
                                        : "bg-white border-indigo-100/80 text-slate-800 font-medium"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="text-[10px] text-slate-400 font-mono">{idx + 1}.</span>
                                      <span className="truncate">{att.name}</span>
                                      {att.isLeader && (
                                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-indigo-200/80 text-indigo-800 font-bold shrink-0">
                                          Trưởng đoàn
                                        </span>
                                      )}
                                    </div>
                                    {isCheckedIn && (
                                      <span className="material-symbols-rounded text-emerald-600 text-sm shrink-0" title="Đã check-in vào cổng">
                                        check_circle
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Lịch sử Check-in (hiển thị danh sách tên người tham dự đã check-in) */}
                        {Array.isArray(t.checkinEntries) && t.checkinEntries.length > 0 && (
                          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-[15px] text-emerald-600">how_to_reg</span>
                                Danh sách check-in ({t.checkinEntries.length}{isGroup ? ` / ${t.quantity} suất` : ""}):
                              </span>
                            </div>
                            <div className="space-y-1">
                              {t.checkinEntries.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                                  <span className="font-bold text-slate-800">
                                    {idx + 1}. {entry.name || t.attendeeName}
                                  </span>
                                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                                    {entry.by && <span className="text-slate-500 font-medium">Bởi: {entry.by}</span>}
                                    <span>{vi(entry.time)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ảnh biên lai & Kết quả OCR (Thu gọn thông minh) */}
                        {hasReceipt && (
                          <div className="mt-3 border-t border-slate-100 pt-3">
                            {!isOcrExpanded ? (
                              /* Dòng OCR tóm tắt thông minh khi thu gọn */
                              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/90 border border-slate-200/80 px-3 py-2 text-xs">
                                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                  {receiptImages[0] && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setLightboxImage(receiptImages[0]);
                                      }}
                                      className="group relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs hover:ring-2 hover:ring-blue-500"
                                      title="Bấm để xem ảnh biên lai"
                                    >
                                      <img
                                        src={receiptImages[0]}
                                        alt="Biên lai"
                                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center">
                                        <span className="material-symbols-rounded text-[12px] text-white opacity-0 group-hover:opacity-100">zoom_in</span>
                                      </div>
                                    </button>
                                  )}

                                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                    <span
                                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                        t.ocrResult?.confidence === "high"
                                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                          : t.ocrResult?.confidence === "low"
                                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                                            : "bg-rose-100 text-rose-700 border border-rose-200"
                                      }`}
                                    >
                                      {t.ocrResult?.confidence === "high"
                                        ? "AI khớp hoàn toàn"
                                        : t.ocrResult?.confidence === "low"
                                          ? "Khớp 1 phần"
                                          : "Không khớp"}
                                    </span>

                                    {t.ocrResult?.amount != null && (
                                      <span className="font-mono font-bold text-slate-800">
                                        {formatVnd(t.ocrResult.amount)}
                                      </span>
                                    )}



                                    {(t.ocrResult as any)?.transactionId && (
                                      <span className="text-slate-500 hidden sm:inline">
                                        • Mã GD:{" "}
                                        <strong className="font-mono text-slate-700">
                                          {(t.ocrResult as any).transactionId}
                                        </strong>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleOcrExpand(t.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors shrink-0 ml-auto"
                                >
                                  <span>Chi tiết OCR</span>
                                  <span className="material-symbols-rounded text-[16px]">expand_more</span>
                                </button>
                              </div>
                            ) : (
                              /* Chi tiết đầy đủ khi bung ra */
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700 uppercase tracking-wide text-xs">
                                      Trạng thái AI OCR:
                                    </span>
                                    <span
                                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                        t.ocrResult?.confidence === "high"
                                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                          : t.ocrResult?.confidence === "low"
                                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                                            : "bg-rose-100 text-rose-700 border border-rose-200"
                                      }`}
                                    >
                                      {t.ocrResult?.confidence === "high"
                                        ? "Khớp hoàn toàn"
                                        : t.ocrResult?.confidence === "low"
                                          ? "Khớp 1 phần (Cần xem lại)"
                                          : "Không khớp"}
                                    </span>
                                  </div>

                                  {isOcrAutoApproved && (
                                    <button
                                      type="button"
                                      onClick={() => toggleOcrExpand(t.id)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                      <span>Thu gọn</span>
                                      <span className="material-symbols-rounded text-[16px]">expand_less</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                  {/* Thumbnail ảnh */}
                                  <div className="flex flex-wrap gap-2.5">
                                    {receiptImages.map((imgUrl, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setLightboxImage(imgUrl);
                                        }}
                                        className="shrink-0 group relative block h-24 w-16 sm:h-28 sm:w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Bấm để xem ảnh lớn"
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Biên lai ${i + 1}`}
                                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 flex items-center justify-center">
                                          <span className="material-symbols-rounded text-white opacity-0 group-hover:opacity-100 text-lg drop-shadow-md">search</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>

                                  {/* Chi tiết các ô OCR */}
                                  <div className="flex-1 space-y-2 text-xs">
                                    {t.ocrResult ? (
                                      <>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                          <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                                            <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Số tiền đọc được</span>
                                            <span className={`font-mono font-bold ${t.ocrResult.amount === t.amount ? "text-emerald-600" : "text-rose-600"}`}>
                                              {t.ocrResult.amount != null ? formatVnd(t.ocrResult.amount) : "Không đọc được"}
                                            </span>
                                          </p>
                                          <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                                            <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Thời gian CK</span>
                                            <span className="font-mono text-slate-700 font-semibold">{t.ocrResult.time || "Không rõ"}</span>
                                          </p>
                                          <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100 sm:col-span-2">
                                            <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Nội dung CK</span>
                                            <span className="font-mono text-slate-800 break-all font-semibold">
                                              {t.ocrResult.content || "Không đọc được"}
                                            </span>
                                          </p>
                                          {(t.ocrResult as any).transactionId && (
                                            <p className="rounded-md bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                                              <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Mã GD / Số tham chiếu</span>
                                              <span className="font-mono text-slate-800 font-bold">{(t.ocrResult as any).transactionId}</span>
                                            </p>
                                          )}

                                        </div>
                                        {t.ocrResult.note && (
                                          <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                                            {t.ocrResult.note}
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      <div className="flex h-full items-center text-slate-400 italic">
                                        Biên lai chưa được phân tích OCR
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Thanh nút hành động tinh gọn & Menu Thao tác khác */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <span className="text-[11px] font-medium text-slate-500 inline-flex items-center gap-1.5">
                            {isConfirmed ? (
                              t.ocrResult?.confidence === "high" ? (
                                <>
                                  <span className="material-symbols-rounded text-emerald-600 text-[15px]">check_circle</span>
                                  AI đã phê duyệt tự động. Thư mời đã vào sao kê.
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-rounded text-emerald-600 text-[15px]">verified</span>
                                  Thư mời đã được admin duyệt thủ công.
                                </>
                              )
                            ) : t.status === "pending_approval" ? (
                              <>
                                <span className="material-symbols-rounded text-amber-500 text-[15px]">warning</span>
                                Chờ duyệt thủ công do AI phát hiện rủi ro (lệch tiền/nội dung).
                              </>
                            ) : t.receiptAttempts?.length ? (
                              <>
                                <span className="material-symbols-rounded text-rose-500 text-[15px]">error</span>
                                AI báo lỗi, đang chờ thành viên thử tải lại biên lai.
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-rounded text-slate-400 text-[15px]">schedule</span>
                                Đang chờ thành viên thực hiện chuyển khoản.
                              </>
                            )}
                          </span>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Nút hành động chính khi CHƯA DUYỆT */}
                            {!isConfirmed && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  act(
                                    t,
                                    "confirmed",
                                    `Đã duyệt & phát hành thư mời ${t.code}`
                                  )
                                }
                                className="rounded-xl bg-[#16a34a] px-4 py-2 text-xs font-black text-white shadow-2xs hover:bg-emerald-700 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-rounded text-[16px]">check_circle</span>
                                Duyệt &amp; Cấp vé
                              </button>
                            )}

                            {t.status !== "rejected" && !isConfirmed && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => openRejectModal(t)}
                                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] disabled:opacity-50 flex items-center gap-1"
                              >
                                <span className="material-symbols-rounded text-[15px] text-rose-500">cancel</span>
                                Từ chối
                              </button>
                            )}

                            {t.status === "rejected" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => openRejectModal(t)}
                                className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] disabled:opacity-50 flex items-center gap-1"
                              >
                                <span className="material-symbols-rounded text-[15px]">edit_note</span>
                                Sửa lý do từ chối
                              </button>
                            )}

                            {/* Nút hành động chính khi ĐÃ DUYỆT */}
                            {isConfirmed && (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => toggleShirt(t)}
                                  className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1.5 ${
                                    t.shirtReceived
                                      ? "bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80"
                                  }`}
                                  title="Đánh dấu trạng thái nhận áo"
                                >
                                  <span className="material-symbols-rounded text-[14px]">
                                    {t.shirtReceived ? "check_box" : "check_box_outline_blank"}
                                  </span>
                                  {t.shirtReceived ? "Đã trao áo" : "Chưa trao áo"}
                                </button>

                                <a
                                  href={`/thu-moi?id=${t.id}`}
                                  target="_blank"
                                  className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1"
                                >
                                  <span className="material-symbols-rounded text-[14px]">visibility</span>
                                  Thẻ thư mời
                                </a>

                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => sendEmail(t)}
                                  className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-1.5 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] inline-flex items-center gap-1"
                                >
                                  <span className="material-symbols-rounded text-[14px]">mail</span>
                                  {(t.emailSentCount ?? 0) > 0 || Boolean(t.emailSent) ? "Gửi lại Mail" : "Gửi Mail"}
                                </button>
                              </>
                            )}

                            {/* Menu Thao tác khác (Dropdown `···`) */}
                            <div className="relative" data-action-menu>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === t.id ? null : t.id);
                                }}
                                className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-2xs ${
                                  activeMenuId === t.id
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                                title="Thao tác khác"
                              >
                                <span className="material-symbols-rounded text-[16px]">more_horiz</span>
                                <span className="hidden sm:inline">Khác</span>
                              </button>

                              {activeMenuId === t.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 bottom-full mb-1.5 z-30 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-xl text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <div className="py-1">
                                    {isConfirmed && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          const domain =
                                            typeof window !== "undefined"
                                              ? window.location.origin
                                              : "https://40namnctru.nctitc.io.vn";
                                          const link = `${domain}/thu-moi?id=${t.id}`;
                                          const name = t.attendeeName || t.memberName || "";
                                          const amountStr = new Intl.NumberFormat("vi-VN").format(t.amount || 0);
                                          const typeStr = t.type === "group" ? "Tập thể" : "Cá nhân";

                                          const msg = `Kính gửi Cựu học sinh ${name},\n\nNhằm ôn lại truyền thống 40 năm xây dựng và phát triển, tri ân các thế hệ Thầy Cô và tạo dịp hội ngộ, kết nối các thế hệ, Trường THPT Nguyễn Công Trứ trân trọng kính mời bạn về tham dự Ngày hội truyền thống 40 năm của Nhà trường.\n\nBan Tổ chức xin chân thành cảm ơn bạn đã đóng góp ${amountStr}đ để góp phần tạo nên một ngày hội thật ý nghĩa.\n* Lưu ý: Khoản đóng góp tham dự là 500.000đ/người. Toàn bộ kinh phí sẽ được sử dụng cho công tác tổ chức sự kiện (nếu có dư sẽ được đưa vào Quỹ Khuyến học của Trường).\n\nRất mong được đón tiếp bạn trở lại dưới mái trường xưa vào ngày 08/11/2026!\n\nVé điện tử của bạn được cung cấp tại liên kết dưới đây. Vui lòng mở ra, lưu lại hình ảnh vé và xuất trình mã QR khi check-in.\n\nHoặc mở liên kết:\n🔗 ${link}\n\n✓ Chi tiết đăng ký\nLoại đăng ký: ${typeStr}\nThành tiền: ${amountStr}đ`;

                                          navigator.clipboard.writeText(msg).then(() => {
                                            toast.success("Đã sao chép nội dung thư mời!");
                                          });
                                        }}
                                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                      >
                                        <span className="material-symbols-rounded text-[16px] text-sky-600">content_copy</span>
                                        Sao chép thư mời
                                      </button>
                                    )}

                                    {!isConfirmed && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          const domain =
                                            typeof window !== "undefined"
                                              ? window.location.origin
                                              : "https://nctitc.io.vn";
                                          const link = `${domain}/xac-nhan-dong-gop?id=${t.id}`;
                                          const msg = `Xin chào, BTC xin gửi lại link xác nhận đóng góp cho cựu học sinh ${t.attendeeName || t.memberName}. Lưu ý: BTC không yêu cầu bạn chuyển khoản lại hay đưa ra thông báo hoàn trả.\n\nLink: ${link}`;
                                          navigator.clipboard.writeText(msg).then(() => {
                                            toast.success("Đã sao chép tin nhắn nhắc nhở!");
                                          });
                                        }}
                                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                      >
                                        <span className="material-symbols-rounded text-[16px] text-blue-600">content_copy</span>
                                        Copy tin nhắn nhắc nhở
                                      </button>
                                    )}

                                    {t.receiptUrl && (
                                      <a
                                        href={t.receiptUrl}
                                        target="_blank"
                                        download
                                        onClick={() => setActiveMenuId(null)}
                                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                      >
                                        <span className="material-symbols-rounded text-[16px] text-slate-500">download</span>
                                        Tải ảnh biên lai
                                      </a>
                                    )}

                                    {(t.status === "pending_payment" || t.status === "pending") && (
                                      <a
                                        href={`/xac-nhan-dong-gop?id=${t.id}`}
                                        target="_blank"
                                        onClick={() => setActiveMenuId(null)}
                                        className="w-full text-left px-3.5 py-1.5 hover:bg-amber-50 flex items-center gap-2 text-amber-700 font-medium"
                                      >
                                        <span className="material-symbols-rounded text-[16px]">payments</span>
                                        Mở trang thanh toán
                                      </a>
                                    )}
                                  </div>

                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setEditingInvitation({
                                          ...t,
                                          note: t.note || "",
                                        });
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                    >
                                      <span className="material-symbols-rounded text-[16px] text-indigo-600">edit</span>
                                      Sửa thông tin
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setViewingLogsFor(t);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                                    >
                                      <span className="material-symbols-rounded text-[16px] text-orange-500">history</span>
                                      Xem lịch sử
                                    </button>

                                    {isConfirmed && (
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          act(
                                            t,
                                            "pending_approval",
                                            `Đã hoàn tác duyệt thư mời ${t.code}`
                                          );
                                        }}
                                        className="w-full text-left px-3.5 py-1.5 hover:bg-amber-50 flex items-center gap-2 text-amber-700 font-medium"
                                      >
                                        <span className="material-symbols-rounded text-[16px]">undo</span>
                                        Hoàn tác duyệt
                                      </button>
                                    )}
                                  </div>

                                  <div className="py-1">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleDeleteInvitation(t);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium"
                                    >
                                      <span className="material-symbols-rounded text-[16px]">delete</span>
                                      Xóa thư mời
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Toolbar */}
                  {filteredInvitations.length > 0 && (
                    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="text-xs text-slate-500 font-medium text-center md:text-left">
                        Hiển thị <strong className="text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</strong> - <strong className="text-slate-800">{Math.min(currentPage * PAGE_SIZE, filteredInvitations.length)}</strong> trong <strong className="text-slate-800">{filteredInvitations.length}</strong> thư mời (Trang {currentPage}/{totalPages})
                      </div>

                      {/* Center: Prev/Next & Page numbers */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setPage(1)}
                          title="Trang đầu"
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition-colors"
                        >
                          «
                        </button>
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          title="Trang trước"
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold gap-1 transition-colors"
                        >
                          <span className="material-symbols-rounded text-[14px]">chevron_left</span>
                          <span>Trước</span>
                        </button>

                        {/* Page numbers */}
                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                            .map((p, idx, arr) => {
                              const prev = arr[idx - 1];
                              const showEllipsis = prev && p - prev > 1;
                              return (
                                <span key={p} className="flex items-center">
                                  {showEllipsis && <span className="px-1 text-slate-400 text-xs font-bold">…</span>}
                                  <button
                                    type="button"
                                    onClick={() => setPage(p)}
                                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                                      p === currentPage
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                </span>
                              );
                            })}
                        </div>

                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          title="Trang sau"
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold gap-1 transition-colors"
                        >
                          <span>Sau</span>
                          <span className="material-symbols-rounded text-[14px]">chevron_right</span>
                        </button>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => setPage(totalPages)}
                          title="Trang cuối"
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition-colors"
                        >
                          »
                        </button>
                      </div>

                      {/* Right: Quick jump to page */}
                      <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 font-medium">Đến trang:</span>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          value={jumpPageInput}
                          onChange={(e) => setJumpPageInput(e.target.value)}
                          placeholder={currentPage.toString()}
                          className="w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 font-bold text-xs transition-colors"
                        >
                          Đi tới
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>


        </>
      )}

      {mainTab === "sizes" && (
        <section className="mt-8 sm:mt-0 sm:rounded-3xl sm:bg-white sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-900">Thống kê Size Áo Đăng ký</h2>
          <p className="mt-2 text-sm text-slate-500">Thống kê chi tiết các size áo đã được đăng ký (chỉ tính thư mời đã duyệt).</p>
          <div className="mt-6">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Số lượng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {Object.entries(
                  confirmedInvitations.reduce((acc, t) => {
                    if (t.type === "individual" && t.size) {
                      acc[t.size] = (acc[t.size] || 0) + 1;
                    } else if (t.type === "group" && t.sizes && typeof t.sizes === "object") {
                      Object.entries(t.sizes).forEach(([size, qty]) => {
                        const count = Number(qty) || 0;
                        if (count > 0) {
                          acc[size] = (acc[size] || 0) + count;
                        }
                      });
                    }
                    return acc;
                  }, {} as Record<string, number>)
                ).sort((a, b) => {
                  const order: Record<string, number> = { S: 1, M: 2, L: 3, XL: 4, "2XL": 5, "3XL": 6 };
                  return (order[a[0]] || 99) - (order[b[0]] || 99);
                }).map(([size, count]) => (
                  <tr key={size}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{count} áo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mainTab === "transactions" && (
        <section className="mt-8 sm:mt-0 sm:rounded-3xl sm:bg-white sm:p-8">
          <h2 className="text-xl font-extrabold text-slate-900">Thống kê Giao dịch</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Tổng thu dự kiến</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatVnd(invitations.reduce((sum, t) => sum + (t.status !== "rejected" && t.status !== "cancelled" ? (Number(t.amount) || 0) : 0), 0))}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã thu (Khớp OCR/Duyệt tay)</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{formatVnd(totalConfirmedRevenue)}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Chờ duyệt</p>
              <p className="mt-2 text-2xl font-black text-amber-800">
                {formatVnd(invitations.filter(t => t.status === "pending" || t.status === "pending_payment").reduce((sum, t) => sum + (Number(t.amount) || 0), 0))}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        size="md"
        title="Bộ lọc danh sách"
        footer={
          <button
            type="button"
            onClick={() => setShowFilterModal(false)}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.99]"
          >
            Hiển thị {filteredInvitations.length} kết quả
          </button>
        }
        bodyClassName="space-y-6 max-h-[60vh]"
      >
        {/* Nhóm 1: Loại đăng ký */}
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Loại đăng ký
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "individual", label: "Cá nhân" },
              { id: "group", label: "Tập thể" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as typeof typeFilter)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  typeFilter === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nhóm 2: Trạng thái */}
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Trạng thái đăng ký
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "pending_approval", label: "Chờ đối soát (48h)" },
              { id: "confirmed", label: "Đã duyệt" },
              { id: "pending_payment", label: "Chờ thanh toán" },
              { id: "checked_in", label: "Đã check-in" },
              { id: "shirt_received", label: "Đã nhận áo" },
              { id: "rejected", label: "Đã từ chối" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id as typeof statusFilter);
                  if (tab.id !== "confirmed") setEmailFilter("all");
                }}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nhóm Email (Chỉ khi chọn Đã duyệt) */}
        <div
          className={`transition-opacity duration-300 ${
            statusFilter !== "confirmed" ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Trạng thái Email {statusFilter !== "confirmed" && "(Chỉ áp dụng khi chọn Đã duyệt)"}
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "sent", label: "Đã gửi mail" },
              { id: "not_sent", label: "Chưa gửi mail" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEmailFilter(tab.id as typeof emailFilter)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  emailFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nhóm 3: Khác */}
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Bộ lọc khác
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMultiTicketPhoneFilter(!multiTicketPhoneFilter)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
                multiTicketPhoneFilter
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="material-symbols-rounded text-[18px]">
                {multiTicketPhoneFilter ? "check_box" : "check_box_outline_blank"}
              </span>
              SĐT có từ 2 vé đăng ký trở lên
            </button>
          </div>
        </div>
      </Modal>

      {/* Action Logs Modal */}
      <Modal
        isOpen={!!viewingLogsFor}
        onClose={() => setViewingLogsFor(null)}
        size="lg"
        title={viewingLogsFor ? `Lịch sử: ${viewingLogsFor.code}` : "Lịch sử thao tác"}
        subtitle={viewingLogsFor ? viewingLogsFor.attendeeName || viewingLogsFor.memberName : undefined}
        icon="history"
        bodyClassName="p-5 max-h-[70vh] flex flex-col"
      >
        {viewingLogsFor && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="font-semibold text-slate-500">
                Toàn bộ lịch sử can thiệp & tương tác
              </span>
              <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                {loadingEntityLogs ? "Đang tải..." : `${entityLogs.length} thao tác`}
              </span>
            </div>

            {loadingEntityLogs ? (
              <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center gap-2">
                <span className="material-symbols-rounded animate-spin text-2xl text-blue-600">
                  progress_activity
                </span>
                <span>Đang tải lịch sử thao tác từ máy chủ...</span>
              </div>
            ) : entityLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm italic">
                Chưa có lịch sử thao tác nào cho thư mời này.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                {entityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl p-4 border border-slate-100"
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div>
                        <span className="font-bold text-sm text-slate-900">
                          {log.adminName || "Quản trị viên"}
                        </span>
                        {log.adminUsername && (
                          <span className="text-xs text-slate-500 ml-1.5 font-mono">
                            (@{log.adminUsername})
                          </span>
                        )}
                        {log.adminRole && (
                          <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-700">
                            {log.adminRole}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed break-words font-medium">
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Registration Modal */}
      <Modal
        isOpen={!!editingInvitation}
        onClose={() => setEditingInvitation(null)}
        size="lg"
        title="Chi tiết / Sửa Đăng Ký"
        subtitle={editingInvitation?.code}
        icon="edit_note"
        bodyClassName="p-0"
      >
        {editingInvitation && (
          <form onSubmit={handleUpdateInvitation}>
            <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4 text-left">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Mã đăng ký
                </label>
                <input
                  type="text"
                  disabled
                  value={editingInvitation.code}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={editingInvitation.attendeeName || editingInvitation.memberName || ""}
                  onChange={(e) =>
                    setEditingInvitation({
                      ...editingInvitation,
                      attendeeName: e.target.value,
                      memberName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Niên khóa
                </label>
                <input
                  type="text"
                  value={editingInvitation.nienKhoa || ""}
                  onChange={(e) =>
                    setEditingInvitation({ ...editingInvitation, nienKhoa: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editingInvitation.memberPhone || ""}
                    onChange={(e) =>
                      setEditingInvitation({ ...editingInvitation, memberPhone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-mono"
                    placeholder="0912345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingInvitation.memberEmail || ""}
                    onChange={(e) =>
                      setEditingInvitation({ ...editingInvitation, memberEmail: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="example@gmail.com"
                  />
                </div>
              </div>
              {editingInvitation.type === "individual" && (() => {
                const parts = (editingInvitation.size || "Nam-M").split("-");
                const gender = parts.length === 2 ? parts[0] : "Nam";
                const sizeVal = parts.length === 2 ? parts[1] : (editingInvitation.size || "M");
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Giới tính
                      </label>
                      <select
                        value={gender}
                        onChange={(e) =>
                          setEditingInvitation({
                            ...editingInvitation,
                            size: `${e.target.value}-${sizeVal}`,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Size áo
                      </label>
                      <select
                        value={sizeVal}
                        onChange={(e) =>
                          setEditingInvitation({
                            ...editingInvitation,
                            size: `${gender}-${e.target.value}`,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                      >
                        {["S", "M", "L", "XL", "XXL", "NC1", "NC2", "NC3"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })()}
              {editingInvitation.type === "group" && (() => {
                const requiredQty = editingInvitation.quantity || 1;
                const currentSizes = editingInvitation.sizes || {};
                const currentTotal = Object.values(currentSizes).reduce(
                  (sum, count) => sum + (Math.max(0, Number(count) || 0)),
                  0
                );
                const isMatch = currentTotal === requiredQty;
                const diff = currentTotal - requiredQty;

                const updateCount = (key: string, delta: number) => {
                  const oldVal = Number(currentSizes[key]) || 0;
                  const newVal = Math.max(0, oldVal + delta);
                  const nextSizes = { ...currentSizes, [key]: newVal };
                  if (newVal === 0) {
                    delete nextSizes[key];
                  }
                  setEditingInvitation({
                    ...editingInvitation,
                    sizes: nextSizes,
                  });
                };

                const setCount = (key: string, val: number) => {
                  const newVal = Math.max(0, val);
                  const nextSizes = { ...currentSizes, [key]: newVal };
                  if (newVal === 0) {
                    delete nextSizes[key];
                  }
                  setEditingInvitation({
                    ...editingInvitation,
                    sizes: nextSizes,
                  });
                };

                return (
                  <div>
                    {/* Tiêu đề & Trạng thái khớp số lượng */}
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                      <label className="block text-sm font-bold text-slate-700">
                        Phân bổ Size áo
                      </label>
                      <span
                        className={`text-sm font-bold ${
                          isMatch ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        Đã chọn: {currentTotal} / {requiredQty}
                      </span>
                    </div>

                    {!isMatch && (
                      <p className="text-xs text-amber-600 font-semibold mb-3">
                        ⚠ Tổng số áo ({currentTotal}) chưa khớp với số lượng đăng ký ({requiredQty} áo). Chênh lệch: {diff > 0 ? `+${diff}` : diff} áo.
                      </p>
                    )}

                    {/* Danh sách phân bổ theo Áo Nam & Áo Nữ giống hệt trang Đăng ký */}
                    <div className="space-y-4">
                      {([
                        {
                          g: "Nam",
                          title: "Áo Nam",
                          color: "text-blue-700",
                          bar: "bg-blue-50 border-blue-100",
                        },
                        {
                          g: "Nữ",
                          title: "Áo Nữ",
                          color: "text-pink-700",
                          bar: "bg-pink-50 border-pink-100",
                        },
                      ] as const).map(({ g, title, color, bar }) => {
                        const groupTotal = SIZES.reduce(
                          (sum, s) => sum + (Number(currentSizes[`${g}-${s}`]) || 0),
                          0
                        );
                        return (
                          <div key={g}>
                            <div
                              className={`flex items-center justify-between rounded-lg border px-3 py-2 mb-2 ${bar}`}
                            >
                              <span className={`text-sm font-bold ${color}`}>
                                {title}
                              </span>
                              <span className={`text-xs font-semibold ${color}`}>
                                {groupTotal} áo
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              {SIZES.map((s) => {
                                const key = `${g}-${s}`;
                                const val = Number(currentSizes[key]) || 0;
                                return (
                                  <div
                                    key={key}
                                    className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs"
                                  >
                                    <span className="font-medium text-gray-700 w-8 shrink-0 text-sm">
                                      {s}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={val === 0}
                                        onClick={() => updateCount(key, -1)}
                                        className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded text-gray-600 hover:bg-gray-100 border border-gray-200 shrink-0 text-sm font-bold disabled:opacity-30 disabled:hover:bg-gray-50"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min={0}
                                        value={val}
                                        onWheel={(e) =>
                                          (e.target as HTMLElement).blur()
                                        }
                                        onChange={(e) =>
                                          setCount(
                                            key,
                                            Math.max(
                                              0,
                                              parseInt(e.target.value) || 0
                                            )
                                          )
                                        }
                                        className="w-8 text-center text-sm font-bold bg-transparent border-none outline-none appearance-none p-0 focus:ring-0 text-slate-900"
                                        style={{ MozAppearance: "textfield" }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateCount(key, 1)}
                                        className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded text-gray-600 hover:bg-gray-100 border border-gray-200 shrink-0 text-sm font-bold"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {editingInvitation.type === "group" && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                      <span className="material-symbols-rounded text-indigo-600 text-lg">groups</span>
                      Danh sách thành viên đoàn ({Array.isArray(editingInvitation.attendees) ? editingInvitation.attendees.length : 0} / {editingInvitation.quantity || 1} người)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(editingInvitation.attendees) ? [...editingInvitation.attendees] : [];
                        if (current.length < (editingInvitation.quantity || 1)) {
                          current.push({ name: "", isLeader: current.length === 0 });
                          setEditingInvitation({ ...editingInvitation, attendees: current });
                        }
                      }}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-rounded text-sm">add</span>
                      Thêm người
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(editingInvitation.attendees || []).map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 w-5 text-right">{idx + 1}.</span>
                        <input
                          type="text"
                          value={att.name}
                          placeholder={`Họ và tên thành viên #${idx + 1}`}
                          onChange={(e) => {
                            const val = e.target.value.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
                            const next = [...(editingInvitation.attendees || [])];
                            next[idx] = { ...next[idx], name: val };
                            setEditingInvitation({ ...editingInvitation, attendees: next });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          title="Xóa người này"
                          onClick={() => {
                            const next = (editingInvitation.attendees || []).filter((_, i) => i !== idx);
                            setEditingInvitation({ ...editingInvitation, attendees: next });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <span className="material-symbols-rounded text-base">close</span>
                        </button>
                      </div>
                    ))}
                    {(!editingInvitation.attendees || editingInvitation.attendees.length === 0) && (
                      <p className="text-xs text-slate-400 italic">Chưa có danh sách thành viên nhập sẵn.</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Ghi chú / Lớp / Lời nhắn
                </label>
                <textarea
                  rows={3}
                  value={editingInvitation.note || ""}
                  onChange={(e) =>
                    setEditingInvitation({ ...editingInvitation, note: e.target.value })
                  }
                  placeholder="Lớp: ... | Lời nhắn: ..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm leading-relaxed"
                />
              </div>
            </div>
            <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/60 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingInvitation(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={
                  busy ||
                  (editingInvitation.type === "group" &&
                    Object.values(editingInvitation.sizes || {}).reduce(
                      (sum, c) => sum + (Math.max(0, Number(c) || 0)),
                      0
                    ) !== (editingInvitation.quantity || 1))
                }
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-2xs"
              >
                {busy ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={!!rejectingInvitation}
        onClose={() => setRejectingInvitation(null)}
        size="md"
        title="Từ chối thư mời"
        subtitle={
          rejectingInvitation ? (
            <span>
              {rejectingInvitation.attendeeName || rejectingInvitation.memberName} ·{" "}
              <span className="font-mono font-bold text-rose-600">
                {rejectingInvitation.code}
              </span>
            </span>
          ) : undefined
        }
        icon="cancel"
        footer={
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejectingInvitation(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirmReject}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
            >
              {busy ? "Đang xử lý…" : "Xác nhận từ chối"}
            </button>
          </>
        }
      >
        {rejectingInvitation && (
          <div className="space-y-4">
            {/* Presets chọn nhanh */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Chọn nhanh lý do:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset1()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition-colors border border-slate-200/60"
                >
                  Mẫu 1: Trùng mã thư mời
                </button>
                <button
                  type="button"
                  onClick={applyPreset2}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 transition-colors border border-slate-200/60"
                >
                  Mẫu 2: Hết hạn đợt 1
                </button>
                <button
                  type="button"
                  onClick={applyPreset3}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 transition-colors border border-slate-200/60"
                >
                  Mẫu 3: Hệ thống tự động lọc ảo
                </button>
              </div>
            </div>

            {/* Duplicate hints if any */}
            {duplicateInvitations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-xs text-slate-400 font-medium shrink-0">Mã gợi ý:</span>
                {duplicateInvitations.map((dup) => (
                  <button
                    key={dup.id}
                    type="button"
                    onClick={() => {
                      setInviIdInput(dup.code);
                      applyPreset1(dup.code);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors border ${
                      inviIdInput === dup.code
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    }`}
                    title="Bấm để chèn mã này vào Mẫu 1"
                  >
                    {dup.code}
                  </button>
                ))}
              </div>
            )}

            {/* Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nội dung lý do từ chối:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối hoặc chọn mẫu phía trên..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Lightbox Modal */}
      <Modal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        unstyled
        zIndex={200}
        backdropClassName="bg-black/90 backdrop-blur-sm"
      >
        {lightboxImage && (
          <div className="relative max-h-[90vh] max-w-[90vw] flex items-center justify-center">
            <button
              type="button"
              className="fixed top-4 right-4 text-white hover:text-slate-300 transition-colors p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md z-20"
              onClick={() => setLightboxImage(null)}
              title="Đóng"
            >
              <span className="material-symbols-rounded block text-3xl">close</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Biên lai phóng to"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl shadow-black/50"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
