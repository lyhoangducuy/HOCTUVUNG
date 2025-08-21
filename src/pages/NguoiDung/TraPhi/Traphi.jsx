import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./Traphi.css";

/* -------- Helpers -------- */
const VN = "vi-VN";
const genSubId = () => "SUB_" + Date.now();

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};
const toVN = (date) => new Date(date).toLocaleDateString(VN);

// dd/mm/yyyy -> Date
const parseVN = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, (m || 1) - 1, d || 1);
};

function Traphi() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [packs, setPacks] = useState([]);
  const [activeSub, setActiveSub] = useState(null); // {idGTPCND, idGoi, NgayBatDau, NgayKetThuc, status}

  // Gói mặc định nếu chưa có
  const DEFAULT_PACKS = [
    {
      idGoi: "GOI_" + (Date.now() - 2),
      tenGoi: "1 tháng",
      moTa: "Truy cập đầy đủ tính năng trong 30 ngày.",
      giaGoi: 30000,
      thoiHan: 30,
      giamGia: 0,
    },
    {
      idGoi: "GOI_" + (Date.now() - 1),
      tenGoi: "1 năm",
      moTa: "Tiết kiệm hơn với gói 12 tháng.",
      giaGoi: 120000,
      thoiHan: 365,
      giamGia: 20,
    },
  ];

  // Tính giá sau giảm
  const calcDiscounted = (gia, giamGia) => {
    const g = Number(gia || 0);
    const gg = Math.min(100, Math.max(0, Number(giamGia || 0)));
    return Math.max(0, Math.round(g * (1 - gg / 100)));
  };

  // Tải dữ liệu + xác định gói active (bỏ qua gói status = "Đã hủy")
  const loadAll = () => {
    const sessionUser = JSON.parse(sessionStorage.getItem("session") || "null");
    if (!sessionUser) {
      alert("Vui lòng đăng nhập để sử dụng tính năng trả phí.");
      navigate("/");
      return;
    }
    setCurrentUser(sessionUser);

    let storedPacks = JSON.parse(localStorage.getItem("goiTraPhi") || "[]");
    if (!Array.isArray(storedPacks) || storedPacks.length === 0) {
      storedPacks = DEFAULT_PACKS;
      localStorage.setItem("goiTraPhi", JSON.stringify(storedPacks));
    }
    setPacks(storedPacks);

    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const mySubs = subs.filter((s) => s.idNguoiDung === sessionUser.idNguoiDung);

    const today = new Date();
    const activeOnes = mySubs.filter((s) => {
      const end = parseVN(s.NgayKetThuc);
      const isCanceled = s.status === "Đã hủy";           // <-- chỉ khác ở đây
      return !isCanceled && end && end >= today;
    });

    if (activeOnes.length > 0) {
      const chosen = activeOnes.sort((a, b) => {
        const ea = parseVN(a.NgayKetThuc);
        const eb = parseVN(b.NgayKetThuc);
        return eb - ea;
      })[0];
      setActiveSub(chosen);
    } else {
      setActiveSub(null);
    }
  };

  useEffect(() => {
    loadAll();
    // reload khi nơi khác cập nhật sub
    const onSubChanged = () => loadAll();
    window.addEventListener("subscriptionChanged", onSubChanged);
    return () => window.removeEventListener("subscriptionChanged", onSubChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveSub = !!activeSub;

  // Đăng ký gói (set status = "Đang hoạt động")
  const handleSub = (pack) => {
    if (!currentUser) return;
    if (hasActiveSub) {
      alert("Bạn đã có gói đang hoạt động. Hãy hủy hoặc chờ hết hạn mới đăng ký gói khác.");
      return;
    }
    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const ngayBatDau = new Date();
    const ngayKetThuc = addDays(ngayBatDau, pack.thoiHan);

    const newSub = {
      idGTPCND: genSubId(),
      idNguoiDung: currentUser.idNguoiDung,
      idGoi: pack.idGoi,
      NgayBatDau: toVN(ngayBatDau),
      NgayKetThuc: toVN(ngayKetThuc),
      status: "Đang hoạt động", // <-- thêm trạng thái
    };

    subs.push(newSub);
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(subs));
    setActiveSub(newSub);
    window.dispatchEvent(new Event("subscriptionChanged"));
    alert("Đăng ký thành công!");
  };

  // Hủy gói: CHỈ đổi status = "Đã hủy", KHÔNG xoá record
  const handleCancel = () => {
    if (!currentUser) return;
    if (!activeSub) {
      alert("Bạn chưa có gói đang hoạt động để hủy.");
      return;
    }
    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const next = subs.map((s) =>
      s.idGTPCND === activeSub.idGTPCND ? { ...s, status: "Đã hủy" } : s
    );
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(next));
    setActiveSub(null); // để UI hết "đang hoạt động"
    alert("Đã hủy gói thành công!");
    window.dispatchEvent(new Event("subscriptionChanged"));
  };

  // Hiển thị info gói đang active
  const activePack = useMemo(() => {
    if (!activeSub) return null;
    return packs.find((p) => p.idGoi === activeSub.idGoi) || null;
  }, [activeSub, packs]);

  return (
    <div className="traphi-container">
      <h2>Danh sách gói trả phí</h2>

      {hasActiveSub && activePack && (
        <div className="active-sub">
          <div className="active-sub__title">Gói đang hoạt động</div>
          <div className="active-sub__row">
            <div>
              <div className="active-sub__name">{activePack.tenGoi}</div>
              <div className="active-sub__desc">
                Hiệu lực từ <strong>{activeSub.NgayBatDau}</strong> đến{" "}
                <strong>{activeSub.NgayKetThuc}</strong>
              </div>
            </div>
            <Button variant="cancel" onClick={handleCancel}>
              Hủy gói hiện tại
            </Button>
          </div>
        </div>
      )}

      <div className="traphi-pricing">
        {packs.length === 0 ? (
          <div className="pricing-empty">Chưa có gói để đăng ký.</div>
        ) : (
          packs.map((goi) => {
            const giaSauGiam = calcDiscounted(goi.giaGoi, goi.giamGia);
            const coGiam = Number(goi.giamGia || 0) > 0;

            return (
              <div key={goi.idGoi} className="pricing-card">
                <h3 className="pricing-title">{goi.tenGoi}</h3>
                {goi.moTa && <p className="pricing-desc">{goi.moTa}</p>}

                <div className="pricing-price">
                  {coGiam ? (
                    <>
                      <span className="price-old">
                        {Number(goi.giaGoi || 0).toLocaleString(VN)} đ
                      </span>
                      <span className="price-new">
                        {giaSauGiam.toLocaleString(VN)} đ
                      </span>
                      <span className="price-badge">-{goi.giamGia}%</span>
                    </>
                  ) : (
                    <span className="price-new">
                      {Number(goi.giaGoi || 0).toLocaleString(VN)} đ
                    </span>
                  )}
                </div>

                <p className="pricing-term">
                  <small>Thời hạn: {goi.thoiHan} ngày</small>
                </p>

                <Button
                  variant="register"
                  onClick={() => handleSub(goi)}
                  disabled={hasActiveSub}
                  title={hasActiveSub ? "Bạn đang có gói hoạt động" : "Đăng ký gói này"}
                >
                  {hasActiveSub ? "Đang có gói hoạt động" : "Đăng ký"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Traphi;
