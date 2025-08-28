import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = {
  users: "#2563eb",
  classes: "#059669", 
  cards: "#f59e0b",
  revenue: "#7c3aed",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6"
};
import "./ProAnalytics.css"

const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const ymKey = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

const lastNMonthsKeys = (n = 6) => {
  const now = new Date();
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(ymKey(d));
  }
  return keys;
};

// Thêm hỗ trợ Ngày và Giờ để zoom sâu hơn
const lastNDaysKeys = (n = 30) => {
  const now = new Date();
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return keys;
};

const lastNHoursKeys = (n = 24) => {
  const now = new Date();
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`);
  }
  return keys;
};

const asDate = (val) => {
  if (!val) return null;
  try {
    if (typeof val?.toDate === "function") return val.toDate();
    if (typeof val === "object" && typeof val.seconds === "number") {
      return new Date(val.seconds * 1000);
    }
    if (val instanceof Date) return val;
    if (typeof val === "number") return new Date(val > 1e12 ? val : val * 1000);
    const t = new Date(val);
    if (!isNaN(t.getTime())) return t;
    const parts = String(val).split("/");
    if (parts.length === 3) {
      const d = Number(parts[0]);
      const m = Number(parts[1]);
      const y = Number(parts[2]);
      if (y) return new Date(y, (m || 1) - 1, d || 1);
    }
  } catch (error) {
    console.warn("Lỗi parse date:", error);
  }
  return null;
};

const getItemDate = (item) => {
  return (
    asDate(item?.createdAt) ||
    asDate(item?.created_at) ||
    asDate(item?.ngayTao) ||
    asDate(item?.NgayTao) ||
    asDate(item?.NgayBatDau) ||
    asDate(item?.createdDate) ||
    asDate(item?.timestamp) ||
    asDate(item?.time) ||
    null
  );
};

export default function ProAnalytics({ users = [], classes = [], cards = [], revenue = { byMonth: {}, total: 0 } }) {
  const [range, setRange] = useState(8);
  const [activeChart, setActiveChart] = useState("composed");
  const [timeUnit, setTimeUnit] = useState("month"); // month | day | hour

  // Key thời gian linh hoạt theo đơn vị
  const timeKeys = useMemo(() => {
    if (timeUnit === "day") return lastNDaysKeys(range);
    if (timeUnit === "hour") return lastNHoursKeys(range);
    return lastNMonthsKeys(range);
  }, [timeUnit, range]);

  // Đếm số lượng theo key thời gian
  const countsByTime = useMemo(() => {
    const init = Object.fromEntries(timeKeys.map((k) => [k, 0]));
    const count = (arr) => {
      const map = { ...init };
      (Array.isArray(arr) ? arr : []).forEach((it) => {
        const dt = getItemDate(it);
        if (!dt || isNaN(dt.getTime())) return;
        let key = "";
        if (timeUnit === "day") {
          key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        } else if (timeUnit === "hour") {
          key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:00`;
        } else {
          key = ymKey(dt);
        }
        if (key in map) map[key] += 1;
      });
      return map;
    };
    return {
      users: count(users),
      classes: count(classes),
      cards: count(cards),
    };
  }, [users, classes, cards, timeKeys, timeUnit]);

  // Doanh thu: hiện có theo tháng, tạm map vào key tháng cho mọi đơn vị
  const revenueByTime = useMemo(() => {
    const by = revenue?.byMonth || {};
    const map = Object.fromEntries(timeKeys.map((k) => [k, 0]));
    timeKeys.forEach((k) => {
      const monthKey = k.substring(0, 7); // YYYY-MM
      map[k] = Number(by[monthKey] || 0);
    });
    return map;
  }, [revenue, timeKeys]);

  const composedData = useMemo(() => {
    return timeKeys.map((k) => ({
      time: k,
      users: countsByTime.users[k],
      classes: countsByTime.classes[k],
      cards: countsByTime.cards[k],
      revenue: revenueByTime[k],
    }));
  }, [timeKeys, countsByTime, revenueByTime]);

  const totals = useMemo(() => {
    return {
      users: (Array.isArray(users) ? users.length : Number(users || 0)) || 0,
      classes: (Array.isArray(classes) ? classes.length : Number(classes || 0)) || 0,
      cards: (Array.isArray(cards) ? cards.length : Number(cards || 0)) || 0,
      revenue: Number(revenue?.total || 0),
    };
  }, [users, classes, cards, revenue]);



  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>{`Thời gian: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: "4px 0", 
              color: entry.color,
              fontSize: "14px"
            }}>
              {`${entry.name}: ${entry.name === "Doanh thu" ? 
                `${Number(entry.value).toLocaleString("vi-VN")} đ` : 
                entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <h3 className="analytics-title">📊 Phân tích nâng cao</h3>
  
        <div className="analytics-filters">
          <label className="analytics-label">
            <span>Đơn vị:</span>
            <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
              <option value="month">Tháng</option>
              <option value="day">Ngày</option>
              <option value="hour">Giờ</option>
            </select>
          </label>
  
          <label className="analytics-label">
            <span>Khoảng:</span>
            <select value={range} onChange={(e) => setRange(Number(e.target.value))}>
              {timeUnit === "month" && (
                <>
                  <option value={6}>6 tháng</option>
                  <option value={8}>8 tháng</option>
                  <option value={12}>12 tháng</option>
                </>
              )}
              {timeUnit === "day" && (
                <>
                  <option value={7}>7 ngày</option>
                  <option value={30}>30 ngày</option>
                  <option value={90}>90 ngày</option>
                </>
              )}
              {timeUnit === "hour" && (
                <>
                  <option value={6}>6 giờ</option>
                  <option value={12}>12 giờ</option>
                  <option value={24}>24 giờ</option>
                </>
              )}
            </select>
          </label>
        </div>
      </div>
  
      {/* Chart Type Selector */}
    
  
      {/* Charts */}
      {activeChart === "composed" && (
        <div className="analytics-section">
          <h4 className="analytics-subtitle">📈 Xu hướng theo thời gian</h4>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={composedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="Người dùng"
                  stroke={COLORS.users}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.users }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="classes"
                  name="Lớp học"
                  stroke={COLORS.classes}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.classes }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="cards"
                  name="Bộ thẻ"
                  stroke={COLORS.cards}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.cards }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke={COLORS.revenue}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.revenue }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
  
      {/* Pie, Area, Radial giữ nguyên như trên nhưng thay inline bằng className tương ứng */}
  
      {/* Summary Stats */}
      <div className="analytics-summary">
        <div>
          <div className="summary-value" style={{ color: COLORS.users }}>
            {totals.users.toLocaleString()}
          </div>
          <div className="summary-label">Tổng người dùng</div>
        </div>
        <div>
          <div className="summary-value" style={{ color: COLORS.classes }}>
            {totals.classes.toLocaleString()}
          </div>
          <div className="summary-label">Tổng lớp học</div>
        </div>
        <div>
          <div className="summary-value" style={{ color: COLORS.cards }}>
            {totals.cards.toLocaleString()}
          </div>
          <div className="summary-label">Tổng bộ thẻ</div>
        </div>
        <div>
          <div className="summary-value" style={{ color: COLORS.revenue }}>
            {totals.revenue.toLocaleString("vi-VN")} đ
          </div>
          <div className="summary-label">Tổng doanh thu</div>
        </div>
      </div>
    </div>
  );
}


