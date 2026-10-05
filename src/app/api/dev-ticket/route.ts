import { renderTicketPng } from "@/lib/ticket-image";

export const runtime = "nodejs";

export async function GET() {
  try {
    const png = await renderTicketPng({
      name: "Lại Nhất Phong",
      phone: "0772998715",
      nienKhoa: "2023 - 2026",
      invitationCode: "NCT19862026-001ABCDE",
    });
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
  } catch (e: any) {
    return new Response(e.stack || e.message || String(e), { status: 500 });
  }
}
