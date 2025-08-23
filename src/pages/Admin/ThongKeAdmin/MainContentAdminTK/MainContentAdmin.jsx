// src/pages/Admin/ThongKeAdmin/MainContent.jsx
import { useEffect, useState } from "react";
import TopContent from "./TopContentAdmin";
import AISummary from "./AISummary";
import MiniCharts from "./MiniCharts";

const read = (k, def = []) => {
  try {
    const raw = localStorage.getItem(k);
    const v = raw ? JSON.parse(raw) : def;
    return Array.isArray(v) ? v : def;
  } catch {
    return def;
  }
};

// dd/mm/yyyy -> Date
const parseVN = (dmy) => {
  if (!dmy) return null;
  const [d, m, y] = dmy.split("/").map(Number);
  return y ? new Date(y, (m || 1) - 1, d || 1) : null;
};
const toNum = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const priceAfter = (p) =>
  Math.max(0, Math.round(toNum(p.giaGoi) * (1 - toNum(p.giamGia) / 100)));
const ymKey = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

export default function MainContent() {
  const [userStats, setUserStats] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
  const [rawClasses, setRawClasses] = useState([]);
  const [rawCards, setRawCards] = useState([]);

  // doanh thu: { total, monthRevenue, byMonth: { "2025-08": 12345, ... } }
  const [revenue, setRevenue] = useState({
    total: 0,
    monthRevenue: 0,
    byMonth: {},
  });

  const load = () => {
    // dữ liệu chính
    const dsNguoiDung = read("nguoiDung", []);
    const dsLop = read("lop", read("class", []));
    const dsBoThe = read("cards", read("boThe", []));
    const dsGoi = read("goiTraPhi", []);
    const dsSub = read("goiTraPhiCuaNguoiDung", []);

    // thống kê số lượng
    const soNguoiDung = dsNguoiDung.length;
    const soLop = dsLop.length;
    const soBoThe = dsBoThe.length;

    // ============ TÍNH DOANH THU ============
    // map idGoi -> giá sau giảm
    const mapGia = new Map(dsGoi.map((g) => [g.idGoi, priceAfter(g)]));

    let total = 0;
    const byMonth = {};
    dsSub.forEach((s) => {
      const dt = parseVN(s.NgayBatDau) || new Date();
      const key = ymKey(dt);
      const money = mapGia.get(s.idGoi) || 0;
      total += money;
      byMonth[key] = (byMonth[key] || 0) + money;
    });
    const nowKey = ymKey(new Date());
    const monthRevenue = byMonth[nowKey] || 0;

    // cập nhật card thống kê
    setUserStats([
      { id: 1, name: "Người dùng", value: soNguoiDung, title: "Tổng số người dùng trong hệ thống" },
      { id: 2, name: "Lớp học", value: soLop, title: "Tổng số lớp học đã tạo" },
      { id: 3, name: "Bộ thẻ", value: soBoThe, title: "Tổng số bộ thẻ hiện có" },
      { id: 4, name: "Doanh thu (tháng này)", value: monthRevenue.toLocaleString("vi-VN") + " đ", title: "Tổng doanh thu tháng hiện tại" },
    ]);

    // raw cho AI
    setRawUsers(dsNguoiDung);
    setRawClasses(dsLop);
    setRawCards(dsBoThe);

    // revenue state
    setRevenue({ total, monthRevenue, byMonth });
  };

  useEffect(() => {
    load();
    // tự động reload khi localStorage đổi (mở tab khác thêm/sửa…)
    const onStorage = (e) => {
      if (
        ["nguoiDung", "lop", "class", "cards", "boThe", "goiTraPhi", "goiTraPhiCuaNguoiDung"]
          .includes(e.key)
      ) {
        load();
      }
    };
    // sự kiện tùy chỉnh (nếu trang khác có dispatch)
    const onChanged = () => load();

    window.addEventListener("storage", onStorage);
    window.addEventListener("subscriptionChanged", onChanged);
    window.addEventListener("packsChanged", onChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("subscriptionChanged", onChanged);
      window.removeEventListener("packsChanged", onChanged);
    };
  }, []);

  return (
    <div>
      <div style={{ width: "100%", height: "100px" }}>
        <h1>THỐNG KÊ</h1>
      </div>

      <div className="Top-Content">
        <TopContent userStats={userStats} />
      </div>

      {/* [AI] Tóm tắt + dự báo */}
      <div style={{ marginTop: 24 }}>
        <AISummary
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={revenue} // <-- truyền thêm (tùy bạn dùng trong component)
        />
      </div>

      {/* [AI] Biểu đồ mini */}
      <div style={{ marginTop: 16 }}>
        <MiniCharts
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={revenue} // <-- truyền thêm
        />
      </div>
    </div>
  );
}
