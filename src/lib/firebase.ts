import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Ưu tiên dùng chuỗi JSON toàn bộ
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = cert(serviceAccount);
    } catch (error) {
      console.error("Lỗi parse FIREBASE_SERVICE_ACCOUNT JSON:", error);
    }
  } 
  
  if (!credential) {
    // Fallback: Dùng biến môi trường rời rạc
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Chuyển đổi escaped newline (\n) sang newline thực
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      credential = cert({
        projectId,
        clientEmail,
        privateKey,
      });
    }
  }

  // Nếu vẫn không có credential, dùng Default
  if (!credential) {
    credential = applicationDefault();
  }

  initializeApp({ credential });
}

export const db = getFirestore();
