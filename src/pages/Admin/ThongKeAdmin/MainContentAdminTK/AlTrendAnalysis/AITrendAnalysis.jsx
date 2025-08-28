import { useState} from "react";
import { MdTrendingUp } from "react-icons/md";
import { FaChartLine, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import "./AITrendAnalysis.css"

// Service AI để phân tích xu hướng
const analyzeTrendsWithAI = async (data) => {
  const apiKey = import.meta.env.VITE_API_CHATBOT_KEY;

  if (!apiKey) {
    throw new Error("API key không được cấu hình");
  }

  // Tính toán các metrics cơ bản
  const totalUsers = data.users.length;
  const totalClasses = data.classes.length;
  const totalCards = data.cards.length;
  const monthRevenue = data.revenue.monthRevenue || 0;
  const totalRevenue = data.revenue.total || 0;

  // Phân tích người dùng theo thời gian
  const userCreationDates = data.users
    .filter((u) => u.ngayTao)
    .map((u) => new Date(u.ngayTao.seconds * 1000))
    .sort((a, b) => a - b);

  const recentUsers = userCreationDates.filter((date) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date > thirtyDaysAgo;
  }).length;

  const prompt = `
Phân tích xu hướng và dự báo cho ứng dụng học từ vựng:

DỮ LIỆU HIỆN TẠI:
- Tổng người dùng: ${totalUsers}
- Người dùng mới (30 ngày): ${recentUsers}
- Tổng khóa học: ${totalClasses}
- Tổng bộ thẻ: ${totalCards}
- Doanh thu tháng: ${monthRevenue.toLocaleString("vi-VN")} VNĐ
- Doanh thu tổng: ${totalRevenue.toLocaleString("vi-VN")} VNĐ

PHÂN TÍCH DOANH THU THEO THÁNG:
${JSON.stringify(data.revenue.byMonth, null, 2)}

Hãy phân tích và đưa ra:

1. XU HƯỚNG TĂNG TRƯỞNG:
   - Tốc độ tăng trưởng người dùng
   - Xu hướng doanh thu
   - Mức độ hoạt động của hệ thống

2. DỰ BÁO 30 NGÀY TỚI:
   - Số người dùng mới dự kiến
   - Doanh thu dự kiến
   - Các chỉ số KPI quan trọng

Trả về kết quả bằng tiếng Việt, có cấu trúc rõ ràng với các emoji phù hợp phải cực kì ngắn gọn nhưng trình bày đặc sắc.
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
                 text: prompt
               }
             ]
           }
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

export default function AITrendAnalysis({
  users = [],
  classes = [],
  cards = [],
  revenue = {},
}) {
  const [trendAnalysis, setTrendAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tính toán metrics cơ bản
  const metrics = {
    totalUsers: users.length,
    totalClasses: classes.length,
    totalCards: cards.length,
    monthRevenue: revenue.monthRevenue || 0,
    totalRevenue: revenue.total || 0,
    recentUsers: users.filter((u) => {
      if (!u.ngayTao) return false;
      const userDate = new Date(u.ngayTao.seconds * 1000);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return userDate > thirtyDaysAgo;
    }).length,
  };

  // Gọi AI để phân tích xu hướng
  const generateTrendAnalysis = async () => {
    setLoading(true);
    setError("");

    try {
      const analysis = await analyzeTrendsWithAI({
        users,
        classes,
        cards,
        revenue,
      });
      setTrendAnalysis(analysis);
    } catch (err) {
      console.error("Lỗi phân tích xu hướng AI:", err);
      setError(
        "Không thể kết nối AI để phân tích xu hướng. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  // Tự động phân tích khi component mount
  const phantich = () => {
    if (users.length > 0 || classes.length > 0 || cards.length > 0) {
      generateTrendAnalysis();
    }
  };

  return (
    <div className="ai-trend-container">
      <div className="ai-trend-header">
        <div className="ai-trend-title">
          <FaChartLine style={{ color: "#10b981", fontSize: 20 }} />
          <h3>Phân tích xu hướng & Dự báo</h3>
        </div>

        <button
          onClick={phantich}
          disabled={loading}
          className="ai-trend-btn"
        >
          {loading ? (
            <>
              <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
              Đang phân tích...
            </>
          ) : (
            <>
              <MdTrendingUp />
              Phân tích
            </>
          )}
        </button>
      </div>

      {/* Metrics */}
      <div className="ai-trend-metrics">
        <div className="ai-metric-card ai-metric-users">
          <div className="value">{metrics.totalUsers}</div>
          <div className="label">Tổng người dùng</div>
        </div>

        <div className="ai-metric-card ai-metric-recent">
          <div className="value">{metrics.recentUsers}</div>
          <div className="label">Người dùng mới (30 ngày)</div>
        </div>

        <div className="ai-metric-card ai-metric-month-revenue">
          <div className="value">{metrics.monthRevenue.toLocaleString("vi-VN")}</div>
          <div className="label">Doanh thu tháng (VNĐ)</div>
        </div>

        <div className="ai-metric-card ai-metric-total-revenue">
          <div className="value">{metrics.totalRevenue.toLocaleString("vi-VN")}</div>
          <div className="label">Tổng doanh thu (VNĐ)</div>
        </div>
      </div>

      {error && <div className="ai-error"><FaExclamationTriangle />{error}</div>}

      {loading ? (
        <div className="ai-loading">
          <FaSpinner style={{ animation: "spin 1s linear infinite", marginRight: 12, fontSize: 20 }} />
          AI đang phân tích xu hướng...
        </div>
      ) : trendAnalysis ? (
        <div className="ai-analysis">{trendAnalysis}</div>
      ) : (
        <div className="ai-no-data">Chưa có dữ liệu để phân tích xu hướng</div>
      )}
    </div>
  );
}
