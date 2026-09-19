/**
 * AI OCR Engine — Trích xuất thông tin biên lai chuyển khoản ngân hàng VN
 *
 * Dual provider với auto-fallback:
 *   1. Ollama (self-hosted, ưu tiên khi sẵn sàng)
 *   2. OpenRouter (cloud, fallback — tương thích OpenAI API)
 *
 * Trích xuất 3 trường quan trọng: Số tiền, Nội dung CK, Thời gian giao dịch
 */

// ============================================================
// Types
// ============================================================

export type OcrRawResult = {
  /** Số tiền giao dịch (VND) — null nếu không đọc được */
  amount: number | null;
  /** Nội dung chuyển khoản (đúng như hiển thị trong biên lai) */
  content: string | null;
  /** Thời gian giao dịch (chuỗi gốc từ biên lai) */
  time: string | null;
  /** Mã giao dịch / Số tham chiếu (nếu có) */
  transactionId: string | null;
  /** Trạng thái giao dịch */
  transactionStatus: "success" | "pending" | "failed" | "unknown";
  /** Toàn bộ text OCR thô (debug) */
  rawText: string;
  /** Provider đã dùng */
  provider: "ollama" | "openrouter" | "lmstudio" | "mock";
};

export type ConfidenceLevel = "high" | "low" | "mismatch" | "system_error";

export type MatchResult = {
  confidence: ConfidenceLevel;
  /** Chi tiết: từng trường khớp hay không */
  amountMatch: boolean;
  contentMatch: boolean;
  /** Giá trị AI trích xuất */
  extractedAmount: number | null;
  extractedContent: string | null;
  extractedTime: string | null;
  /** Ghi chú thêm để hiển thị cho Admin */
  note: string;
};

export type ReceiptVerifyResult = {
  ocrResult: OcrRawResult;
  matchResult: MatchResult;
};

// ============================================================
// Prompt
// ============================================================

const SYSTEM_PROMPT = `Bạn là hệ thống OCR chuyên trích xuất thông tin từ ảnh biên lai chuyển khoản ngân hàng Việt Nam.
Nhiệm vụ: Đọc ảnh và trả về JSON với đúng 4 trường bên dưới.
Quy tắc bắt buộc:
- CHỈ trả về JSON thuần túy, không thêm markdown, không giải thích, không text khác.
- Nếu không đọc được một trường nào, trả về null cho trường đó (không được đoán mò).
- Trường "amount": chỉ lấy số nguyên VND, bỏ tất cả ký tự không phải số (dấu chấm, dấu phẩy, chữ "VND", "đ", "VNĐ").
- Trường "content": sao chép chính xác chuỗi nội dung chuyển khoản như hiển thị trong biên lai.
- Trường "time": sao chép chính xác chuỗi thời gian giao dịch như hiển thị trong biên lai.
- Trường "transactionId": quét tìm và trả về chuỗi 'Mã giao dịch' hoặc 'Số tham chiếu' (VD: 681006, 6259BIDVE26ELVUF) như trong ảnh biên lai. Trả về null nếu không thấy.
- Trường "transactionStatus": xác định trạng thái giao dịch trong ảnh. Trả về "success" nếu là biên lai đã chuyển tiền thành công, "pending" nếu là màn hình xác nhận trước khi bấm chuyển, "failed" nếu chuyển lỗi, hoặc "unknown" nếu không rõ.`;

const USER_PROMPT = `Trích xuất thông tin từ ảnh biên lai chuyển khoản này.
Trả về JSON có đúng cấu trúc:
{"amount": <số nguyên VND hoặc null>, "content": "<nội dung CK hoặc null>", "time": "<thời gian hoặc null>", "transactionId": "<mã giao dịch hoặc null>", "transactionStatus": "<success|pending|failed|unknown>"}`;

// ============================================================
// Config helpers
// ============================================================

function getOllamaConfig() {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2-vision:11b",
    apiKey: process.env.OLLAMA_API_KEY || "",
  };
}

function getOpenRouterConfig() {
  return {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model:
      process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it",
    baseUrl: "https://openrouter.ai/api/v1",
  };
}

function getLmStudioConfig() {
  return {
    baseUrl: process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1",
    model: process.env.LMSTUDIO_MODEL || "local-model",
  };
}

function getPreferredProvider(): "ollama" | "openrouter" | "lmstudio" {
  const v = process.env.AI_OCR_PROVIDER?.toLowerCase();
  return v === "ollama" ? "ollama" : v === "lmstudio" ? "lmstudio" : "openrouter";
}

// ============================================================
// Ollama Provider
// ============================================================

