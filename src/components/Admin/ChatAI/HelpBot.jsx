import React, { useEffect, useRef, useState } from "react";
import "./HelpBot.css";
import { helpAssistantReply } from "./ChatBot";

export default function HelpBot({ defaultOpen = false }) {
  const [open, setOpen] = useState(!!defaultOpen);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Chào bạn! Mình là trợ lý của HOCTUVUNG. Hỏi mình cách tạo bộ thẻ, học flashcard, làm trắc nghiệm, hoặc cách thanh toán, và liên quan tới ngôn ngữ nhé, tôi sẽ giúp bạn.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Lắng nghe sự kiện điều khiển từ ngoài
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener("helpbot:open", onOpen);
    window.addEventListener("helpbot:toggle", onToggle);
    return () => {
      window.removeEventListener("helpbot:open", onOpen);
      window.removeEventListener("helpbot:toggle", onToggle);
    };
  }, []);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput("");

    const history = messages.slice(-8); // giữ ngắn gọn
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);
    try {
      const reply = await helpAssistantReply(history, prompt);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Xin lỗi, mình bị lỗi kết nối. Bạn thử lại giúp mình nhé.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="helpbot-wrap">
      {open && (
        <div
          className="helpbot-modal"
          role="dialog"
          aria-label="Trợ lý hướng dẫn"
        >
          <div className="helpbot-head">
            <strong>Trợ lý HOCTUVUNG</strong>
            <button className="helpbot-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="helpbot-list" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`helpbot-item ${m.role}`}>
                <div className="bubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="helpbot-item assistant">
                <div className="bubble">Đang soạn câu trả lời…</div>
              </div>
            )}
          </div>
          <div className="helpbot-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ví dụ: Làm sao tạo bộ thẻ?"
              rows={2}
            />
            <button className="send" onClick={send} disabled={loading}>
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
