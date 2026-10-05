import * as React from "react";
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import sharp from "sharp";

/**
 * Render vé mời thành PNG ngay trên server (satori qua next/og) để đính kèm email.
 * Mọi tài nguyên (ảnh nền, logo, QR, font) đều đọc local / nhúng data-URI,
 * nên không phụ thuộc việc client mail có load ảnh từ link hay không.
 */

export type TicketImageInput = {
  name: string;
  phone?: string;
  nienKhoa?: string;
  invitationCode: string;
};

const W = 380;
const H = 640;
const SCALE = 2; // xuất 760x1280 cho nét

const px = (n: number) => `${n * SCALE}px`;

function readPublic(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), "public", ...segments));
}

async function webpToPngDataUri(...segments: string[]) {
  const png = await sharp(readPublic(...segments)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

type FontDef = {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 700 | 800;
  style: "normal";
};

let fontCache: FontDef[] | null = null;

function loadFonts(): FontDef[] {
  if (fontCache) return fontCache;
  const fonts: FontDef[] = [];
  
  const add = (name: string, file: string, weight: 400 | 600 | 700 | 800) => {
    fonts.push({
      name,
      data: fs.readFileSync(path.join(process.cwd(), "public", "fonts", file)),
      weight,
      style: "normal",
    });
  };

  add("Inter", "Inter-Regular.woff", 400);
  add("Inter", "Inter-SemiBold.woff", 600);
  add("Inter", "Inter-Bold.woff", 800);
  add("Prata", "Prata-Regular.woff", 400);
  add("Beau Rivage", "BeauRivage-Regular.woff", 400);
  
  fontCache = fonts;
  return fonts;
}

export async function renderTicketPng(
  input: TicketImageInput,
): Promise<Buffer> {
  const { name, phone = "", nienKhoa = "", invitationCode } = input;

  const qrText = `${name} - ${phone} - ${invitationCode}`;
  const qrDataUri = await QRCode.toDataURL(qrText, {
    width: 176, // 44 * 4
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const bgBuf = readPublic("invitation_image", "bg.webp");
  const bgPng = await sharp(bgBuf).png().toBuffer();
  const bg = `data:image/png;base64,${bgPng.toString("base64")}`;
  
  const logoNct = await webpToPngDataUri("images", "logo_nct.webp");
  const logo40 = await webpToPngDataUri("images", "Logo_40th_NCT.webp");

  // The actual element is 380x600 roughly, we will render it exactly
  const tree = (
    <div
      style={{
        width: px(380),
        height: px(610),
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#ffffff",
        borderRadius: px(24),
        border: `${SCALE}px solid #e5e7eb`,
        overflow: "hidden",
      }}
    >
      {/* Background Layer (opacity 0.3) with gradient mask simulated by fading to white at edges */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", opacity: 0.3 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} alt="" width={380 * SCALE} height={610 * SCALE} style={{ objectFit: "cover" }} />
      </div>
      
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 75%, rgba(255,255,255,1) 100%)",
        }}
      />

      {/* Corner decorations */}
      <div style={{ position: "absolute", top: 0, left: 0, width: px(56), height: px(56), borderTop: `${4 * SCALE}px solid rgba(30,58,138,0.1)`, borderLeft: `${4 * SCALE}px solid rgba(30,58,138,0.1)`, borderTopLeftRadius: px(24) }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: px(56), height: px(56), borderBottom: `${4 * SCALE}px solid rgba(30,58,138,0.1)`, borderRight: `${4 * SCALE}px solid rgba(30,58,138,0.1)`, borderBottomRightRadius: px(24) }} />

      {/* Content Wrapper */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: px(24),
          zIndex: 10,
        }}
      >
        {/* Header: Logos & Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingBottom: px(12),
            marginBottom: px(8),
            borderBottom: `${SCALE}px solid #e5e7eb`,
          }}
        >
          <div style={{ display: "flex", marginRight: px(12) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoNct} alt="" width={40 * SCALE} height={40 * SCALE} style={{ marginRight: px(6) }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo40} alt="" width={40 * SCALE} height={40 * SCALE} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: px(12), color: "#1e3a8a", lineHeight: 1.25, letterSpacing: px(0.5) }}>
              KỈ NIỆM 40 NĂM THÀNH LẬP
            </span>
            <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: px(12), color: "#1e3a8a", lineHeight: 1.25, letterSpacing: px(0.5) }}>
              TRƯỜNG THPT NGUYỄN CÔNG TRỨ
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: px(12), marginBottom: px(20) }}>
          <div
            style={{
              display: "flex",
              padding: px(10),
              backgroundColor: "#ffffff",
              border: `${SCALE}px solid #e5e7eb`,
              borderRadius: px(16),
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUri} alt="" width={176 * SCALE} height={176 * SCALE} style={{ borderRadius: px(8) }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: px(20), marginTop: px(-8) }}>
          <span style={{ fontFamily: "Beau Rivage", fontSize: px(40), color: "#047857", lineHeight: 1, paddingTop: px(8) }}>
            Memories Alive Again
          </span>
        </div>

        {/* Invitation Info */}
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Inter", fontSize: px(15), color: "#1f2937" }}>
          <div style={{ display: "flex", marginBottom: px(6) }}>
            <span style={{ width: px(112), fontWeight: 600, color: "#374151" }}>Cựu học sinh:</span>
            <span style={{ fontFamily: "Prata", fontWeight: 400, fontSize: px(18), color: "#111827", letterSpacing: px(0.5) }}>{name}</span>
          </div>
          <div style={{ display: "flex", marginBottom: px(6) }}>
            <span style={{ width: px(112), fontWeight: 600, color: "#374151" }}>Niên khóa:</span>
            <span style={{ fontFamily: "Prata", fontWeight: 400 }}>{nienKhoa || "Không rõ"}</span>
          </div>
          <div style={{ display: "flex", marginBottom: px(6) }}>
            <span style={{ width: px(112), fontWeight: 600, color: "#374151" }}>SĐT:</span>
            <span style={{ fontFamily: "Prata", fontWeight: 400 }}>{phone}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", paddingTop: px(12), marginTop: px(4), borderTop: `${SCALE}px solid #f3f4f6` }}>
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: px(6) }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, color: "#374151", fontSize: px(13) }}>Thời gian:</span>
                <span style={{ fontFamily: "Prata", color: "#1f2937" }}>08:00 - 08/11/2026</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, color: "#374151", fontSize: px(13) }}>Địa điểm:</span>
                <span style={{ fontFamily: "Prata", color: "#1f2937" }}>Trường THPT Nguyễn Công Trứ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: px(24),
            paddingTop: px(12),
            borderTop: `${SCALE}px solid #e5e7eb`,
          }}
        >
          <span style={{ fontFamily: "Prata", fontSize: px(14), color: "#dc2626" }}>
            Vui lòng không chia sẻ thư mời này cho bất kì ai!
          </span>
        </div>
      </div>
    </div>
  );

  const res = new ImageResponse(tree, {
    width: 380 * SCALE,
    height: 610 * SCALE,
    fonts: loadFonts(),
  });
  return Buffer.from(await res.arrayBuffer());
}
