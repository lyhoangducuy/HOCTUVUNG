import { useMemo, useState } from "react";
import { FaRobot, FaSpinner, FaLightbulb, FaChartLine } from "react-icons/fa";
import "./AISummary.css";
// Service AI để phân tích dữ liệu
const analyzeDataWithAI = async (data) => {
  const apiKey = import.meta.env.VITE_API_CHATBOT_KEY;

  if (!apiKey) {
    throw new Error("API key không được cấu hình");
  }

  const prompt = `
Hãy phân tích dữ liệu sau và trả lời NGẮN GỌN , trình bày rõ ràng có emoji.  
Yêu cầu gồm 3 phần:
1️⃣ Phân tích xu hướng & điểm chính.  
2️⃣ Đề xuất 2–3 giải pháp ngắn gọn và khả thi,
 + nêu ra cách làm của các giải pháp đó.  
 + kểt quả đạt được. 
 + cần chú ý.
3️⃣ Cảnh báo rủi ro nếu không cải thiện.  

DỮ LIỆU:
- Người dùng: ${data.users.length}
- Khóa học: ${data.classes.length}
- Bộ thẻ: ${data.cards.length}
- Doanh thu tháng này: ${data.revenue.monthRevenue?.toLocaleString("vi-VN")} VNĐ
- Doanh thu tổng: ${data.revenue.total?.toLocaleString("vi-VN")} VNĐ

Thống kê người dùng: ${JSON.stringify(data.userStats, null, 2)}
Doanh thu theo tháng: ${JSON.stringify(data.revenue.byMonth, null, 2)}

`;

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
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Lỗi khi phân tích AI:", error);
    throw error;
  }
};

export default function AISummary({
  users = [],
  classes = [],
  cards = [],
  userStats = [],
  revenue = {},
}) {
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Dữ liệu để phân tích
  const analysisData = useMemo(
    () => ({
      users,
      classes,
      cards,
      userStats,
      revenue,
    }),
    [users, classes, cards, userStats, revenue]
  );

  // Gọi AI để phân tích
  const generateAIAnalysis = async () => {
    setLoading(true);
    setError("");

    try {
      const analysis = await analyzeDataWithAI(analysisData);
      setAiAnalysis(analysis);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Lỗi phân tích AI:", err);
      setError(
        "Không thể kết nối AI. Vui lòng kiểm tra API key hoặc thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  // Tự động phân tích khi dữ liệu thay đổi
  const phantich = () => {
    if (users.length > 0 || classes.length > 0 || cards.length > 0) {
      generateAIAnalysis();
    }
  };

  // Phân tích cơ bản khi AI không khả dụng
  const fallbackAnalysis = useMemo(() => {
    const numUsers = users.length;
    const numClasses = classes.length;
    const numCards = cards.length;
    const monthRevenue = revenue.monthRevenue || 0;
    const totalRevenue = revenue.total || 0;

    const insights = [];

    if (numUsers > 0) {
      insights.push(`📊 Hiện có ${numUsers} người dùng đang hoạt động`);
    }

    if (numClasses > 0) {
      insights.push(`🎓 Có ${numClasses} khóa học được tạo`);
    }

    if (numCards > 0) {
      insights.push(`📝 Tổng cộng ${numCards} bộ thẻ học tập`);
    }

    if (monthRevenue > 0) {
      insights.push(
        `💰 Doanh thu tháng: ${monthRevenue.toLocaleString("vi-VN")} VNĐ`
      );
    }

    if (totalRevenue > 0) {
      insights.push(
        `💎 Tổng doanh thu: ${totalRevenue.toLocaleString("vi-VN")} VNĐ`
      );
    }

    return insights.join("\n");
  }, [users, classes, cards, revenue]);

  return (
    <div className="aisummary-container">
      <div className="aisummary-header">
        <div className="aisummary-header-left">
          <FaLightbulb style={{ color: "#f59e0b", fontSize: 20 }} />
          <h3 className="aisummary-title">Phân tích dự án hiện tại</h3>
        </div>

        <button
          onClick={phantich}
          disabled={loading}
          className="aisummary-button"
        >
          {loading ? (
            <>
              <FaSpinner className="spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <FaRobot />
              Phân tích
            </>
          )}
        </button>
      </div>

      {error && <div className="aisummary-error">⚠️ {error}</div>}

      {loading ? (
        <div className="aisummary-loading">
          <FaSpinner
            className="spin"
            style={{ marginRight: 12, fontSize: 20 }}
          />
          AI đang phân tích dữ liệu...
        </div>
      ) : aiAnalysis ? (
        <div>
          <div className="aisummary-result">{aiAnalysis}</div>
          {lastUpdated && (
            <div className="aisummary-updated">
              Cập nhật lúc: {lastUpdated.toLocaleString("vi-VN")}
            </div>
          )}
        </div>
      ) : (
        <div className="aisummary-fallback">
          {fallbackAnalysis || "Chưa có dữ liệu để phân tích"}
        </div>
      )}
    </div>
  );
}
