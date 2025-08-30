// src/ChatAI/ChatBot.js
export async function fetchVocabulary(topic, count = 1, langSrc = "vi", langDst = "en") {
  const apiKey = import.meta.env.VITE_API_CHATBOT_KEY;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Tạo CHÍNH XÁC ${count} cặp thẻ JSON theo chủ đề "${topic}". ` +
                    `- "tu": từ/phrase ở ngôn ngữ gốc (${langSrc}). ` +
                    `- "nghia": bản dịch ở ngôn ngữ muốn học (${langDst}). ` +
                    `Trả về DUY NHẤT một JSON array thuần: ` +
                    `[{"tu":"...","nghia":"..."}]. ` +
                    `KHÔNG dùng \`\`\`, KHÔNG thêm chữ nào khác.`
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // 1) Loại bỏ các tag <think> nếu có
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
  } catch (error) {
    console.error("Lỗi khi tạo từ vựng:", error);
    return [];
  }

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

// ===== HelpBot: gọi Gemini để hướng dẫn sử dụng web =====
export async function helpAssistantReply(history, prompt) {
  const apiKey = import.meta.env.VITE_API_CHATBOT_KEY;

  try {
    // Tạo context từ history
    const context = history.map((m) => `${m.role}: ${m.content}`).join('\n');

    
    const fullPrompt = `Bạn là trợ lý AI thông minh, thân thiện. Bạn có thể:

    1. Hướng dẫn cách sử dụng website học từ vựng HOCTUVUNG
    2. Trả lời các câu hỏi về ngôn ngữ, dịch thuật, từ vựng
    3. Giúp học từ vựng các ngôn ngữ khác nhau
    4. Giải thích ngữ pháp, cách phát âm
    5. Tạo ví dụ câu, cụm từ theo yêu cầu
    
    Trả lời bằng tiếng Việt, câu ngắn gọn, dễ hiểu. Khi cần thiết, hãy đưa ra ví dụ cụ thể.
    
    Lịch sử chat:
    ${context}
    
    Người dùng: ${prompt}
    
    Trợ lý:`;


    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, mình chưa có câu trả lời.";
    return content;
  } catch (error) {
    console.error("Lỗi khi gọi trợ lý:", error);
    return "Xin lỗi, hiện mình không phản hồi được. Bạn thử lại sau nhé.";
  }
}