async function checkOllamaHealth(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function extractWithOllama(
  imageBase64: string,
  mimeType: string,
): Promise<OcrRawResult> {
  const cfg = getOllamaConfig();

  const body = {
    model: cfg.model,
    system: SYSTEM_PROMPT,
    prompt: USER_PROMPT,
    images: [imageBase64],
    format: "json",
    stream: false,
    options: {
      temperature: 0,
      num_predict: 2048,
    },
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey) {
    headers["Authorization"] = `Bearer ${cfg.apiKey}`;
  }

  const res = await fetch(`${cfg.baseUrl}/api/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000), // 60s timeout
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as { response?: string };
  const rawText = data.response || "";
  return parseOcrJson(rawText, "ollama");
}

// ============================================================
// OpenRouter Provider (OpenAI-compatible)
// ============================================================

async function extractWithOpenRouter(
  imageBase64: string,
  mimeType: string,
): Promise<OcrRawResult> {
  const cfg = getOpenRouterConfig();

  if (!cfg.apiKey) {
    throw new Error("OPENROUTER_API_KEY chưa được cấu hình trong .env.local");
  }

  const dataUri = `data:${mimeType};base64,${imageBase64}`;

  const body = {
    model: cfg.model,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: dataUri },
          },
          {
            type: "text",
            text: USER_PROMPT,
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  };

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      "HTTP-Referer": "https://40namnct.com",
      "X-Title": "NCT 40th Anniversary - Receipt OCR",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error: ${res.status} — ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = data.choices?.[0]?.message?.content || "";
  return parseOcrJson(rawText, "openrouter");
}

// ============================================================
// LM Studio Provider (OpenAI-compatible)
// ============================================================

async function checkLmStudioHealth(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/models`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function extractWithLmStudio(
  imageBase64: string,
  mimeType: string,
): Promise<OcrRawResult> {
  const cfg = getLmStudioConfig();
  const dataUri = `data:${mimeType};base64,${imageBase64}`;

  const body = {
    model: cfg.model,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: dataUri },
          },
          {
            type: "text",
            text: USER_PROMPT,
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 2048,
  };

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`LM Studio error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = data.choices?.[0]?.message?.content || "";
  return parseOcrJson(rawText, "lmstudio");
}

// ============================================================
// JSON parser (shared)
// ============================================================

function parseOcrJson(
  rawText: string,
  provider: OcrRawResult["provider"],
): OcrRawResult {
  // Cố gắng extract JSON từ text (đề phòng model trả thêm text thừa)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

  try {
    const parsed = JSON.parse(jsonStr) as {
      amount?: unknown;
      content?: unknown;
      time?: unknown;
      transactionId?: unknown;
      transactionStatus?: unknown;
    };

    const amount =
      typeof parsed.amount === "number"
        ? Math.round(Math.abs(parsed.amount))
        : parsed.amount === null
          ? null
          : typeof parsed.amount === "string" && parsed.amount !== "null"
            ? parseInt(String(parsed.amount).replace(/\D/g, ""), 10) || null
            : null;

    const content =
      typeof parsed.content === "string" && parsed.content !== "null"
        ? parsed.content.trim()
        : null;

    const time =
      typeof parsed.time === "string" && parsed.time !== "null"
        ? parsed.time.trim()
        : null;

    const transactionId =
      typeof parsed.transactionId === "string" && parsed.transactionId !== "null"
        ? parsed.transactionId.trim()
        : null;

    const transactionStatus =
      typeof parsed.transactionStatus === "string" && ["success", "pending", "failed", "unknown"].includes(parsed.transactionStatus)
        ? (parsed.transactionStatus as "success" | "pending" | "failed" | "unknown")
        : "unknown";

    return { amount, content, time, transactionId, transactionStatus, rawText, provider };
  } catch {
    console.warn("[OCR] Failed to parse JSON from model output:", rawText.slice(0, 200));
    return { amount: null, content: null, time: null, transactionId: null, transactionStatus: "unknown", rawText, provider };
  }
}

// ============================================================
// Auto-select provider with fallback
// ============================================================

async function extractReceipt(
  imageBase64: string,
  mimeType: string,
): Promise<OcrRawResult> {
  const preferred = getPreferredProvider();

  const order: Array<"ollama" | "openrouter" | "lmstudio"> = [];
  if (preferred === "lmstudio") {
    order.push("lmstudio", "openrouter", "ollama");
  } else if (preferred === "ollama") {
    order.push("ollama", "openrouter", "lmstudio");
  } else {
    order.push("openrouter", "lmstudio", "ollama");
  }

  let lastErr: unknown;
  for (const provider of order) {
    if (provider === "lmstudio") {
      const cfg = getLmStudioConfig();
      if (await checkLmStudioHealth(cfg.baseUrl)) {
        try {
          return await extractWithLmStudio(imageBase64, mimeType);
        } catch (err) {
          lastErr = err;
          console.warn("[OCR] LM Studio failed, trying next fallback:", err);
        }
      } else {
        console.info("[OCR] LM Studio not available, falling back.");
      }
    }
    
    if (provider === "ollama") {
      const cfg = getOllamaConfig();
      if (await checkOllamaHealth(cfg.baseUrl)) {
        try {
          return await extractWithOllama(imageBase64, mimeType);
        } catch (err) {
          lastErr = err;
          console.warn("[OCR] Ollama failed, trying next fallback:", err);
        }
      } else {
        console.info("[OCR] Ollama not available, falling back.");
      }
    }
    
    if (provider === "openrouter") {
      try {
        return await extractWithOpenRouter(imageBase64, mimeType);
      } catch (err) {
        lastErr = err;
        console.warn("[OCR] OpenRouter failed, trying next fallback:", err);
      }
    }
  }

  console.error("[OCR] All providers failed. Last error:", lastErr);
  return { amount: null, content: null, time: null, transactionId: null, transactionStatus: "unknown", rawText: "", provider: "openrouter" };
}

// ============================================================
// Match Logic
// ============================================================

/**
 * Chuẩn hóa chuỗi để so sánh: uppercase, bỏ ký tự đặc biệt, bỏ dấu tiếng Việt
 */
function normalizeForMatch(str: string): string {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "D")
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

/**
 * So khớp kết quả OCR với thông tin vé
 *
 * confidence:
 *   "high"     — Cả số tiền VÀ nội dung CK khớp → auto-confirm
 *   "low"      — Chỉ 1 trong 2 khớp → pending_approval (Admin duyệt)
 *   "mismatch" — Không khớp gì → yêu cầu upload lại
 */
export function matchReceiptToTicket(
  ocr: OcrRawResult,
  expected: {
    amount: number;
    /** Nội dung CK dự kiến: tên + niên khóa + SĐT (đã loại dấu) */
    addInfo: string;
    /** Mã vé để match thêm nếu có */
    ticketCode: string;
  },
): MatchResult {
  // --- So khớp số tiền ---
  // Cho phép chênh lệch ≤ 1.000đ (lẻ nhập sai)
  const amountMatch =
    ocr.amount !== null && Math.abs(ocr.amount - expected.amount) <= 1000;

  // --- So khớp nội dung CK ---
  // Chuẩn hóa cả 2 phía, rồi kiểm tra xem:
  // - Nội dung biên lai chứa addInfo (tên+SĐT)
  // - HOẶC chứa mã vé ticketCode
  let contentMatch = false;
  if (ocr.content) {
    const normalizedOcr = normalizeForMatch(ocr.content);
    const normalizedExpected = normalizeForMatch(expected.addInfo);
    const normalizedCode = normalizeForMatch(expected.ticketCode);

    // Match nếu OCR content chứa ít nhất 70% ký tự của addInfo
    // (đề phòng bank cắt bớt nội dung hiển thị)
    const containsAddInfo = normalizedOcr.includes(normalizedExpected) ||
      (normalizedExpected.length > 6 &&
        normalizedOcr.includes(normalizedExpected.slice(0, Math.floor(normalizedExpected.length * 0.7))));

    const containsCode = normalizedCode.length > 0 && normalizedOcr.includes(normalizedCode);

    contentMatch = containsAddInfo || containsCode;
  }

  // --- Tính confidence ---
  let confidence: ConfidenceLevel;
  let note: string;

  if (ocr.rawText === "") {
    confidence = "system_error";
    note = "Lỗi hệ thống: AI không phản hồi hoặc không thể kết nối.";
  } else if (ocr.transactionStatus === "pending") {
    confidence = "mismatch";
    note = "Ảnh chụp màn hình trước khi chuyển tiền (chưa giao dịch thành công).";
  } else if (ocr.transactionStatus === "failed") {
    confidence = "mismatch";
    note = "Giao dịch chuyển tiền thất bại.";
  } else if (amountMatch && contentMatch) {
    confidence = "high";
    note = `Khớp hoàn toàn: ${ocr.amount?.toLocaleString("vi-VN")}đ · Nội dung CK hợp lệ`;
  } else if (amountMatch && !contentMatch) {
    confidence = "low";
    note = `Số tiền khớp (${ocr.amount?.toLocaleString("vi-VN")}đ) nhưng nội dung CK không khớp. AI đọc: "${ocr.content || "không đọc được"}"`;
  } else if (!amountMatch && contentMatch) {
    confidence = "low";
    note = `Nội dung CK khớp nhưng số tiền không khớp. AI đọc: ${ocr.amount?.toLocaleString("vi-VN") || "không đọc được"}đ (expected ${expected.amount.toLocaleString("vi-VN")}đ)`;
  } else {
    confidence = "mismatch";
    const amountInfo = ocr.amount !== null
      ? `${ocr.amount.toLocaleString("vi-VN")}đ (expected ${expected.amount.toLocaleString("vi-VN")}đ)`
      : "không đọc được";
    note = `Không khớp. Số tiền: ${amountInfo}. Nội dung CK AI đọc: "${ocr.content || "không đọc được"}"`;
  }

  return {
    confidence,
    amountMatch,
    contentMatch,
    extractedAmount: ocr.amount,
    extractedContent: ocr.content,
    extractedTime: ocr.time,
    note,
  };
}

// ============================================================
// Main export — dùng trong API route
// ============================================================

export async function verifyReceipt(
  imageBase64: string,
  mimeType: string,
  expected: {
    amount: number;
    addInfo: string;
    ticketCode: string;
  },
): Promise<ReceiptVerifyResult> {
  const ocrResult = await extractReceipt(imageBase64, mimeType);
  const matchResult = matchReceiptToTicket(ocrResult, expected);
  return { ocrResult, matchResult };
}
