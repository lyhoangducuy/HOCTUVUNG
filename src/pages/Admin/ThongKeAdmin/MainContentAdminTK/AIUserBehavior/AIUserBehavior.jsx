import { useState} from "react";
import { FaUsers, FaSpinner, FaBrain, FaEye, FaExclamationTriangle } from "react-icons/fa";
import "./AIUserBehavior.css"
// Service AI để phân tích hành vi người dùng
const analyzeUserBehaviorWithAI = async (data) => {
  const apiKey = import.meta.env.VITE_API_CHATBOT_KEY;
  
  if (!apiKey) {
    throw new Error("API key không được cấu hình");
  }

  // Phân tích dữ liệu người dùng
  const totalUsers = data.users.length;
  const activeUsers = data.users.filter(u => u.vaiTro && u.vaiTro !== "DELETED").length;
  const adminUsers = data.users.filter(u => u.vaiTro === "ADMIN").length;
  const studentUsers = data.users.filter(u => u.vaiTro === "HOC_VIEN").length;
  const teacherUsers = data.users.filter(u => u.vaiTro === "GIANG_VIEN").length;

  // Phân tích theo thời gian
  const userCreationDates = data.users
    .filter(u => u.ngayTao)
    .map(u => new Date(u.ngayTao.seconds * 1000))
    .sort((a, b) => a - b);

  const recentUsers = userCreationDates.filter(date => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date > thirtyDaysAgo;
  }).length;

  const weeklyUsers = userCreationDates.filter(date => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date > sevenDaysAgo;
  }).length;

  // Phân tích bộ thẻ
  const publicCards = data.cards.filter(c => c.cheDo === "cong_khai").length;
  const privateCards = data.cards.filter(c => c.cheDo === "ca_nhan").length;
  const cardsWithLearning = data.cards.filter(c => c.luotHoc && c.luotHoc > 0).length;

  const prompt = `
Phân tích hành vi người dùng trong ứng dụng học từ vựng:

DỮ LIỆU NGƯỜI DÙNG:
- Tổng người dùng: ${totalUsers}
- Người dùng hoạt động: ${activeUsers}
- Admin: ${adminUsers}
- Học viên: ${studentUsers}
- Giảng viên: ${teacherUsers}
- Người dùng mới (7 ngày): ${weeklyUsers}
- Người dùng mới (30 ngày): ${recentUsers}

DỮ LIỆU BỘ THẺ:
- Tổng bộ thẻ: ${data.cards.length}
- Bộ thẻ công khai: ${publicCards}
- Bộ thẻ cá nhân: ${privateCards}
- Bộ thẻ có lượt học: ${cardsWithLearning}

DỮ LIỆU KHÓA HỌC:
- Tổng khóa học: ${data.classes.length}

Hãy phân tích và đưa ra:

1. PHÂN TÍCH HÀNH VI NGƯỜI DÙNG:
   - Mức độ hoạt động của người dùng
   - Xu hướng tạo nội dung (bộ thẻ, khóa học)
   - Sự tương tác giữa các vai trò
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

export default function AIUserBehavior({ users = [], classes = [], cards = [] }) {
  const [behaviorAnalysis, setBehaviorAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tính toán metrics hành vi
  const behaviorMetrics = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.vaiTro && u.vaiTro !== "DELETED").length,
    adminUsers: users.filter(u => u.vaiTro === "ADMIN").length,
    studentUsers: users.filter(u => u.vaiTro === "HOC_VIEN").length,
    teacherUsers: users.filter(u => u.vaiTro === "GIANG_VIEN").length,
    recentUsers: users.filter(u => {
      if (!u.ngayTao) return false;
      const userDate = new Date(u.ngayTao.seconds * 1000);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return userDate > thirtyDaysAgo;
    }).length,
    weeklyUsers: users.filter(u => {
      if (!u.ngayTao) return false;
      const userDate = new Date(u.ngayTao.seconds * 1000);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return userDate > sevenDaysAgo;
    }).length,
    publicCards: cards.filter(c => c.cheDo === "cong_khai").length,
    privateCards: cards.filter(c => c.cheDo === "ca_nhan").length,
    cardsWithLearning: cards.filter(c => c.luotHoc && c.luotHoc > 0).length,
    totalCards: cards.length,
    totalClasses: classes.length
  };

  // Gọi AI để phân tích hành vi
  const generateBehaviorAnalysis = async () => {
    setLoading(true);
    setError("");
    
    try {
      const analysis = await analyzeUserBehaviorWithAI({ users, classes, cards });
      setBehaviorAnalysis(analysis);
    } catch (err) {
      console.error("Lỗi phân tích hành vi AI:", err);
      setError("Không thể kết nối AI để phân tích hành vi. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Tự động phân tích khi component mount
  const phantich  = () => {
    if (users.length > 0 || classes.length > 0 || cards.length > 0) {
      generateBehaviorAnalysis();
    }
  };

  return (
    <div className="user-behavior-container">
      <div className="user-behavior-header">
        <div className="user-behavior-title">
          <FaUsers style={{ color: "#8b5cf6", fontSize: 20 }} />
          <h3>Phân tích hành vi người dùng</h3>
        </div>

        <button
          onClick={phantich}
          disabled={loading}
          className="user-behavior-btn"
        >
          {loading ? (
            <>
              <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
              Đang phân tích...
            </>
          ) : (
            <>
              <FaBrain />
              phân tích
            </>
          )}
        </button>
      </div>

      {/* Metrics hành vi */}
      <div className="user-behavior-metrics">
        <div className="metric-card metric-active">
          <div className="value">{behaviorMetrics.activeUsers}</div>
          <div className="label">Người dùng hoạt động</div>
        </div>

        <div className="metric-card metric-student">
          <div className="value">{behaviorMetrics.studentUsers}</div>
          <div className="label">Học viên</div>
        </div>

        <div className="metric-card metric-teacher">
          <div className="value">{behaviorMetrics.teacherUsers}</div>
          <div className="label">Giảng viên</div>
        </div>

        <div className="metric-card metric-weekly">
          <div className="value">{behaviorMetrics.weeklyUsers}</div>
          <div className="label">Mới (7 ngày)</div>
        </div>

        <div className="metric-card metric-public-cards">
          <div className="value">{behaviorMetrics.publicCards}</div>
          <div className="label">Bộ thẻ công khai</div>
        </div>

        <div className="metric-card metric-learning">
          <div className="value">{behaviorMetrics.cardsWithLearning}</div>
          <div className="label">Bộ thẻ có học</div>
        </div>
      </div>

      {error && (
        <div className="user-behavior-error">
          <FaExclamationTriangle />
          {error}
        </div>
      )}

      {loading ? (
        <div className="user-behavior-loading">
          <FaSpinner
            style={{
              animation: "spin 1s linear infinite",
              marginRight: 12,
              fontSize: 20,
            }}
          />
          AI đang phân tích hành vi người dùng...
        </div>
      ) : behaviorAnalysis ? (
        <div className="user-behavior-analysis">{behaviorAnalysis}</div>
      ) : (
        <div className="user-behavior-no-data">
          Chưa có dữ liệu để phân tích hành vi
        </div>
      )}
    </div>
  );
}
