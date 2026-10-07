"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Mail,
  Send,
  Users,
  CheckSquare,
  Square,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

type MemberUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status?: string;
  ticketCount?: number;
  amount?: string | number;
  donate_code?: string;
  invi_id?: string;
  source: "member" | "manual";
};

type EmailTemplate = {
  id: string;
  title: string;
  subject: string;
  content: string;
  created_at?: string;
};


export default function AdminEmail({ onAuthError }: { onAuthError?: () => void }) {
  const [users, setUsers] = useState<MemberUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"has_email" | "auto_confirmed" | "manual_confirmed" | "pending" | "rejected">("has_email");

  // Email Composer State
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [fromName, setFromName] = useState("BTC chương trình kỷ niệm 40 năm NCTrứ");
  const [fromEmail, setFromEmail] = useState("bantochuc@40namnctru.nctitc.io.vn");
  const [previewMode, setPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);

  // Manual Email Input
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // DB Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load registered members from API
  const loadRecipients = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/registrations", { cache: "no-store" });
      if (res.status === 401) {
        onAuthError?.();
        return;
      }
      const data = await res.json();
      if (data.ok && Array.isArray(data.members)) {
        const mappedUsers: MemberUser[] = [];
        const seenEmails = new Set<string>();

        // Map from members (only those who have at least 1 invitation)
        data.members.forEach((m: any) => {
          const email = (m.email || "").trim().toLowerCase();
          // Push all who have invitations
          const memberInvitations = data.invitations?.filter((inv: any) => inv.memberId === m.id) || [];
          if (email && !seenEmails.has(email) && memberInvitations.length > 0) {
            seenEmails.add(email);
            
            const inv = memberInvitations[0];
            let mappedStatus = "pending";
            if (inv.status === "rejected") mappedStatus = "rejected";
            else if (inv.status === "confirmed") {
              mappedStatus = inv.ocrResult?.confidence === "high" ? "auto_confirmed" : "manual_confirmed";
            } else {
              mappedStatus = "pending";
            }

            mappedUsers.push({
              id: m.id || email,
              name: m.name || "Khách mời",
              email: email,
              phone: m.phone || "",
              status: mappedStatus,
              ticketCount: m.invitationCount || memberInvitations.length,
              amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(memberInvitations[0]?.amount || 0),
              donate_code: memberInvitations[0]?.code || "",
              invi_id: memberInvitations[0]?.id || "",
              source: "member",
            });
          }
        });

        // Also check invitations if there are member emails not captured
        if (Array.isArray(data.invitations)) {
          data.invitations.forEach((inv: any) => {
            const email = (inv.memberEmail || "").trim().toLowerCase();
            if (email && !seenEmails.has(email)) {
              seenEmails.add(email);
              
              let mappedStatus = "pending";
              if (inv.status === "rejected") mappedStatus = "rejected";
              else if (inv.status === "confirmed") {
                mappedStatus = inv.ocrResult?.confidence === "high" ? "auto_confirmed" : "manual_confirmed";
              } else {
                mappedStatus = "pending";
              }

              mappedUsers.push({
                id: inv.id || email,
                name: inv.attendeeName || inv.memberName || "Khách mời",
                email: email,
                phone: inv.memberPhone || "",
                status: mappedStatus,
                ticketCount: inv.quantity || 1,
                amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.amount || 0),
                donate_code: inv.code || "",
                invi_id: inv.id || "",
                source: "member",
              });
            }
          });
        }

        setUsers(mappedUsers);

        // Pre-select all users with valid email by default
        const initialSelected = new Set(
          mappedUsers
            .filter((u) => u.email && u.email.includes("@"))
            .map((u) => u.email)
        );
        setSelectedEmails(initialSelected);
      }
    } catch (err) {
      console.error("Failed to load recipients:", err);
      toast.error("Không thể tải danh sách người nhận.");
    } finally {
      setLoadingUsers(false);
    }
  }, [onAuthError]);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/admin/email/templates");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) setTemplates(data.templates);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadRecipients();
    loadTemplates();
  }, [loadRecipients, loadTemplates]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!u.email || !u.email.includes("@")) return false; // always require email
      if (filterType === "has_email") return true;
      if (filterType !== u.status) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
      );
    });
  }, [users, filterType, searchQuery]);

  // Toggle single email selection
  const toggleUser = (email: string) => {
    if (!email) return;
    const next = new Set(selectedEmails);
    if (next.has(email)) {
      next.delete(email);
    } else {
      next.add(email);
    }
    setSelectedEmails(next);
  };

  // Select all visible filtered users
  const selectAll = () => {
    const next = new Set(selectedEmails);
    filteredUsers.forEach((u) => {
      if (u.email && u.email.includes("@")) {
        next.add(u.email);
      }
    });
    setSelectedEmails(next);
    toast.success(`Đã chọn tất cả ${filteredUsers.length} người trong danh sách!`);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedEmails(new Set());
    toast("Đã bỏ chọn toàn bộ người nhận", { icon: "🧹" });
  };

  // Add custom / manual email
  const handleAddManualEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = manualEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    if (users.some((u) => u.email === cleanEmail)) {
      // Already exists, just select it
      const next = new Set(selectedEmails);
      next.add(cleanEmail);
      setSelectedEmails(next);
      toast.success(`Email ${cleanEmail} đã có trong danh sách và đã được chọn.`);
    } else {
      const newUser: MemberUser = {
        id: `manual-${Date.now()}`,
        name: manualName.trim() || cleanEmail.split("@")[0],
        email: cleanEmail,
        phone: "",
        status: "confirmed",
        source: "manual",
      };
      setUsers((prev) => [newUser, ...prev]);
      const next = new Set(selectedEmails);
      next.add(cleanEmail);
      setSelectedEmails(next);
      toast.success(`Đã thêm ${cleanEmail} vào danh sách nhận!`);
    }

    setManualEmail("");
    setManualName("");
  };

  // Remove manual user
  const removeUser = (email: string) => {
    setUsers((prev) => prev.filter((u) => u.email !== email));
    const next = new Set(selectedEmails);
    next.delete(email);
    setSelectedEmails(next);
  };

  const applyTemplate = (tpl: EmailTemplate) => {
    if (content.trim() && !window.confirm(`Áp dụng mẫu "${tpl.title}" sẽ thay thế nội dung đang soạn. Bạn có chắc không?`)) {
      return;
    }
    setSubject(tpl.subject);
    setContent(tpl.content);
    toast.success(`Đã nạp mẫu: ${tpl.title}`);
  };

  const saveAsNewTemplate = async () => {
    if (!subject.trim() || !content.trim()) return toast.error("Vui lòng nhập đủ Tiêu đề và Nội dung email.");
    const title = window.prompt("Nhập tên hiển thị cho mẫu email này:");
    if (!title) return;

    const tid = toast.loading("Đang lưu mẫu...");
    try {
      const res = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, content })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Đã lưu mẫu email thành công!", { id: tid });
        loadTemplates();
      } else {
        toast.error(data.message || "Lỗi lưu mẫu email.", { id: tid });
      }
    } catch (e) {
      toast.error("Lỗi kết nối.", { id: tid });
    }
  };

  const deleteTemplate = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu "${title}"?`)) return;
    const tid = toast.loading("Đang xóa mẫu...");
    try {
      const res = await fetch(`/api/admin/email/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Đã xóa mẫu email.", { id: tid });
        loadTemplates();
      } else {
        toast.error("Lỗi xóa mẫu.", { id: tid });
      }
    } catch (e) {
      toast.error("Lỗi kết nối.", { id: tid });
    }
  };

  // Final list of selected recipient objects
  const selectedRecipients = useMemo(() => {
    return Array.from(selectedEmails)
      .map((email) => {
        const found = users.find((u) => u.email === email);
        return {
          name: found?.name || email.split("@")[0],
          email: email,
          amount: found?.amount,
          donate_code: found?.donate_code,
          invi_id: found?.invi_id,
        };
      })
      .filter((r) => r.email && r.email.includes("@"));
  }, [selectedEmails, users]);

  // Send test email to current admin
  const handleTestSend = async () => {
    const testEmail = prompt("Nhập địa chỉ email để nhận thư thử nghiệm:", fromEmail);
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      if (testEmail) toast.error("Địa chỉ email không hợp lệ.");
      return;
    }

    const toastId = toast.loading(`Đang gửi thư thử nghiệm đến ${testEmail}...`);
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [{ name: "Quản trị viên (Test)", email: testEmail.trim() }],
          subject: `[TEST] ${subject || "Thử nghiệm gửi email"}`,
          content: content || "<p>Nội dung kiểm tra gửi email Resend.</p>",
          fromName,
          fromEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success(`Đã gửi email thử nghiệm thành công đến ${testEmail}!`, { id: toastId });
      } else {
        toast.error(data.message || "Gửi email thử nghiệm thất bại.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi kết nối khi gửi email thử nghiệm.", { id: toastId });
    }
  };

  // Mass send email via Resend
  const handleExecuteSend = async () => {
    if (selectedRecipients.length === 0) {
      toast.error("Vui lòng chọn ít nhất một người nhận có email.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Vui lòng nhập tiêu đề email.");
      return;
    }
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung email.");
      return;
    }

    setSending(true);
    setShowConfirmModal(false);
    const toastId = toast.loading(`Đang gửi email cho ${selectedRecipients.length} người nhận qua Resend...`);

    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: selectedRecipients,
          subject,
          content,
          fromName,
          fromEmail,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        toast.success(data.message || `Đã gửi thành công ${data.sentCount} email!`, {
          id: toastId,
          duration: 5000,
        });
      } else {
        toast.error(data.message || "Gửi email thất bại.", { id: toastId, duration: 6000 });
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi đường truyền khi gửi email.", { id: toastId });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-200 border border-white/20 mb-3 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Hệ thống Email Tự Động & Hàng Loạt (Resend)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Soạn & Gửi Email
          </h2>
          <p className="mt-1.5 text-sm text-blue-100/90 max-w-xl">
            Gửi thông báo, thư mời điện tử và tri ân tới từng khách mời và cựu học sinh. Hỗ trợ cá nhân hóa tên người nhận theo mẫu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadRecipients}
            disabled={loadingUsers}
            className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition-all backdrop-blur-md disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
            <span>Đồng bộ dữ liệu</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Total Available */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng người có email</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {users.filter((u) => u.email && u.email.includes("@")).length}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 2: Selected Counter */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-5 border-2 border-blue-200/80 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                Đang chọn gửi
              </p>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#1d4ed8]">
                {selectedRecipients.length}
              </span>
              <span className="text-xs font-bold text-slate-500">
                / {users.length} người
              </span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 3: Quick Action Buttons */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center gap-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thao tác chọn nhanh</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 px-3 py-2 text-xs font-extrabold transition-all"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Chọn tất cả</span>
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-600 px-3 py-2 text-xs font-extrabold transition-all"
            >
              <Square className="h-4 w-4" />
              <span>Bỏ chọn hết</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Recipient Selection List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header of list */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#1d4ed8]" />
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Danh sách người nhận
                  </h3>
                </div>
                <span className="rounded-full bg-blue-100 text-[#1d4ed8] px-2.5 py-0.5 text-xs font-black">
                  Đã chọn: {selectedRecipients.length}
                </span>
              </div>

              {/* Search & Filter */}
              <div className="mt-3.5 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pb-1 text-xs">
                  {[
                    { id: "has_email", label: "Tất cả (có email)" },
                    { id: "auto_confirmed", label: "Đã duyệt tự động" },
                    { id: "manual_confirmed", label: "Đã duyệt thủ công" },
                    { id: "pending", label: "Chờ duyệt" },
                    { id: "rejected", label: "Bị từ chối" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilterType(tab.id as any)}
                      className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition-all ${
                        filterType === tab.id
                          ? "bg-[#1d4ed8] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label} ({tab.id === "has_email" ? users.filter(u => u.email?.includes("@")).length : users.filter((u) => u.email?.includes("@") && u.status === tab.id).length})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Manual Add Form */}
            <form onSubmit={handleAddManualEmail} className="p-3 bg-blue-50/50 border-b border-blue-100/60">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900/80 mb-1.5 flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Thêm nhanh email người nhận
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tên (tuỳ chọn)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-1/3 rounded-xl border border-blue-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-blue-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#1d4ed8] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shrink-0"
                >
                  Thêm
                </button>
              </div>
            </form>

            {/* List items */}
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {loadingUsers ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span>Đang tải danh sách người dùng...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  Không tìm thấy người nhận nào phù hợp với bộ lọc.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedEmails.has(u.email);
                  const hasValidEmail = Boolean(u.email && u.email.includes("@"));

                  return (
                    <div
                      key={u.id}
                      onClick={() => hasValidEmail && toggleUser(u.email)}
                      className={`p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                        isSelected
                          ? "bg-blue-50/70 hover:bg-blue-100/60"
                          : "hover:bg-slate-50"
                      } ${!hasValidEmail ? "opacity-40 cursor-not-allowed bg-slate-50/50" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!hasValidEmail}
                          onChange={() => {}} // handled by parent onClick
                          className="h-4 w-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-blue-500 pointer-events-none"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-800 truncate">
                              {u.name}
                            </span>
                            {u.source === "manual" && (
                              <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                                Thủ công
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate font-mono">
                            {u.email || "(Chưa có email)"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {u.phone && (
                          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                            {u.phone}
                          </span>
                        )}
                        {u.source === "manual" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUser(u.email);
                            }}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Xóa khỏi danh sách"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                              u.status === "auto_confirmed" ? "bg-emerald-100 text-emerald-700" :
                              u.status === "manual_confirmed" ? "bg-blue-100 text-blue-700" :
                              u.status === "rejected" ? "bg-rose-100 text-rose-700" :
                              "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {u.status === "auto_confirmed" ? "Duyệt tự động" :
                             u.status === "manual_confirmed" ? "Duyệt thủ công" :
                             u.status === "rejected" ? "Bị từ chối" : "Chờ duyệt"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom summary bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-medium">
              <span>Hiển thị {filteredUsers.length} người</span>
              <span className="font-bold text-blue-700">
                Đã chọn: {selectedRecipients.length} người
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Email Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-6">
            {/* Header & Template Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Edit3 className="h-5 w-5 text-[#1d4ed8]" />
                <h3 className="font-extrabold text-slate-800 text-lg">
                  Soạn nội dung email
                </h3>
              </div>

              {/* Preview mode toggle */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all ${
                    !previewMode
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Soạn thảo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all ${
                    previewMode
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem trước</span>
                </button>
              </div>
            </div>

            {/* DB Templates UI */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Mẫu email của tôi
                </label>
                <button
                  type="button"
                  onClick={saveAsNewTemplate}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 bg-blue-50/50 hover:bg-blue-100 px-2 py-1 rounded-lg"
                >
                  <Plus className="h-3 w-3" />
                  Lưu mẫu từ nội dung đang soạn
                </button>
              </div>
              
              {loadingTemplates ? (
                <p className="text-xs text-slate-400">Đang tải danh sách mẫu...</p>
              ) : templates.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">Chưa có mẫu nào. Hãy soạn một thư và nhấn "Lưu mẫu từ nội dung đang soạn".</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 text-left text-xs font-bold text-slate-700 transition-all flex flex-col justify-between relative group cursor-pointer"
                    >
                      <span className="line-clamp-2 pr-6">{tpl.title}</span>
                      <button 
                        type="button"
                        onClick={(e) => deleteTemplate(tpl.id, tpl.title, e)} 
                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 rounded hover:bg-rose-100 transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa mẫu này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sender details (From info) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Tên người gửi (From Name)
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  placeholder="Lễ Kỷ Niệm 40 Năm NCT"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Email người gửi (From Email)
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="hi@nctitc.io.vn"
                />
              </div>
            </div>

            {/* Email Subject Line */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Tiêu đề email (Subject) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {subject.length} ký tự
                </span>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Thư mời tham dự Lễ Kỷ Niệm 40 Năm Thành Lập Trường..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* Personalization Tag Note */}
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-800">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Các thẻ cá nhân hóa:</span> Hệ thống sẽ tự động thay thế các thẻ sau trong nội dung thành dữ liệu của từng người nhận:
                <div className="mt-1 flex flex-wrap gap-1">
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-bold text-amber-900 font-mono">{"{name}"}</code> (Họ tên)
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-bold text-amber-900 font-mono">{"{amount}"}</code> (Số tiền đóng góp)
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-bold text-amber-900 font-mono">{"{donate_code}"}</code> (Mã đóng góp)
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-bold text-amber-900 font-mono">{"{invi_id}"}</code> (Mã thư mời)
                </div>
              </div>
            </div>

            {/* Editor or Live Preview */}
            {!previewMode ? (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Nội dung email <span className="text-rose-500">*</span>
                </label>
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <RichTextEditor content={content} onChange={setContent} />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Giao diện email thực tế hiển thị trong hòm thư người nhận
                </label>
                {/* Email Client Mock Frame */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-[#f8fafc] p-4 sm:p-6 shadow-inner">
                  <div className="max-w-[600px] mx-auto bg-transparent">
                    {/* Email Body */}
                    <div
                      className="p-5 text-[15px] text-slate-700 leading-relaxed prose prose-sm max-w-none text-left"
                      dangerouslySetInnerHTML={{
                        __html: content
                          .replace(/\{name\}/gi, "Nguyễn Văn A")
                          .replace(/\{email\}/gi, "nguyenvana@gmail.com") || "<p>Nội dung thư trống...</p>",
                      }}
                    />

                    {/* Email Footer */}
                    <div className="mt-8 pt-5 text-center border-t border-slate-200 text-[13px] text-slate-400">
                      <p className="font-medium text-slate-500 m-0">
                        Ban Tổ Chức chương trình Kỷ Niệm 40 Năm THPT Nguyễn Công Trứ
                      </p>
                      <p className="text-[11px] mt-1 m-0">
                        Email được gửi đến: <strong>nguyenvana@gmail.com</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Toolbar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleTestSend}
                disabled={sending}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-5 py-3 text-xs font-extrabold text-slate-700 transition-all disabled:opacity-50"
              >
                <Mail className="h-4 w-4 text-slate-500" />
                <span>Gửi thử nghiệm</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={sending || selectedRecipients.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] hover:bg-blue-700 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/35 disabled:opacity-50 disabled:pointer-events-none"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang gửi email...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Gửi email cho {selectedRecipients.length} người nhận</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 rounded-2xl bg-blue-100 text-[#1d4ed8] items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Xác nhận gửi email hàng loạt
                </h4>
                <p className="text-xs text-slate-500">
                  Vui lòng kiểm tra lại thông số chiến dịch trước khi phát lệnh gửi.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Số lượng người nhận:</span>
                <span className="font-extrabold text-[#1d4ed8]">
                  {selectedRecipients.length} địa chỉ email
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Người gửi:</span>
                <span className="font-bold text-slate-700">{fromName} ({fromEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Tiêu đề email:</span>
                <span className="font-bold text-slate-900 max-w-[240px] truncate text-right">
                  {subject}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Cổng gửi mail:</span>
                <span className="font-extrabold text-emerald-600">Resend API Service</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Hệ thống sẽ gửi email riêng biệt tới từng người nhận trong danh sách để đảm bảo bảo mật và tính cá nhân hóa.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteSend}
                className="flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-6 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Tiến hành gửi ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
