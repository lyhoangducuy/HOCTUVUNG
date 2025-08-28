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
  LineChart,
  Line,
  AreaChart,
  Area,
  LabelList
} from "recharts";

const COLORS = {
  users: "#3b82f6",
  classes: "#10b981",
  cards: "#f59e0b",
};

// Helpers
const asDate = (val) => {
  if (!val) return null;
  try {
    // Firestore Timestamp object
    if (typeof val?.toDate === "function") return val.toDate();
    // Firestore timestamp plain object { seconds, nanoseconds }
    if (typeof val === "object" && typeof val.seconds === "number") {
      return new Date(val.seconds * 1000);
    }
    if (val instanceof Date) return val;
    if (typeof val === "number") {
      // treat as ms if looks like ms, else seconds
      return new Date(val > 1e12 ? val : val * 1000);
    }
    if (typeof val === "string") {
      // Try ISO first
      const iso = new Date(val);
      if (!isNaN(iso.getTime())) return iso;
      // Try dd/mm/yyyy
      const parts = val.split("/");
      if (parts.length === 3) {
        const d = Number(parts[0]);
        const m = Number(parts[1]);
        const y = Number(parts[2]);
        if (y) return new Date(y, (m || 1) - 1, d || 1);
      }
    }
  } catch (_) {}
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

export default function MiniCharts({ users = [], classes = [], cards = [], revenue = { byMonth: {} } }) {
  const countData = useMemo(() => ([
    { name: "Người dùng", value: Array.isArray(users) ? users.length : Number(users || 0), key: "users" },
    { name: "Lớp học", value: Array.isArray(classes) ? classes.length : Number(classes || 0), key: "classes" },
    { name: "Bộ thẻ", value: Array.isArray(cards) ? cards.length : Number(cards || 0), key: "cards" },
  ]), [users, classes, cards]);

  const growthData = useMemo(() => {
    const keys = lastNMonthsKeys(6);

    const countByMonth = (arr) => {
      const map = Object.fromEntries(keys.map((k) => [k, 0]));
      (Array.isArray(arr) ? arr : []).forEach((it) => {
        const dt = getItemDate(it);
        if (!dt || isNaN(dt.getTime())) return;
        const k = ymKey(dt);
        if (k in map) map[k] += 1;
      });
      return map;
    };

    const uMap = countByMonth(users);
    const cMap = countByMonth(classes);
    const bMap = countByMonth(cards);

    return keys.map((k) => ({ month: k, users: uMap[k], classes: cMap[k], cards: bMap[k] }));
  }, [users, classes, cards]);

  // Percent growth vs. first month with non-zero baseline
  const growthPctData = useMemo(() => {
    if (!Array.isArray(growthData) || growthData.length === 0) return [];

    const firstIdx = 0;
    const base = {
      users: growthData[firstIdx]?.users || 0,
      classes: growthData[firstIdx]?.classes || 0,
      cards: growthData[firstIdx]?.cards || 0,
    };

    const pct = (val, b) => {
      if (!b || b === 0) return 0;
      return ((val - b) / b) * 100;
    };

    return growthData.map((row) => ({
      month: row.month,
      usersPct: pct(row.users, base.users),
      classesPct: pct(row.classes, base.classes),
      cardsPct: pct(row.cards, base.cards),
      // keep raw for tooltip reference
      users: row.users,
      classes: row.classes,
      cards: row.cards,
    }));
  }, [growthData]);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      padding: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <h3 style={{ margin: 0, marginBottom: 12 }}>Thống kê tổng quan</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Biểu đồ cột: số lượng người dùng / lớp / bộ thẻ (tổng) */}
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
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
