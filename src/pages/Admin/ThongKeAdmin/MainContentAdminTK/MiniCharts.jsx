import { useMemo } from "react";

function Bar({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, marginBottom: 4 }}>{label}: {value}</div>
      <div style={{ height: 10, borderRadius: 6, background: "#e5e7eb", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: "#3b82f6" }} />
      </div>
    </div>
  );
}

export default function MiniCharts({ users = [], classes = [], cards = [] }) {
  const stats = useMemo(() => {
    const u = users.length;
    const c = classes.length;
    const b = cards.length;
    const max = Math.max(u, c, b, 1);
    return { u, c, b, max };
  }, [users, classes, cards]);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      padding: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Biểu đồ nhanh</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <Bar label="Người dùng" value={stats.u} max={stats.max} />
          <Bar label="Lớp học" value={stats.c} max={stats.max} />
          <Bar label="Bộ thẻ" value={stats.b} max={stats.max} />
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Tỉ lệ</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, background: "#3b82f6" }} />
            <span style={{ fontSize: 12 }}>Người dùng</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, background: "#10b981" }} />
            <span style={{ fontSize: 12 }}>Lớp học</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, background: "#f59e0b" }} />
            <span style={{ fontSize: 12 }}>Bộ thẻ</span>
          </div>
        </div>
      </div>
    </div>
  );
}


