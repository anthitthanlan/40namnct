"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  SIZES,
  UNIT_PRICE,
  formatVnd,
  type Size,
} from "@/lib/ticket-view";

const inputCls =
  "mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none";
const labelCls =
  "mt-5 block text-xs font-extrabold uppercase tracking-wider text-slate-500";

type Kind = "individual" | "group";

const ZERO_SIZES: Record<string, string> = Object.fromEntries(
  SIZES.map((s) => [s, "0"]),
);

export default function TicketForm({
  defaultName,
  onCreated,
}: {
  defaultName: string;
  onCreated: () => void;
}) {
  const [kind, setKind] = useState<Kind>("individual");
  const [attendee, setAttendee] = useState(defaultName);
  const [size, setSize] = useState<Size>("M");
  const [quantity, setQuantity] = useState("10");
  const [breakdown, setBreakdown] = useState<Record<string, string>>(ZERO_SIZES);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const qtyNum = Math.max(0, Math.min(500, parseInt(quantity, 10) || 0));
  const filled = useMemo(
    () =>
      SIZES.reduce((sum, s) => sum + (parseInt(breakdown[s] ?? "0", 10) || 0), 0),
    [breakdown],
  );
  const total = qtyNum * UNIT_PRICE;
  const mismatch = kind === "group" && filled !== qtyNum;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (kind === "group") {
      if (qtyNum < 1) {
        setMsg({ ok: false, text: "Vui lòng nhập số lượng suất (tối thiểu 1)." });
        return;
      }
      if (filled !== qtyNum) {
        setMsg({
          ok: false,
          text: `Tổng số áo theo size (${filled}) phải bằng số lượng suất (${qtyNum}).`,
        });
        return;
      }
    }
    const payload =
      kind === "individual"
        ? { type: "individual", attendeeName: attendee, size, note }
        : {
            type: "group",
            quantity: qtyNum,
            sizes: Object.fromEntries(
              SIZES.map((s) => [s, parseInt(breakdown[s] ?? "0", 10) || 0]),
            ),
            note,
          };
    setBusy(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg({ ok: false, text: data.message || "Không tạo được vé." });
        return;
      }
      setMsg({
        ok: true,
        text:
          kind === "individual"
            ? "🎟 Đã đăng ký vé cá nhân (miễn phí) - xuất trình mã định danh tại cổng ngày 15/11/2026!"
            : "🎟 Đã tạo vé tập thể - quét mã QR trong danh sách vé bên dưới để chuyển khoản nhé!",
      });
      onCreated();
    } catch {
      setMsg({ ok: false, text: "Có lỗi xảy ra, vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="btn-pop-soft rounded-[2rem] bg-white p-7 sm:p-9">
      <h2 className="text-xl font-extrabold text-slate-900">
        🎟 Đăng ký vé tham dự 15/11/2026
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["individual", "👤 Vé cá nhân", "Miễn phí · chọn 1 size áo kỷ niệm"],
            ["group", "👥 Vé tập thể", `${formatVnd(UNIT_PRICE)}/suất · nhóm, lớp, khóa`],
          ] as const
        ).map(([key, title, desc]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setKind(key);
              setMsg(null);
            }}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              kind === key
                ? "border-[#1d4ed8] bg-[#1d4ed8]/5"
                : "border-slate-100 bg-slate-50 hover:border-slate-200"
            }`}
          >
            <span
              className={`block text-sm font-extrabold ${
                kind === key ? "text-[#1d4ed8]" : "text-slate-700"
              }`}
            >
              {title}
            </span>
            <span className="mt-1 block text-xs text-slate-500">{desc}</span>
          </button>
        ))}
      </div>

      {kind === "individual" ? (
        <div className="grid gap-x-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="tk-attendee">
              Tên người tham dự
            </label>
            <input
              id="tk-attendee"
              value={attendee}
              onChange={(e) => setAttendee(e.target.value)}
              className={inputCls}
              maxLength={80}
              placeholder="Mặc định dùng tên tài khoản"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tk-size">
              Size áo kỷ niệm *
            </label>
            <select
              id="tk-size"
              value={size}
              onChange={(e) => setSize(e.target.value as Size)}
              className={inputCls}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <>
          <label className={labelCls} htmlFor="tk-qty">
            Số lượng suất *
          </label>
          <input
            id="tk-qty"
            type="number"
            min={1}
            max={500}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
            className={`${inputCls} font-extrabold`}
          />
          <p className={labelCls}>Số lượng áo theo size *</p>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {SIZES.map((s) => (
              <label key={s} className="text-center">
                <span className="block text-xs font-extrabold text-slate-500">
                  {s}
                </span>
                <input
                  type="number"
                  min={0}
                  value={breakdown[s] ?? "0"}
                  onChange={(e) =>
                    setBreakdown((prev) => ({
                      ...prev,
                      [s]: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className="mt-1 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-2 py-2 text-center font-extrabold text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                />
              </label>
            ))}
          </div>
          <p
            className={`mt-2 text-xs font-bold ${
              mismatch ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            Đã điền {filled} / {qtyNum || 0} suất
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">
            Thành tiền: {formatVnd(total)}
            <span className="ml-1 font-semibold text-slate-500">
              ({qtyNum} suất × {formatVnd(UNIT_PRICE)})
            </span>
          </p>
        </>
      )}

      <label className={labelCls} htmlFor="tk-note">
        Ghi chú (khóa, lớp, nhóm - nếu có)
      </label>
      <input
        id="tk-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="VD: Lớp 12A2 - khóa 2005"
        className={inputCls}
        maxLength={200}
      />

      {msg && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
          }`}
        >
          {msg.text}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="btn-pop mt-6 w-full bg-[#16a34a] py-3.5 text-base font-extrabold text-white disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {busy ? "Đang lưu…" : "✅ Đăng ký vé"}
      </button>
    </form>
  );
}
