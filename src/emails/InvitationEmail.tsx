import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Link,
} from "@react-email/components";

interface InvitationEmailProps {
  name: string;
  amount: number;
  invitationId: string;
  nienKhoa?: string;
  phone?: string;
  appUrl: string;
  type?: "Cá nhân" | "Tập thể";
  shirts?: Record<string, number>;
}

export const InvitationEmail = ({
  name = "Cựu học sinh",
  amount = 500000,
  invitationId = "sample-id",
  nienKhoa = "Không rõ",
  phone = "",
  appUrl = "https://40namnctru.nctitc.io.vn",
  type = "Cá nhân",
  shirts = {},
}: InvitationEmailProps) => {
  const ticketUrl = `${appUrl}/thu-moi?id=${invitationId}`;

  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Beau+Rivage&family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>Thiệp mời tham dự Lễ Kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={introText}>
            <strong>Kính gửi Cựu học sinh {name},</strong>
            <br /><br />
            Nhằm ôn lại truyền thống 40 năm xây dựng và phát triển, tri ân các thế hệ Thầy Cô và tạo dịp hội ngộ, kết nối các thế hệ, Trường THPT Nguyễn Công Trứ trân trọng kính mời bạn về tham dự Ngày hội truyền thống 40 năm của Nhà trường.
            <br /><br />
            Ban Tổ chức xin chân thành cảm ơn bạn đã đóng góp <strong>{amount.toLocaleString("vi-VN")}đ</strong> để góp phần tạo nên một ngày hội thật ý nghĩa.
            <br />
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              * Lưu ý: Khoản đóng góp tham dự là 500.000đ/người. Toàn bộ kinh phí sẽ được sử dụng cho công tác tổ chức sự kiện (nếu có dư sẽ được đưa vào Quỹ Khuyến học của Trường).
            </span>
            <br /><br />
            Rất mong được đón tiếp bạn trở lại dưới mái trường xưa vào ngày 08/11/2026!
            <br /><br />
            Vui lòng nhấn vào nút bên dưới để xem và tải vé điện tử tham dự sự kiện của bạn.
          </Text>

          <Section style={actionContainer}>
            <Text style={subActionText}>
              Vé điện tử của bạn được cung cấp tại liên kết dưới đây. Vui lòng mở ra, lưu lại hình ảnh vé và xuất trình mã QR khi check-in.
            </Text>
            <Link
              href={ticketUrl}
              style={{
                display: "inline-block",
                backgroundColor: "#047857",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "15px",
                padding: "12px 28px",
                borderRadius: "999px",
                textDecoration: "none",
              }}
            >
              Xem / Tải vé online
            </Link>
            <Text style={subActionText}>
              Hoặc mở liên kết: <br />
              <Link href={ticketUrl} style={{ color: "#2563eb", wordBreak: "break-all" }}>{ticketUrl}</Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={registrationContainer}>
            <Text style={registrationTitle}>
              <span style={{ color: "#059669", marginRight: "8px" }}>✓</span>
              Chi tiết đăng ký
            </Text>

            <Row style={regRow}>
              <Column style={regLabel}>Loại đăng ký</Column>
              <Column style={regValue}>{type}</Column>
            </Row>

            {Object.keys(shirts).length > 0 && (
              <Row style={regRow}>
                <Column style={{ ...regLabel, verticalAlign: "top", paddingTop: "4px" }}>Số lượng áo đăng ký</Column>
                <Column style={regValue}>
                  {Object.entries(shirts).map(([size, qty]) => (
                    <div key={size} style={{ marginBottom: "4px" }}>
                      Size {size} <span style={{ color: "#9ca3af", fontWeight: "normal", marginLeft: "8px" }}>x {qty}</span>
                    </div>
                  ))}
                </Column>
              </Row>
            )}

            <Row style={{ ...regRow, borderBottom: "none", paddingTop: "12px" }}>
              <Column style={{ ...regLabel, color: "#111827", fontWeight: "bold" }}>Thành tiền</Column>
              <Column style={regTotal}>
                {amount.toLocaleString("vi-VN")}đ
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InvitationEmail;

// --- Styles ---
const main = {
  backgroundColor: "#f8fafc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  padding: "20px 0",
};

const container = {
  margin: "0 auto",
  maxWidth: "600px",
  padding: "20px",
};

const introText = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#334155",
  margin: "16px 0 30px",
  textAlign: "left" as const,
};

// --- Ticket Styles ---
const ticketContainer = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  margin: "0 auto",
  maxWidth: "380px",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  overflow: "hidden",
};

const ticketContentWrapper = {
  padding: "24px",
  borderRadius: "24px",
};

const ticketHeader = {
  borderBottom: "1px solid rgba(229, 231, 235, 0.5)",
  paddingBottom: "12px",
  marginBottom: "16px",
};

const headerTitle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#1e3a8a",
  margin: "0",
  lineHeight: "1.4",
  textTransform: "uppercase" as const,
};

const qrContainer = {
  textAlign: "center" as const,
  marginBottom: "16px",
};

const qrBorder = {
  display: "inline-block",
  padding: "10px",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  backgroundColor: "#ffffff",
};

const slogan = {
  fontFamily: "'Beau Rivage', Georgia, cursive",
  fontSize: "36px",
  color: "#047857",
  textAlign: "center" as const,
  margin: "0 0 16px 0",
  lineHeight: "1",
};

const infoContainer = {
  paddingTop: "8px",
};

const infoLine = {
  fontSize: "14px",
  margin: "0 0 6px 0",
  color: "#1f2937",
};

const infoLabel = {
  display: "inline-block",
  width: "110px",
  color: "#4b5563",
};

const infoValue = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: "16px",
  fontWeight: "bold",
  color: "#111827",
};

const infoValueNorm = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: "bold",
  color: "#111827",
};

const timeLocationContainer = {
  borderTop: "1px solid rgba(229, 231, 235, 0.7)",
  marginTop: "16px",
  paddingTop: "16px",
};

const timeLine = {
  marginBottom: "12px",
};

const tlLabel = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  margin: "0 0 2px 0",
};

const tlValue = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: "14px",
  fontWeight: "500",
  color: "#1f2937",
  margin: "0",
};

const warningContainer = {
  borderTop: "1px solid rgba(229, 231, 235, 0.7)",
  marginTop: "16px",
  paddingTop: "16px",
  textAlign: "center" as const,
};

const warningText = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: "#dc2626",
  fontSize: "14px",
  margin: "0",
};

// --- End Ticket ---

const actionContainer = {
  textAlign: "center" as const,
  marginTop: "30px",
};

const subActionText = {
  fontSize: "13px",
  color: "#64748b",
  marginTop: "16px",
  lineHeight: "1.5",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "30px 0",
};

const registrationContainer = {
  backgroundColor: "#f8fafc",
  padding: "24px",
  borderRadius: "16px",
  marginBottom: "30px",
};

const registrationTitle = {
  fontSize: "20px",
  fontWeight: "900",
  color: "#111827",
  margin: "0 0 24px 0",
};

const regRow = {
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: "16px",
  marginBottom: "16px",
  width: "100%",
};

const regLabel = {
  fontSize: "15px",
  color: "#6b7280",
  fontWeight: "500",
  width: "50%",
};

const regValue = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#111827",
  textAlign: "right" as const,
  width: "50%",
};

const regTotal = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#059669",
  textAlign: "right" as const,
  width: "50%",
};

const footer = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#94a3b8",
  textAlign: "center" as const,
};
