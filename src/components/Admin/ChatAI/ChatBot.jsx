// src/ChatAI/ChatBot.js
export async function fetchVocabulary(topic, count = 1, langSrc = "vi", langDst = "en") {
  const apiKey = import.meta.env.VITE_API_CHATBOT_KEY;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1:free",
      temperature: 0.2, // giảm "bay"
      messages: [
        {
          role: "user",
          content:
            `Tạo CHÍNH XÁC ${count} cặp thẻ JSON theo chủ đề "${topic}". ` +
            `- "tu": từ/phrase ở ngôn ngữ gốc (${langSrc}). ` +
            `- "nghia": bản dịch ở ngôn ngữ muốn học (${langDst}). ` +
            `Trả về DUY NHẤT một JSON array thuần: ` +
            `[{"tu":"...","nghia":"..."}]. ` +
            `KHÔNG dùng \`\`\`, KHÔNG thêm chữ nào khác.`,
        },
      ],
    }),
  });

  // Nếu HTTP fail: trả mảng rỗng (giữ nguyên pattern cũ)
  if (!res.ok) {
    console.error("OpenRouter HTTP error:", res.status);
    return [];
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "[]";

  // 1) DeepSeek R1 hay chèn <think>...</think> → loại bỏ trước
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  // 2) Thử parse trực tiếp; nếu fail, bóc JSON lớn nhất trong chuỗi rồi parse
  let parsed = [];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const extracted = extractTopLevelJSON(cleaned);
    try {
      parsed = JSON.parse(extracted);
    } catch (e2) {
      console.error("Lỗi parse JSON:", e2, raw);
      parsed = [];
    }
  }

  // 3) Chuẩn hoá và CẮT đúng số lượng yêu cầu
  const list = (Array.isArray(parsed) ? parsed : [])
    .map((x) => ({
      tu: (x?.tu ?? x?.question ?? x?.word ?? x?.front ?? "").toString().trim(),
      nghia: (x?.nghia ?? x?.answer ?? x?.meaning ?? x?.back ?? "").toString().trim(),
    }))
    .filter((x) => x.tu && x.nghia)
    .slice(0, Number(count) || 1);

  return list;

  // ===== Helpers (nhỏ gọn, không đổi cấu trúc gọi) =====
  function extractTopLevelJSON(s) {
    if (!s) return "[]";
    const arr = byBrackets(s, "[", "]");
    if (arr) return arr;
    const obj = byBrackets(s, "{", "}");
    return obj || "[]";
  }
  function byBrackets(s, open, close) {
    let start = -1, depth = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === open) { if (depth === 0) start = i; depth++; }
      else if (ch === close) {
        depth = Math.max(0, depth - 1);
        if (depth === 0 && start !== -1) {
          const cand = s.slice(start, i + 1);
          try { JSON.parse(cand); return cand; } catch { /* tiếp tục tìm */ }
          start = -1;
        }
      }
    }
    return "";
  }
}

// ===== HelpBot: gọi OpenRouter để hướng dẫn sử dụng web =====
export async function helpAssistantReply(history, prompt) {
  const apiKey = import.meta.env.VITE_API_CHATBOT_KEY;

  const messages = [
    {
      role: "system",
      content:
        "Bạn là trợ lý ngắn gọn, thân thiện, hướng dẫn cách sử dụng website học từ vựng HOCTUVUNG. Trả lời bằng tiếng Việt, câu ngắn, kèm từng bước khi cần.",
    },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: prompt },
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // model gọn nhẹ, phù hợp trợ lý hướng dẫn
      temperature: 0.3,
      messages,
    }),
  });

  if (!res.ok) {
    console.error("OpenRouter HTTP error:", res.status);
    return "Xin lỗi, hiện mình không phản hồi được. Bạn thử lại sau nhé.";
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "Xin lỗi, mình chưa có câu trả lời.";
  return content;
}