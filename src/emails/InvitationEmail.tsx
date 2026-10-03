import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";

interface InvitationEmailProps {
  name: string;
  amount: number;
  invitationCode: string;
  appUrl: string;
}

export const InvitationEmail = ({
  name = "Cựu học sinh",
  amount = 500000,
  invitationCode = "NCT123456",
  appUrl = "https://nctitc.io.vn",
}: InvitationEmailProps) => {
  const ticketUrl = `${appUrl}/thu-moi?code=${invitationCode}`;

  return (
    <Html>
      <Head />
      <Preview>Thiệp mời tham dự Lễ Kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${appUrl}/logo.png`}
              width="60"
              height="60"
              alt="NCT Logo"
              style={logo}
            />
            <Heading style={heading}>Lễ Kỷ Niệm 40 Năm</Heading>
            <Text style={subheading}>THPT Nguyễn Công Trứ (1986 - 2026)</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Thân gửi {name},</Text>
            <Text style={paragraph}>
              Ban Tổ chức xin gửi lời cảm ơn chân thành nhất đến bạn vì đã đóng góp 
              <strong> {amount.toLocaleString("vi-VN")}đ</strong> cho quỹ tổ chức Lễ kỷ niệm 40 năm thành lập trường.
            </Text>
            <Text style={paragraph}>
              Sự ủng hộ của bạn góp phần rất lớn làm nên thành công của sự kiện. 
              Trân trọng kính mời bạn về tham dự Lễ kỷ niệm để cùng ôn lại những kỷ niệm đẹp 
              dưới mái trường xưa.
            </Text>
            
            <Section style={ticketSection}>
              <Text style={ticketLabel}>MÃ VÉ CỦA BẠN</Text>
              <Text style={ticketCode}>{invitationCode}</Text>
              <Button style={button} href={ticketUrl}>
                Mở Thiệp Mời Online
              </Button>
            </Section>

            <Hr style={hr} />
            
            <Text style={footer}>
              Thời gian: 04/10/2026<br />
              Địa điểm: Trường THPT Nguyễn Công Trứ<br />
              97 Quang Trung, Phường 8, Gò Vấp, TP.HCM
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InvitationEmail;

// --- Styles ---
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "40px auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#1e3a8a", // blue-900
  padding: "40px 20px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto 20px",
};

const heading = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 10px",
};

const subheading = {
  color: "#93c5fd", // blue-300
  fontSize: "16px",
  margin: "0",
};

const content = {
  padding: "40px 40px",
};

const greeting = {
  fontSize: "20px",
  color: "#1f2937",
  fontWeight: "600",
  marginBottom: "20px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#4b5563",
  marginBottom: "20px",
};

const ticketSection = {
  backgroundColor: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: "8px",
  padding: "30px",
  textAlign: "center" as const,
  margin: "30px 0",
};

const ticketLabel = {
  fontSize: "14px",
  color: "#64748b",
  fontWeight: "600",
  letterSpacing: "2px",
  margin: "0 0 10px",
};

const ticketCode = {
  fontSize: "32px",
  color: "#1e3a8a",
  fontWeight: "bold",
  letterSpacing: "4px",
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "9999px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "30px 0",
};

const footer = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#64748b",
  textAlign: "center" as const,
};
