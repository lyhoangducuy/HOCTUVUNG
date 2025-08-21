import React from "react";

export async function fetchVocabulary(topic, count = 10) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer ", // chỉ dùng local
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1:free",
      messages: [
        {
          role: "user",
          content: `Hãy tạo ${count} cặp thẻ JSON với topic "${topic}". ` +
            `Mỗi object: {"tu":"...","nghia":"..."}. ` +
            `Chỉ trả về JSON thuần, KHÔNG dùng \`\`\` và KHÔNG thêm chữ nào khác.`,
        },
      ],
    }),
  });

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "[]";
  try {
    const parsed = JSON.parse(raw);
    // Đảm bảo format {tu, nghia}
    return Array.isArray(parsed)
      ? parsed.map((x) => ({
          tu: x.tu ?? x.question ?? "",
          nghia: x.nghia ?? x.answer ?? "",
        }))
      : [];
  } catch (e) {
    console.error("Lỗi parse JSON:", e, raw);
    return [];
  }
}