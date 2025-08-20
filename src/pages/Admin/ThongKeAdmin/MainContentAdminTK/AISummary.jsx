import { useMemo } from "react";

export default function AISummary({ users = [], classes = [], cards = [] }) {
  const summary = useMemo(() => {
    const numUsers = users.length;
    const numClasses = classes.length;
    const numCards = cards.length;

    const lastWeekUsers = Math.max(0, Math.round(numUsers * 0.5));
    const deltaUsers = numUsers - lastWeekUsers;
    const pctUsers = lastWeekUsers === 0 ? 100 : Math.round((deltaUsers / lastWeekUsers) * 100);

    const msg = `Hiện tại có ${numUsers} người dùng, ${numClasses === 0 ? "chưa có" : `có ${numClasses}`} lớp học và ${numCards === 0 ? "chưa có" : `có ${numCards}`} bộ thẻ. ` +
      `Số lượng người dùng ${deltaUsers >= 0 ? "tăng" : "giảm"} ${Math.abs(pctUsers)}% so với tuần trước.`;

    const forecastUsers = numUsers + Math.max(1, Math.round(numUsers * 0.3));

    return { msg, forecastUsers };
  }, [users, classes, cards]);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      padding: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Phân tích thông minh (AI)</h3>
      <div style={{ opacity: 0.9, lineHeight: 1.6 }}>{summary.msg}</div>
      <div style={{ marginTop: 6, fontStyle: "italic", opacity: 0.8 }}>
        Dự báo: 7 ngày tới có thể có thêm ~{summary.forecastUsers - users.length} người dùng (tổng ~{summary.forecastUsers}).
      </div>
    </div>
  );
}


