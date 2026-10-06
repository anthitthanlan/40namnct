import NctMotionWrapper from "@/components/NctMotionWrapper";

export const metadata = {
  title: "NCT Logo Breakdown - 40 năm Nguyễn Công Trứ",
  description: "Phân rã logo THPT Nguyễn Công Trứ – motion graphics theo thao tác cuộn.",
};

export default function NctMotionPage() {
  return (
    <main style={{ background: "#03050b", minHeight: "100vh" }}>
      <NctMotionWrapper />
    </main>
  );
}
