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

function fontFile(pkg: string, file: string) {
  return fs.readFileSync(
    path.join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file),
  );
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
  const add = (
    name: string,
    pkg: string,
    weight: 400 | 600 | 700 | 800,
  ) => {
    for (const subset of ["latin", "vietnamese"]) {
      fonts.push({
        name,
        data: fontFile(pkg, `${pkg}-${subset}-${weight}-normal.woff`),
        weight,
        style: "normal",
      });
    }
  };
  add("Inter", "inter", 400);
  add("Inter", "inter", 600);
  add("Inter", "inter", 800);
  add("Playfair Display", "playfair-display", 400);
  add("Playfair Display", "playfair-display", 700);
  add("Beau Rivage", "beau-rivage", 400);
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

  const label: React.CSSProperties = {
    display: "flex",
    width: px(110),
    color: "#4b5563",
    fontFamily: "Inter",
    fontSize: px(14),
  };
  const serif: React.CSSProperties = {
    fontFamily: "Playfair Display",
    fontWeight: 700,
    color: "#111827",
  };

  const tree = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#ffffff",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt=""
        width={W * SCALE}
        height={H * SCALE}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: px(24),
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingBottom: px(12),
            marginBottom: px(16),
            borderBottom: `${SCALE}px solid rgba(229,231,235,0.7)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoNct} alt="" width={40 * SCALE} height={40 * SCALE} style={{ marginRight: px(4) }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo40} alt="" width={40 * SCALE} height={40 * SCALE} style={{ marginRight: px(12) }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: px(11), color: "#1e3a8a", lineHeight: 1.4 }}>
              KỈ NIỆM 40 NĂM THÀNH LẬP
            </span>
            <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: px(11), color: "#1e3a8a", lineHeight: 1.4 }}>
              TRƯỜNG THPT NGUYỄN CÔNG TRỨ
            </span>
          </div>
        </div>

        {/* QR */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: px(16) }}>
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
            <img src={qrDataUri} alt="" width={160 * SCALE} height={160 * SCALE} />
          </div>
        </div>

        {/* Slogan */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontFamily: "Beau Rivage",
            fontSize: px(36),
            color: "#047857",
            marginBottom: px(16),
            lineHeight: 1.1,
          }}
        >
          Memories Alive Again
        </div>

        {/* Info */}
        <div style={{ display: "flex", flexDirection: "column", paddingTop: px(8) }}>
          <div style={{ display: "flex", marginBottom: px(6) }}>
            <span style={label}>Cựu học sinh:</span>
            <span style={{ ...serif, fontSize: px(16) }}>{name}</span>
          </div>
          <div style={{ display: "flex", marginBottom: px(6) }}>
            <span style={label}>Niên khóa:</span>
            <span style={{ ...serif, fontSize: px(14) }}>{nienKhoa}</span>
          </div>
          <div style={{ display: "flex", marginBottom: px(6) }}>
            <span style={label}>SĐT:</span>
            <span style={{ ...serif, fontSize: px(14) }}>{phone}</span>
          </div>
        </div>

        {/* Time & place */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: px(16),
            paddingTop: px(16),
            borderTop: `${SCALE}px solid rgba(229,231,235,0.9)`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", marginBottom: px(12) }}>
            <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: px(13), color: "#374151", marginBottom: px(2) }}>
              Thời gian:
            </span>
            <span style={{ fontFamily: "Playfair Display", fontSize: px(14), color: "#1f2937" }}>
              08:00 - 08/11/2026
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: px(13), color: "#374151", marginBottom: px(2) }}>
              Địa điểm:
            </span>
            <span style={{ fontFamily: "Playfair Display", fontSize: px(14), color: "#1f2937" }}>
              Trường THPT Nguyễn Công Trứ
            </span>
          </div>
        </div>

        {/* Warning */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: px(16),
            paddingTop: px(16),
            borderTop: `${SCALE}px solid rgba(229,231,235,0.9)`,
            fontFamily: "Playfair Display",
            fontSize: px(14),
            color: "#dc2626",
          }}
        >
          Vui lòng không chia sẻ thư mời này cho bất kì ai!
        </div>
      </div>
    </div>
  );

  const res = new ImageResponse(tree, {
    width: W * SCALE,
    height: H * SCALE,
    fonts: loadFonts(),
  });
  return Buffer.from(await res.arrayBuffer());
}
