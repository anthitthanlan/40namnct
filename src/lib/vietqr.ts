/** Thông tin tài khoản tiếp nhận đóng góp - Theo thư ngỏ Ban Tổ chức */
export const BANK = {
  /** Mã BIN Vietcombank */
  bin: "970436",
  account: "1067816889",
  shortName: "Vietcombank",
  accountName: "TRUONG THPT NGUYEN CONG TRU",
} as const;

/**
 * Ảnh QR VietQR từ dịch vụ public img.vietqr.io
 * (https://img.vietqr.io/image/<BIN>-<STK>-<template>.png?amount=&addInfo=&accountName=)
 */
export function vietqrUrl(amount: number, addInfo: string): string {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: BANK.accountName,
  });
  return `https://img.vietqr.io/image/${BANK.bin}-${BANK.account}-compact2.png?${params.toString()}`;
}
