import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./Traphi.css";

import { auth, db } from "../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

/* -------- Helpers -------- */
const VN = "vi-VN";
const genId = (p) => `${p}_${Date.now()}`;

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

// cố gắng chuyển nhiều kiểu ngày (Timestamp, string VN/ISO, Date) -> Date
const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (typeof v === "string") return parseVN(v) || new Date(v);
  return null;
};

function Traphi() {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [packs, setPacks] = useState([]);
  const [activeSub, setActiveSub] = useState(null); // { ...data, _docId }

  // Tính giá sau giảm
  const calcDiscounted = (gia, giamGia) => {
    const g = Number(gia || 0);
    const gg = Math.min(100, Math.max(0, Number(giamGia || 0)));
    return Math.max(0, Math.round(g * (1 - gg / 100)));
  };

  // Lấy uid (ưu tiên Firebase Auth, fallback session nếu app vẫn set)
  useEffect(() => {
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    const _uid = auth.currentUser?.uid || session?.idNguoiDung || null;
    if (!_uid) {
      alert("Vui lòng đăng nhập để sử dụng tính năng trả phí.");
      navigate("/dang-nhap");
      return;
    }
    setUid(String(_uid));
  }, [navigate]);

  // Nạp danh sách gói (goiTraPhi)
  useEffect(() => {
    const qPacks = query(collection(db, "goiTraPhi"), orderBy("giaGoi", "asc"));
    const unsub = onSnapshot(
      qPacks,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          // idGoi: ưu tiên field trong doc, fallback sang doc id
          return { ...data, idGoi: data.idGoi ?? d.id };
        });
        setPacks(list);
      },
      () => setPacks([])
    );
    return () => unsub();
  }, []);

  // Nạp gói đang hoạt động của user (goiTraPhiCuaNguoiDung)
  useEffect(() => {
    if (!uid) return;
    const qSubs = query(
      collection(db, "goiTraPhiCuaNguoiDung"),
      where("idNguoiDung", "==", String(uid))
    );
    const unsub = onSnapshot(
      qSubs,
      (snap) => {
        const today = new Date();
        const items = snap.docs.map((d) => ({ ...d.data(), _docId: d.id }));
        // lọc các sub còn hạn và chưa hủy
        const active = items
          .filter((s) => {
            if (s?.status === "Đã hủy") return false;
            const end = toDateFlexible(s?.NgayKetThuc);
            return end && end >= today;
          })
          // lấy sub có hạn xa nhất (nếu nhiều)
          .sort(
            (a, b) =>
              (toDateFlexible(b.NgayKetThuc)?.getTime() || 0) -
              (toDateFlexible(a.NgayKetThuc)?.getTime() || 0)
          )[0];
        setActiveSub(active || null);
      },
      () => setActiveSub(null)
    );
    return () => unsub();
  }, [uid]);

  const hasActiveSub = !!activeSub;

  // Tạo đơn hàng pending và điều hướng Checkout
  const handleSub = async (pack) => {
    if (!uid) return;
    if (hasActiveSub) {
      alert("Bạn đã có gói đang hoạt động. Hãy hủy hoặc chờ hết hạn mới đăng ký gói khác.");
      return;
    }

    try {
      const giaSauGiam = calcDiscounted(pack.giaGoi, pack.giamGia);

      const payload = {
        idDonHang: "", // sẽ gán bằng doc id ngay sau khi tạo
        idNguoiDung: String(uid),
        idGoi: String(pack.idGoi),
        tenGoi: pack.tenGoi || "",
        giaGoc: Number(pack.giaGoi || 0),
        giamGia: Number(pack.giamGia || 0),
        soTienThanhToan: giaSauGiam,
        thoiHanNgay: Number(pack.thoiHan || 0),
        trangThai: "pending", // pending | paid | canceled
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, "donHangTraPhi"), payload);
      // cập nhật idDonHang = doc id cho đồng nhất với app cũ
      await updateDoc(doc(db, "donHangTraPhi", ref.id), { idDonHang: ref.id });

      navigate("/checkout", { state: { orderId: ref.id } });
    } catch (e) {
      console.error(e);
      alert("Không thể tạo đơn hàng. Vui lòng thử lại.");
    }
  };

  // Hiển thị info gói đang active
  const activePack = useMemo(() => {
    if (!activeSub) return null;
    return packs.find((p) => String(p.idGoi) === String(activeSub.idGoi)) || null;
  }, [activeSub, packs]);

  const handleCancel = async () => {
    if (!uid || !activeSub?._docId) {
      alert("Bạn chưa có gói đang hoạt động để hủy.");
      return;
    }
    try {
      await updateDoc(doc(db, "goiTraPhiCuaNguoiDung", activeSub._docId), {
        status: "Đã hủy",
      });
      alert("Đã hủy gói thành công!");
    } catch (e) {
      console.error(e);
      alert("Không thể hủy gói. Vui lòng thử lại.");
    }
  };

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
                Hiệu lực từ{" "}
                <strong>
                  {typeof activeSub.NgayBatDau === "string"
                    ? activeSub.NgayBatDau
                    : toVN(toDateFlexible(activeSub.NgayBatDau))}
                </strong>{" "}
                đến{" "}
                <strong>
                  {typeof activeSub.NgayKetThuc === "string"
                    ? activeSub.NgayKetThuc
                    : toVN(toDateFlexible(activeSub.NgayKetThuc))}
                </strong>
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
