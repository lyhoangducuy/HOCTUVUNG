import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = {
  users: "#2563eb",
  classes: "#059669",
  cards: "#f59e0b",
  revenue: "#7c3aed",
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

export default function ProAnalytics({ users = [], classes = [], cards = [], revenue = { byMonth: {}, total: 0 } }) {
  const [range, setRange] = useState(6); // months
  const [usePercent, setUsePercent] = useState(false);

  const months = useMemo(() => lastNMonthsKeys(range), [range]);

  const countsByMonth = useMemo(() => {
    const init = Object.fromEntries(months.map((m) => [m, 0]));
    const count = (arr) => {
      const map = { ...init };
      (Array.isArray(arr) ? arr : []).forEach((it) => {
        const dt = getItemDate(it);
        if (!dt || isNaN(dt.getTime())) return;
        const k = ymKey(dt);
        if (k in map) map[k] += 1;
      });
      return map;
    };
    return {
      users: count(users),
      classes: count(classes),
      cards: count(cards),
    };
  }, [users, classes, cards, months]);

  const revenueByMonth = useMemo(() => {
    const by = revenue?.byMonth || {};
    const map = Object.fromEntries(months.map((m) => [m, 0]));
    months.forEach((m) => {
      map[m] = Number(by[m] || 0);
    });
    return map;
  }, [revenue, months]);

  const composedData = useMemo(() => {
    const rows = months.map((m) => ({
      month: m,
      users: countsByMonth.users[m],
      classes: countsByMonth.classes[m],
      cards: countsByMonth.cards[m],
      revenue: revenueByMonth[m],
    }));

    if (!usePercent) return rows;

    // Convert counts to percentage share per month
    return rows.map((r) => {
      const sum = Math.max(1, r.users + r.classes + r.cards);
      return {
        ...r,
        users: (r.users / sum) * 100,
        classes: (r.classes / sum) * 100,
        cards: (r.cards / sum) * 100,
      };
    });
  }, [months, countsByMonth, revenueByMonth, usePercent]);

  const totals = useMemo(() => {
    return {
      users: (Array.isArray(users) ? users.length : Number(users || 0)) || 0,
      classes: (Array.isArray(classes) ? classes.length : Number(classes || 0)) || 0,
      cards: (Array.isArray(cards) ? cards.length : Number(cards || 0)) || 0,
      revenue: Number(revenue?.total || 0),
    };
  }, [users, classes, cards, revenue]);

  const pieData = useMemo(() => ([
    { name: "Người dùng", value: totals.users, color: COLORS.users },
    { name: "Lớp học", value: totals.classes, color: COLORS.classes },
    { name: "Bộ thẻ", value: totals.cards, color: COLORS.cards },
  ]), [totals]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Phân tích nâng cao</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>Khoảng thời gian:</span>
            <select value={range} onChange={(e) => setRange(Number(e.target.value))} style={{ padding: "6px 10px", borderRadius: 6 }}>
              <option value={6}>6 tháng</option>
              <option value={12}>12 tháng</option>
            </select>
          </label>
         
        </div>
      </div>

      {/* Combo: cột cho users/classes/cards + line cho revenue */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Tăng trưởng theo tháng</div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={composedData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" allowDecimals={false} tickFormatter={(v) => usePercent ? `${Math.round(v)}%` : v} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${Math.round(v/1000)}k`} />
              <Tooltip formatter={(val, name) => {
                const label = name === "users" ? "Người dùng" : name === "classes" ? "Lớp học" : name === "cards" ? "Bộ thẻ" : "Doanh thu";
                if (name === "revenue") return [`${Number(val).toLocaleString("vi-VN")} đ`, label];
                return [usePercent ? `${Number(val).toFixed(0)}%` : val, label];
              }} />
              <Legend />
              <Bar yAxisId="left" dataKey="users" name="Người dùng" fill={COLORS.users} radius={[6,6,0,0]} />
              <Bar yAxisId="left" dataKey="classes" name="Lớp học" fill={COLORS.classes} radius={[6,6,0,0]} />
              <Bar yAxisId="left" dataKey="cards" name="Bộ thẻ" fill={COLORS.cards} radius={[6,6,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu" stroke={COLORS.revenue} strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

     
       
     
    </div>
  );
}


