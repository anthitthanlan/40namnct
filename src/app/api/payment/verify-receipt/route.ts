import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nctitc.io.vn";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Forward the form data to FastAPI backend
    const backendRes = await fetch(`${BACKEND_URL}/api/ocr/verify-receipt`, {
      method: "POST",
      body: formData,
    });
    
    const backendData = await backendRes.json();
    return NextResponse.json(backendData, { status: backendRes.status });
  } catch (err) {
    console.error("Lỗi khi chuyển tiếp verify-receipt:", err);
    return NextResponse.json(
      { ok: false, message: "Lỗi hệ thống. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
