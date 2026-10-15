import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import sharp from "sharp";

async function generatePerfectOgBannerWithEdge() {
  const width = 1200;
  const height = 630;
  const footerHeight = 85;
  const photoHeight = height - footerHeight; // 545px

  // 1. Trích xuất CSS styles (chứa nhúng base64 của Unbounded 400/700/800/900 và Google Sans Flex) từ poster-dot2-local.html
  const posterHtml = fs.readFileSync("../poster-dot2-local.html", "utf8");
  const styleMatch = posterHtml.match(/<style>([\s\S]*?)<\/style>/);
  const embeddedFontsCss = styleMatch ? styleMatch[1] : "";

  // Đọc font Montserrat ExtraBold và Bold để nhúng vào trang phục vụ hiển thị chữ số ngày tháng
  const montserratExtraBoldB64 = fs.readFileSync("public/fonts/Montserrat-ExtraBold.otf").toString("base64");
  const montserratBoldB64 = fs.readFileSync("public/fonts/Montserrat-Bold.otf").toString("base64");

  // 2. Chuyển đổi 2 logo và ảnh hero_1 backup sang base64 để trang HTML tự chứa toàn bộ tài nguyên
  const schoolLogoB64 = fs.readFileSync("public/images/NCT.webp").toString("base64");
  const logo40thB64 = fs.readFileSync("public/images/Logo_40th_NCT.webp").toString("base64");

  // Xử lý ảnh hero_1 từ thư mục backup (2048x1365 gốc)
  // Căn chuẩn trọng tâm cổng trường vào vạch xanh lá minh họa (x ≈ 864 trên canvas 1200)
  const scaledWidth = Math.round(2048 * (photoHeight / 1365)); // 818px
  const leftPos = 456;
  const extractWidth = width - leftPos; // 744px

  const heroBuffer = await sharp("public/hero_images_backup/hero_1.webp")
    .resize(scaledWidth, photoHeight)
    .extract({ left: 0, top: 0, width: extractWidth, height: photoHeight })
    .toBuffer();
  const heroB64 = heroBuffer.toString("base64");

  // 3. Xây dựng trang HTML render chuẩn xác từng pixel
  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    ${embeddedFontsCss}

    @font-face {
      font-family: 'Montserrat';
      font-style: normal;
      font-weight: 800;
      src: url('data:font/opentype;base64,${montserratExtraBoldB64}') format('opentype');
    }

    @font-face {
      font-family: 'Montserrat';
      font-style: normal;
      font-weight: 700;
      src: url('data:font/opentype;base64,${montserratBoldB64}') format('opentype');
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: #f8fafc;
      position: relative;
      font-family: 'Google Sans Flex', sans-serif;
    }

    /* Thanh chỉ xanh NCT Blue mảnh trên đỉnh */
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 7px;
      background: #1d4ed8;
      z-index: 100;
    }

    /* Khu vực ảnh hero bên phải */
    .hero-container {
      position: absolute;
      top: 0;
      left: ${leftPos}px;
      width: ${extractWidth}px;
      height: ${photoHeight}px;
      overflow: hidden;
      z-index: 1;
    }

    .hero-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Lớp gradient hòa sắc mượt mà vào ảnh */
    .hero-fade {
      position: absolute;
      top: 7px;
      left: 360px;
      width: 360px;
      height: ${photoHeight - 7}px;
      background: linear-gradient(to right, #f8fafc 0%, #f8fafc 35%, rgba(248, 250, 252, 0.85) 58%, rgba(248, 250, 252, 0.32) 80%, rgba(248, 250, 252, 0) 100%);
      z-index: 2;
    }

    /* Nội dung bên trái */
    .content-area {
      position: absolute;
      top: 0;
      left: 0;
      width: 720px;
      height: ${photoHeight}px;
      padding: 32px 0 32px 55px;
      z-index: 10;
      display: flex;
      flex-direction: column;
    }

    /* Header cặp logo và tên trường (Khối text giữ hoàn toàn Google Sans Flex) */
    .header-row {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 64px;
    }

    .school-logo {
      height: 64px;
      width: auto;
      object-fit: contain;
    }

    .divider-v {
      width: 1.5px;
      height: 44px;
      background: #cbd5e1;
    }

    .logo-40th {
      height: 64px;
      width: auto;
      object-fit: contain;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      margin-left: 2px;
    }

    .header-school-name {
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 700;
      font-size: 16.5px;
      color: #0f172a;
      letter-spacing: 0.3px;
      line-height: 1.2;
      white-space: nowrap;
    }

    .header-anniversary {
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 700;
      font-size: 13.5px;
      color: #16a34a;
      letter-spacing: 0.7px;
      line-height: 1.2;
      white-space: nowrap;
    }

    .divider-h {
      width: 520px;
      height: 1.2px;
      background: #e2e8f0;
      margin-top: 18px;
    }

    /* Khối tiêu đề chính: 3 dòng cân đối theo chỉ đạo */
    .title-block {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .title-kicker {
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 700;
      font-size: 15.5px;
      color: #1d4ed8;
      letter-spacing: 2.2px;
      text-transform: uppercase;
      line-height: 1.25;
      margin-bottom: 2px;
    }

    .title-main-black {
      font-family: 'Unbounded', sans-serif;
      font-weight: 800;
      font-size: 26.5px;
      color: #0f172a;
      letter-spacing: -0.4px;
      line-height: 1.32;
      white-space: nowrap;
    }

    .title-main-blue {
      font-family: 'Unbounded', sans-serif;
      font-weight: 800;
      font-size: 26.5px;
      color: #1d4ed8;
      letter-spacing: -0.4px;
      line-height: 1.32;
      white-space: nowrap;
    }

    /* Hai mốc sự kiện: Dịch xuống lấp đầy khoảng trống, tạo nhịp điệu cân bằng tuyệt đối */
    .events-stack {
      margin-top: 48px;
      display: flex;
      flex-direction: column;
      gap: 36px;
    }

    .event-row {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .icon-box-blue {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-box-green {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: #f0fdf4;
      border: 1.5px solid #bbf7d0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .event-text {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .event-label {
      font-family: 'Unbounded', sans-serif;
      font-weight: 800;
      font-size: 14.5px;
      color: #0f172a;
      letter-spacing: 0.6px;
      line-height: 1.2;
    }

    .event-date-blue {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 28px;
      color: #1d4ed8;
      letter-spacing: 0.8px;
      line-height: 1.1;
    }

    .event-date-green {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 28px;
      color: #16a34a;
      letter-spacing: 0.8px;
      line-height: 1.1;
    }

    /* Footer chính thức: Left-aligned thẳng hàng với logo và nội dung bên trên */
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: ${footerHeight}px;
      background: #ffffff;
      border-top: 1.2px solid #e2e8f0;
      padding: 0 55px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }

    .footer-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      gap: 4px;
    }

    .footer-school {
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 700;
      font-size: 15px;
      color: #0f172a;
      text-align: left;
      line-height: 1.2;
    }

    .footer-address {
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 400;
      font-size: 13.5px;
      color: #64748b;
      text-align: left;
      line-height: 1.2;
    }

    .footer-domain {
      font-family: 'Unbounded', sans-serif;
      font-weight: 800;
      font-size: 17px;
      color: #1d4ed8;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div class="top-bar"></div>

  <!-- Hero Photo Container -->
  <div class="hero-container">
    <img class="hero-img" src="data:image/webp;base64,${heroB64}" alt="Khuôn viên THPT Nguyễn Công Trứ">
  </div>
  <div class="hero-fade"></div>

  <!-- Main Content Area -->
  <div class="content-area">
    <!-- Header Row (Google Sans Flex) -->
    <div class="header-row">
      <img class="school-logo" src="data:image/webp;base64,${schoolLogoB64}" alt="Logo Trường">
      <div class="divider-v"></div>
      <img class="logo-40th" src="data:image/webp;base64,${logo40thB64}" alt="Logo 40 Năm">
      <div class="header-text">
        <span class="header-school-name">TRƯỜNG THPT NGUYỄN CÔNG TRỨ</span>
        <span class="header-anniversary">KỶ NIỆM 40 NĂM THÀNH LẬP (1986 - 2026)</span>
      </div>
    </div>

    <div class="divider-h"></div>

    <!-- Title Block (3 dòng: Chuỗi chương trình [Google Sans Bold], Kỷ niệm 40 năm thành lập [Unbounded], THPT Nguyễn Công Trứ [Unbounded]) -->
    <div class="title-block">
      <div class="title-kicker">CHUỖI CHƯƠNG TRÌNH</div>
      <div class="title-main-black">KỶ NIỆM 40 NĂM THÀNH LẬP</div>
      <div class="title-main-blue">THPT NGUYỄN CÔNG TRỨ</div>
    </div>

    <!-- Events Stack (Khoảng cách chia đều, Tên sự kiện Unbounded nổi bật, Số ngày tháng Montserrat) -->
    <div class="events-stack">
      <!-- Event 1: Ngày Trở Về -->
      <div class="event-row">
        <div class="icon-box-blue">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="18" rx="4" stroke="#1d4ed8" stroke-width="2"/>
            <line x1="2" y1="9" x2="22" y2="9" stroke="#1d4ed8" stroke-width="1.8"/>
            <line x1="7" y1="1" x2="7" y2="6" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round"/>
            <line x1="17" y1="1" x2="17" y2="6" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="15" r="2.2" fill="#1d4ed8"/>
          </svg>
        </div>
        <div class="event-text">
          <span class="event-label">NGÀY TRỞ VỀ · CỰU HỌC SINH</span>
          <span class="event-date-blue">08 / 11 / 2026</span>
        </div>
      </div>

      <!-- Event 2: Đại Lễ Kỷ Niệm 40 Năm -->
      <div class="event-row">
        <div class="icon-box-green">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="19" rx="4" stroke="#16a34a" stroke-width="2"/>
            <path d="M12 6.5L13.7 10.2L17.7 10.6L14.7 13.4L15.5 17.3L12 15.3L8.5 17.3L9.3 13.4L6.3 10.6L10.3 10.2Z" fill="#16a34a"/>
          </svg>
        </div>
        <div class="event-text">
          <span class="event-label">ĐẠI LỄ KỶ NIỆM 40 NĂM</span>
          <span class="event-date-green">15 / 11 / 2026</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer (Left-aligned thẳng hàng với lề 55px) -->
  <div class="footer">
    <div class="footer-left">
      <div class="footer-school">Trường THPT Nguyễn Công Trứ</div>
      <div class="footer-address">97 Quang Trung, Phường Thông Tây Hội, TP. Hồ Chí Minh</div>
    </div>
    <div class="footer-domain">40namnctru.nctitc.io.vn</div>
  </div>
</body>
</html>
`;

  const htmlPath = path.resolve("scripts/perfect-og-banner.html");
  fs.writeFileSync(htmlPath, htmlContent);

  // 4. Gọi Microsoft Edge Headless chụp ảnh 1200x630
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\EdgeCore\\155.0.4283.45\\msedge.exe";
  const tempScreenshot = path.resolve("public/images/temp-edge-banner.png");
  const fileUrl = "file:///" + htmlPath.replace(/\\/g, "/");
  const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${tempScreenshot}" --window-size=${width},${height} "${fileUrl}"`;

  execSync(cmd, { stdio: "pipe" });

  // 5. Cắt đúng kích thước 1200x630 và xuất bản cả PNG và JPG chất lượng cao
  await sharp(tempScreenshot)
    .extract({ left: 0, top: 0, width, height })
    .png({ quality: 98 })
    .toFile("public/images/og-share.png");

  await sharp("public/images/og-share.png")
    .jpeg({ quality: 92 })
    .toFile("public/images/og-share.jpg");

  // Dọn dẹp file tạm
  if (fs.existsSync(tempScreenshot)) fs.unlinkSync(tempScreenshot);
  if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);

  console.log("Successfully generated balanced OG banner with Google Sans header, Montserrat dates, and left-aligned footer!");
}

generatePerfectOgBannerWithEdge().catch(console.error);
