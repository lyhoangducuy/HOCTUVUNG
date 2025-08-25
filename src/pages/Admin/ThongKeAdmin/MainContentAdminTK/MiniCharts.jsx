import { useMemo } from "react";

/** Màu giữ nguyên như legend cũ */
const COLORS = {
  users: "#3b82f6",   // xanh dương
  classes: "#10b981", // xanh lá
  cards: "#f59e0b",   // cam
};

export default function MiniCharts({ users = [], classes = [], cards = [] }) {
  // Dùng số lượng phần tử như trước
  const { vals, labels, max } = useMemo(() => {
    const u = Array.isArray(users) ? users.length : Number(users || 0);
    const c = Array.isArray(classes) ? classes.length : Number(classes || 0);
    const b = Array.isArray(cards) ? cards.length : Number(cards || 0);
    const mx = Math.max(u, c, b, 1); // tránh chia 0
    return {
      vals: [u, c, b],
      labels: ["Người dùng", "Lớp học", "Bộ thẻ"],
      max: mx,
    };
  }, [users, classes, cards]);

  // Kích thước chart
  const width = 420;
  const height = 180;
  const pad = { top: 14, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  // Scale đơn giản theo index 0..2
  const xOf = (i) => pad.left + (innerW * i) / (vals.length - 1 || 1);
  const yOf = (v) => pad.top + innerH - (v / max) * innerH; // 0 ở đáy

  // Tạo area path cho từng "đỉnh" (tam giác ở vị trí category)
  const mkAreaPath = (peakIndex) => {
    const pts = vals.map((v, i) => ({ x: xOf(i), y: yOf(i === peakIndex ? vals[peakIndex] : 0) }));
    const d =
      `M ${xOf(0)} ${yOf(0)}` +            // bắt đầu ở đáy trái
      pts.map((p) => ` L ${p.x} ${p.y}`).join("") + // lên theo 3 điểm
      ` L ${xOf(vals.length - 1)} ${yOf(0)}` +     // xuống đáy phải
      ` Z`; // đóng vùng
    return d;
  };

  // Lưới ngang đơn giản (3 vạch)
  const gridY = [0.25, 0.5, 0.75].map((t) => pad.top + innerH * t);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      padding: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Biểu đồ miền</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 16 }}>
        {/* Chart */}
        <svg width={width} height={height} role="img" aria-label="Biểu đồ miền">
          {/* Khung ngoài */}
          <rect x="0" y="0" width={width} height={height} rx="8" ry="8" fill="transparent" />

          {/* Lưới ngang */}
          {gridY.map((y, idx) => (
            <line
              key={idx}
              x1={pad.left}
              x2={pad.left + innerW}
              y1={y}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />
          ))}

          {/* Vùng người dùng (trái) */}
          <path
            d={mkAreaPath(0)}
            fill={COLORS.users + "40"} // ~25% alpha
            stroke={COLORS.users}
            strokeWidth="2"
          />
          {/* Vùng lớp học (giữa) */}
          <path
            d={mkAreaPath(1)}
            fill={COLORS.classes + "40"}
            stroke={COLORS.classes}
            strokeWidth="2"
          />
          {/* Vùng bộ thẻ (phải) */}
          <path
            d={mkAreaPath(2)}
            fill={COLORS.cards + "40"}
            stroke={COLORS.cards}
            strokeWidth="2"
          />

          {/* Điểm đỉnh & nhãn số */}
          {vals.map((v, i) => {
            const cx = xOf(i);
            const cy = yOf(v);
            const color = i === 0 ? COLORS.users : i === 1 ? COLORS.classes : COLORS.cards;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="4" fill={color} stroke="#fff" strokeWidth="2" />
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#111827"
                  fontWeight="600"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Trục X + nhãn category */}
          {labels.map((lb, i) => (
            <g key={lb} transform={`translate(${xOf(i)},0)`}>
              <line
                x1="0"
                x2="0"
                y1={pad.top + innerH}
                y2={pad.top + innerH + 4}
                stroke="#9ca3af"
              />
              <text
                x="0"
                y={height - 6}
                textAnchor="middle"
                fontSize="12"
                fill="#374151"
              >
                {lb}
              </text>
            </g>
          ))}

          {/* Trục Y (0) */}
          <line
            x1={pad.left}
            x2={pad.left + innerW}
            y1={pad.top + innerH}
            y2={pad.top + innerH}
            stroke="#9ca3af"
          />
        </svg>

        {/* Legend + mô tả */}
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Tương quan số lượng</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ width: 12, height: 12, background: COLORS.users, display: "inline-block", borderRadius: 2 }} />
            <span style={{ fontSize: 13 }}>Người dùng: <b>{vals[0]}</b></span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ width: 12, height: 12, background: COLORS.classes, display: "inline-block", borderRadius: 2 }} />
            <span style={{ fontSize: 13 }}>Lớp học: <b>{vals[1]}</b></span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 12, height: 12, background: COLORS.cards, display: "inline-block", borderRadius: 2 }} />
            <span style={{ fontSize: 13 }}>Bộ thẻ: <b>{vals[2]}</b></span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
            Mỗi “miền” là một danh mục, chiều cao biểu thị độ lớn (số lượng).
          </div>
        </div>
      </div>
    </div>
  );
}
