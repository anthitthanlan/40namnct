import { redirect } from "next/navigation";

/**
 * @deprecated Trang này đã được thay thế bởi /xac-nhan-dong-gop
 * Giữ lại để hỗ trợ redirect cho link cũ.
 */
export default async function PaymentLegacyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = params.id;
  if (id) {
    redirect(`/xac-nhan-dong-gop?id=${id}`);
  } else {
    redirect("/dang-ky");
  }
}
