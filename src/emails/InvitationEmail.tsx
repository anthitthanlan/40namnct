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
  invitationCode: string;
  nienKhoa?: string;
  phone?: string;
  appUrl: string;
  type?: "Cá nhân" | "Tập thể";
  shirts?: Record<string, number>;
}

export const InvitationEmail = ({
  name = "Cựu học sinh",
  amount = 500000,
  invitationCode = "sample",
  nienKhoa = "Không rõ",
  phone = "",
  appUrl = "https://40namnctru.nctitc.io.vn",
  type = "Cá nhân",
  shirts = {},
}: InvitationEmailProps) => {
  const ticketUrl = `${appUrl}/thu-moi?code=${invitationCode}`;
  const qrText = `${name} - ${phone} - ${invitationCode}`;
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrText)}&size=250&margin=2`;

  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Beau+Rivage&family=Prata&display=swap"
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
            Dưới đây là vé điện tử của bạn để tham dự sự kiện:
          </Text>

          {/* BẮT ĐẦU VÉ MỜI */}
          <Section style={{ ...ticketContainer, backgroundImage: `url('${appUrl}/invitation%20background%20image/thu-moi-NCT-anh-nen.webp')` }}>
            <div style={ticketContentWrapper}>

              {/* Header Logos */}
              <Row style={ticketHeader}>
                <Column style={{ width: "85px" }}>
                  <Img src={`${appUrl}/images/logo_nct.webp`} width="40" height="40" alt="NCT Logo" style={{ display: "inline-block", marginRight: "4px" }} />
                  <Img src={`${appUrl}/images/Logo_40th_NCT.webp`} width="40" height="40" alt="40th Logo" style={{ display: "inline-block" }} />
                </Column>
                <Column>
                  <Text style={headerTitle}>KỈ NIỆM 40 NĂM THÀNH LẬP</Text>
                  <Text style={headerTitle}>TRƯỜNG THPT NGUYỄN CÔNG TRỨ</Text>
                </Column>
              </Row>

              {/* QR Code */}
              <Section style={qrContainer}>
                <div style={qrBorder}>
                  <Img src={qrUrl} width="160" height="160" alt="QR Code" style={{ display: "block", margin: "0 auto", borderRadius: "8px" }} />
                </div>
              </Section>

              {/* Slogan */}
              <Text style={slogan}>Memories Alive Again</Text>

              {/* User Info */}
              <Section style={infoContainer}>
                <Text style={infoLine}>
                  <strong style={infoLabel}>Cựu học sinh:</strong>
                  <span style={infoValue}>{name}</span>
                </Text>
                <Text style={infoLine}>
                  <strong style={infoLabel}>Niên khóa:</strong>
                  <span style={infoValueNorm}>{nienKhoa}</span>
                </Text>
                <Text style={infoLine}>
                  <strong style={infoLabel}>SĐT:</strong>
                  <span style={infoValueNorm}>{phone}</span>
                </Text>
              </Section>

              {/* Time and Location */}
              <Section style={timeLocationContainer}>
                <Row style={timeLine}>
                  <Column>
                    <Text style={tlLabel}>Thời gian:</Text>
                    <Text style={tlValue}>08:00 - 08/11/2026</Text>
                  </Column>
                </Row>
                <Row style={timeLine}>
                  <Column>
                    <Text style={tlLabel}>Địa điểm:</Text>
                    <Text style={tlValue}>Trường THPT Nguyễn Công Trứ</Text>
                  </Column>
                </Row>
              </Section>

              {/* Warning Footer */}
              <Section style={warningContainer}>
                <Text style={warningText}>Vui lòng không chia sẻ thư mời này cho bất kì ai!</Text>
              </Section>

            </div>
          </Section>
          {/* KẾT THÚC VÉ MỜI */}

          <Section style={actionContainer}>
            <Text style={subActionText}>
              Xem vé online: <br />
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
  fontFamily: "'Prata', Georgia, serif",
  fontSize: "16px",
  fontWeight: "bold",
  color: "#111827",
};

const infoValueNorm = {
  fontFamily: "'Prata', Georgia, serif",
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
  fontFamily: "'Prata', Georgia, serif",
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
  fontFamily: "'Prata', Georgia, serif",
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
