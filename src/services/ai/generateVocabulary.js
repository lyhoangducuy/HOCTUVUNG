// Service tạo danh sách từ vựng theo chủ đề
// - Nếu có VITE_OPENAI_API_KEY: gọi OpenAI để sinh thật
// - Nếu không: fallback tự sinh giả lập để không chặn tính năng

const OPENAI_API_KEY = import.meta?.env?.VITE_OPENAI_API_KEY;

async function callOpenAI(topic, count) {
  const prompt = `Bạn là trợ lý tạo bộ từ vựng. Theo chủ đề: "${topic}", hãy trả về JSON array thuần (không kèm giải thích) gồm ${count} phần tử, mỗi phần tử dạng: {"tu":"...","nghia":"..."}. Dùng ngôn ngữ Việt - Anh. Chỉ trả JSON, không thêm văn bản.`;

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Bạn trả lời đúng định dạng JSON hợp lệ." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch {console.log("lỗi services/ai/generateVocabulary");
  }
  // Nếu content không phải JSON thuần, thử bóc code block
  const match = content?.match(/```json[\s\S]*?```/i) || content?.match(/```[\s\S]*?```/);
  if (match) {
    const inner = match[0].replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(inner);
    if (Array.isArray(parsed)) return parsed;
  }
  throw new Error("OpenAI trả về không đúng JSON");
}

function fallbackGenerate(topic, count) {
  const base = [
    ["hello", "xin chào"],
    ["goodbye", "tạm biệt"],
    ["please", "làm ơn"],
    ["thank you", "cảm ơn"],
    ["apple", "quả táo"],
    ["book", "quyển sách"],
    ["school", "trường học"],
    ["teacher", "giáo viên"],
    ["student", "học sinh"],
    ["computer", "máy tính"],
  ];
  const out = [];
  for (let i = 0; i < count; i++) {
    const pick = base[i % base.length];
    out.push({ tu: `${pick[0]}_${i + 1}`, nghia: pick[1] });
  }
  return out;
}

export async function generateVocabulary(topic, count) {
  const safeCount = Number.isFinite(Number(count)) && Number(count) > 0 ? Number(count) : 10;
  if (OPENAI_API_KEY) {
    try {
      return await callOpenAI(topic, safeCount);
    } catch (e) {
      console.error("OpenAI failed, fallback local:", e);
      return fallbackGenerate(topic, safeCount);
    }
  }
  return fallbackGenerate(topic, safeCount);
}


