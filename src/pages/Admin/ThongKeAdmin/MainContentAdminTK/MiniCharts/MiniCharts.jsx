import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./MiniCharts.css";
const COLORS = {
  users: "#3b82f6",
  classes: "#10b981",
  cards: "#f59e0b",
};

export default function MiniCharts({
  users = [],
  classes = [],
  cards = [],
  sciences = [],
}) {
  const countData = useMemo(
    () => [
      {
        name: "Người dùng",
        value: Array.isArray(users) ? users.length : Number(users || 0),
        key: "users",
      },
      {
        name: "Lớp học",
        value: Array.isArray(classes) ? classes.length : Number(classes || 0),
        key: "classes",
      },
      {
        name: "Khóa học",
        value: Array.isArray(sciences)
          ? sciences.length
          : Number(sciences || 0),
        key: "sciences",
      },
      {
        name: "Bộ thẻ",
        value: Array.isArray(cards) ? cards.length : Number(cards || 0),
        key: "cards",
      },
    ],
    [users, classes, sciences, cards]
  );

  return (
    <div className="stats-container">
      <h3 className="stats-title">Thống kê tổng quan</h3>

      <div className="stats-grid">
        {/* Biểu đồ cột: số lượng người dùng / lớp / bộ thẻ (tổng) */}
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={countData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(val) => [val, "Số lượng"]} />
              <Legend />
              <Bar dataKey="value" name="Số lượng" radius={[6, 6, 0, 0]}>
                {countData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
