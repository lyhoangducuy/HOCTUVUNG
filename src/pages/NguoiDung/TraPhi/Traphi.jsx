// src/pages/NguoiDung/TraPhi/Traphi.jsx
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
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* -------- Helpers -------- */
const VN = "vi-VN";
const toVN = (date) => new Date(date).toLocaleDateString(VN);

// khớp với logic Header (nhận diện “đã hủy”)
const isCanceled = (s) => {
  const t = String(s || "").toLowerCase();
  const noAccent = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t === "đã hủy" || noAccent === "da huy") return true;
  return (
    t.includes("hủy") ||
    t.includes("huỷ") ||
    noAccent.includes("huy") ||
    /cancel|canceled|cancelled/.test(noAccent)
  );
};
const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "string") {
    const [d, m, y] = v.split("/").map(Number);
    if (y) return new Date(y, (m || 1) - 1, d || 1);
    const dISO = new Date(v);
    return isNaN(dISO) ? null : dISO;
  }
  return null;
};

function Traphi() {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [packs, setPacks] = useState([]);
  const [isPrime, setIsPrime] = useState(false); // đọc từ nguoiDung.traPhi
  const [cancelling, setCancelling] = useState(false);

  // Lấy uid realtime (Auth) + fallback session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.uid) {
        setUid(u.uid);
      } else {
        try {
          const session = JSON.parse(sessionStorage.getItem("session") || "null");
          const fallback = session?.idNguoiDung || null;
          if (!fallback) {
            alert("Vui lòng đăng nhập để sử dụng tính năng trả phí.");
            navigate("/dang-nhap");
            return;
          }
          setUid(String(fallback));
        } catch {
          alert("Vui lòng đăng nhập để sử dụng tính năng trả phí.");
          navigate("/dang-nhap");
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  // Đọc trạng thái Prime từ nguoiDung/{uid}.traPhi
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, "nguoiDung", String(uid)),
      (snap) => {
        const data = snap.data() || {};
        setIsPrime(Boolean(data.traPhi));
      },
      () => setIsPrime(false)
    );
    return () => unsub();
  }, [uid]);

  // Tính giá sau giảm
  const calcDiscounted = (gia, giamGia) => {
    const g = Number(gia || 0);
    const gg = Math.min(100, Math.max(0, Number(giamGia || 0)));
    return Math.max(0, Math.round(g * (1 - gg / 100)));
  };

  // Nạp danh sách gói
  useEffect(() => {
    const qPacks = query(collection(db, "goiTraPhi"), orderBy("giaGoi", "asc"));
    const unsub = onSnapshot(
      qPacks,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          return { ...data, idGoi: data.idGoi ?? d.id };
        });
        setPacks(list);
      },
      () => setPacks([])
    );
    return () => unsub();
  }, []);

  // HỦY NÂNG CẤP (trả lại thường)
  const cancelPrime = async () => {
    if (!uid || !isPrime) return;
    const ok = window.confirm("Bạn chắc chắn muốn hủy nâng cấp tài khoản (Prime) ngay bây giờ?");
    if (!ok) return;

    setCancelling(true);
    try {
      // 1) Tắt cờ traPhi trên hồ sơ
      await updateDoc(doc(db, "nguoiDung", String(uid)), {
        traPhi: false,
        traPhiHuyAt: serverTimestamp(),
      });

      // 2) Đánh dấu các gói đang hoạt động là canceled
      const qSubs = query(collection(db, "goiTraPhiCuaNguoiDung"), where("idNguoiDung", "==", String(uid)));
      const ss = await getDocs(qSubs);
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const tasks = ss.docs.map((d) => {
        const x = d.data() || {};
        const end = toDateFlexible(x?.NgayKetThuc);
        const stillActive = end instanceof Date && !isNaN(end) && end >= today;
        if (!isCanceled(x?.status) && stillActive) {
          return updateDoc(d.ref, {
            status: "canceled",
            NgayHuy: serverTimestamp(),
            NgayKetThuc: serverTimestamp(), // cắt hạn ngay
          });
        }
        return Promise.resolve();
      });
      await Promise.all(tasks);

      setIsPrime(false);
      alert("Đã hủy nâng cấp tài khoản. Bạn có thể đăng ký lại bất cứ lúc nào.");
    } catch (e) {
      console.error("Hủy nâng cấp lỗi:", e);
      alert("Không thể hủy nâng cấp. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  };

  // Tạo HÓA ĐƠN pending và điều hướng Checkout (ghi vào collection 'hoaDon')
  const handleSub = async (pack) => {
    if (!uid) return;
    if (isPrime) {
      alert("Bạn đã là hội viên. Không cần đăng ký thêm.");
      return;
    }

    try {
      const giaSauGiam = calcDiscounted(pack.giaGoi, pack.giamGia);

      const payload = {
        idHoaDon: "",
        idNguoiDung: String(uid),
        idGoi: String(pack.idGoi),
        tenGoi: pack.tenGoi || "",
        giaGoc: Number(pack.giaGoi || 0),
        giamGia: Number(pack.giamGia || 0),
        soTienThanhToan: giaSauGiam,
        soTienThanhToanThucTe: giaSauGiam,
        thoiHanNgay: Number(pack.thoiHan || 0),
        trangThai: "pending",
        createdAt: serverTimestamp(),
        loaiThanhToan: "nangCapTraPhi",
      };

      const ref = await addDoc(collection(db, "hoaDon"), payload);
      await updateDoc(doc(db, "hoaDon", ref.id), { idHoaDon: ref.id });

      navigate("/checkout", { state: { orderId: ref.id } });
    } catch (e) {
      console.error(e);
      alert("Không thể tạo hóa đơn. Vui lòng thử lại.");
    }
  };

  return (
    <div className="traphi-container">
      <h2>Gói hội viên</h2>

      {isPrime && (
        <div className="active-sub">
          <div className="active-sub__title">Trạng thái</div>
          <div className="active-sub__row">
            <div>
              <div className="active-sub__name">Bạn đang là hội viên</div>
              <div className="active-sub__desc">
                Tài khoản đã kích hoạt <strong>Prime</strong>. Bạn có thể học toàn bộ nội dung dành cho hội viên.
              </div>
            </div>

            {/* chỉ còn 1 nút Hủy nâng cấp */}
            <Button
              variant="cancel"
              onClick={cancelPrime}
              disabled={cancelling}
              title="Hủy nâng cấp tài khoản"
            >
              {cancelling ? "Đang hủy…" : "Hủy nâng cấp"}
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
                  disabled={isPrime}
                  title={isPrime ? "Bạn đã là hội viên" : "Đăng ký gói này"}
                >
                  {isPrime ? "Đã là hội viên" : "Đăng ký"}
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
