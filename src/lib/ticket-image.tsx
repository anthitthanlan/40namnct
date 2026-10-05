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
  add("Unbounded", "Unbounded-Regular.woff", 400);
  add("Unbounded", "Unbounded-Bold.woff", 700);
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
    width: 400,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const bgBuf = readPublic("invitation background image", "thu-moi-NCT-anh-nen.jpg");
  const bg = `data:image/jpeg;base64,${bgBuf.toString("base64")}`;
  const logoNct = await webpToPngDataUri("images", "logo_nct.webp");
  const logo40 = await webpToPngDataUri("images", "Logo_40th_NCT.webp");

  const tree = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#ffffff",
        borderRadius: px(24),
        border: `${SCALE}px solid #e5e7eb`,
        overflow: "hidden",
      }}
    >
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt=""
        width={W * SCALE}
        height={H * SCALE}
        style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
      />
      
      {/* Overlay to fade background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.95) 5%, rgba(255,255,255,0.7) 25%, rgba(255,255,255,0.7) 75%, rgba(255,255,255,0.95) 95%)",
        }}
      />

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
        {/* Header */}
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
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Unbounded", fontWeight: 700, color: "#1e3a8a", fontSize: px(12), textTransform: "uppercase", letterSpacing: "0.025em" }}>
            <span>Kỉ niệm 40 năm thành lập</span>
            <span>Trường THPT Nguyễn Công Trứ</span>
          </div>
        </div>

        {/* QR */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: px(12), marginBottom: px(20) }}>
          <div
            style={{
              display: "flex",
              padding: px(10),
              backgroundColor: "#ffffff",
              border: `${SCALE}px solid #e5e7eb`,
              borderRadius: px(16),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUri} alt="" width={176 * SCALE} height={176 * SCALE} style={{ borderRadius: px(8) }} />
          </div>
        </div>

        {/* Slogan */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontFamily: "Beau Rivage",
            fontSize: px(40),
            color: "#047857",
            marginBottom: px(20),
            marginTop: px(-8),
            lineHeight: 1,
          }}
        >
          Memories Alive Again
        </div>

        {/* Info */}
        <div style={{ display: "flex", flexDirection: "column", fontSize: px(15), color: "#1f2937", gap: px(6) }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 600, color: "#374151", width: px(112) }}>Cựu học sinh:</span>
            <span style={{ fontFamily: "Prata", fontWeight: 400, color: "#111827", fontSize: px(18), letterSpacing: "0.025em" }}>{name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 600, color: "#374151", width: px(112) }}>Niên khóa:</span>
            <span style={{ fontFamily: "Prata", fontWeight: 400, color: "#111827" }}>{nienKhoa}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 600, color: "#374151", width: px(112) }}>SĐT:</span>
            <span style={{ fontFamily: "Prata", fontWeight: 400, color: "#111827" }}>{phone}</span>
          </div>

          {/* Time & place */}
          <div style={{ display: "flex", flexDirection: "column", paddingTop: px(12), marginTop: px(4), borderTop: `${SCALE}px solid #f3f4f6`, gap: px(6) }}>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <svg width={18*SCALE} height={18*SCALE} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: px(8), marginTop: px(2) }}>
                <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "Inter", fontWeight: 600, color: "#374151", fontSize: px(13) }}>Thời gian:</span>
                <span style={{ fontFamily: "Prata", fontWeight: 400, color: "#1f2937" }}>08:00 - 08/11/2026</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <svg width={18*SCALE} height={18*SCALE} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: px(8), marginTop: px(2) }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "Inter", fontWeight: 600, color: "#374151", fontSize: px(13) }}>Địa điểm:</span>
                <span style={{ fontFamily: "Prata", fontWeight: 400, color: "#1f2937" }}>Trường THPT Nguyễn Công Trứ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
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
      
      {/* Corner decorations */}
      <div style={{ position: "absolute", top: 0, left: 0, width: px(56), height: px(56), borderTop: `${SCALE*4}px solid rgba(30,58,138,0.1)`, borderLeft: `${SCALE*4}px solid rgba(30,58,138,0.1)`, borderTopLeftRadius: px(24) }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: px(56), height: px(56), borderBottom: `${SCALE*4}px solid rgba(30,58,138,0.1)`, borderRight: `${SCALE*4}px solid rgba(30,58,138,0.1)`, borderBottomRightRadius: px(24) }} />
    </div>
  );

  const res = new ImageResponse(tree, {
    width: W * SCALE,
    height: H * SCALE,
    fonts: loadFonts(),
  });
  return Buffer.from(await res.arrayBuffer());
}
