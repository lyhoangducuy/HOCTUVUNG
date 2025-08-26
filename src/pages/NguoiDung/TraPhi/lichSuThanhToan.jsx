import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./lichSuThanhToan.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import { auth, db } from "../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";

const VN = "vi-VN";
const money = (n) => Number(n || 0).toLocaleString(VN) + " đ";

const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (typeof v === "string") {
    // dd/mm/yyyy
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const d = Number(m[1]), mo = Number(m[2]) - 1, y = Number(m[3]);
      return new Date(y, mo, d);
    }
    // ISO
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }
  return null;
};
const toVN = (v) => {
  const d = toDateFlexible(v);
  return d ? d.toLocaleString(VN) : "—";
};

export default function lichSuThanhToan() {
  const navigate = useNavigate();
  const [uid, setUid] = useState(null);
  const [orders, setOrders] = useState([]);    // thô từ donHangTraPhi
  const [packMap, setPackMap] = useState({}); // { idGoi: packDoc }

  // Lấy uid (ưu tiên Firebase Auth, fallback session cũ nếu còn)
  useEffect(() => {
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    const _uid = auth.currentUser?.uid || session?.idNguoiDung || null;
    if (!_uid) {
      navigate("/", { replace: true });
      return;
    }
    setUid(String(_uid));
  }, [navigate]);

  // Nạp đơn hàng theo user
  useEffect(() => {
    if (!uid) return;
    const qOrders = query(
      collection(db, "donHangTraPhi"),
      where("idNguoiDung", "==", String(uid))
    );
    const unsub = onSnapshot(
      qOrders,
      (snap) => {
        const list = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
        // sort mới → cũ theo createdAt
        list.sort(
          (a, b) =>
            (toDateFlexible(b.createdAt)?.getTime() || 0) -
            (toDateFlexible(a.createdAt)?.getTime() || 0)
        );
        setOrders(list);
      },
      () => setOrders([])
    );
    return () => unsub();
  }, [uid]);

  // Nạp thông tin gói theo idGoi (batch 'in' ≤ 10 mỗi lần)
  useEffect(() => {
    const ids = [
      ...new Set(
        orders
          .map((o) => (o?.idGoi != null ? String(o.idGoi) : null))
          .filter(Boolean)
      ),
    ];
    if (ids.length === 0) {
      setPackMap({});
      return;
    }
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    (async () => {
      const map = {};
      for (const c of chunks) {
        const rs = await getDocs(
          query(collection(db, "goiTraPhi"), where(documentId(), "in", c))
        );
        rs.forEach((docSnap) => {
          map[docSnap.id] = { idGoi: docSnap.id, ...docSnap.data() };
        });
      }
      setPackMap(map);
    })();
  }, [orders]);

  // Merge pack info vào order (tenGoi, thoiHanNgay)
  const rows = useMemo(() => {
    return orders.map((o) => {
      const pack = packMap[String(o.idGoi)] || {};
      return {
        ...o,
        tenGoi: o.tenGoi || pack.tenGoi || "(gói không xác định)",
        thoiHanNgay:
          o.thoiHanNgay != null ? o.thoiHanNgay : (pack.thoiHan != null ? pack.thoiHan : 0),
      };
    });
  }, [orders, packMap]);

  const hasData = rows.length > 0;

  const totalPaid = useMemo(() => {
    return rows
      .filter((r) => r.trangThai === "paid")
      .reduce(
        (s, r) => s + Number(r.soTienThanhToanThucTe ?? r.soTienThanhToan ?? 0),
        0
      );
  }, [rows]);

  return (
    <div className="ph-container">
      <div className="back" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        <span>Quay lại</span>
      </div>
      <h2 className="ph-title">Lịch sử thanh toán</h2>

      {/* Summary */}
      <div className="ph-summary">
        <div className="ph-card">
          <div className="ph-card__label">Tổng giao dịch</div>
          <div className="ph-card__value">{rows.length}</div>
        </div>
        <div className="ph-card">
          <div className="ph-card__label">Đã thanh toán</div>
          <div className="ph-card__value">
            {rows.filter((r) => r.trangThai === "paid").length} giao dịch • {money(totalPaid)}
          </div>
        </div>
      </div>

      {/* Table */}
      {!hasData ? (
        <div className="ph-empty">
          Chưa có giao dịch nào.
          <div className="ph-empty__actions">
            <Button onClick={() => navigate("/traphi")}>Mua gói ngay</Button>
          </div>
        </div>
      ) : (
        <div className="ph-table-wrap">
          <table className="ph-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Gói</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Tạo lúc</th>
                <th>Thanh toán/Hủy lúc</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const statusClass =
                  r.trangThai === "paid"
                    ? "is-paid"
                    : r.trangThai === "pending"
                    ? "is-pending"
                    : "is-canceled";
                const displayAmount =
                  r.soTienThanhToanThucTe ?? r.soTienThanhToan ?? 0;
                const timeCol =
                  r.trangThai === "paid" ? toVN(r.paidAt) : toVN(r.canceledAt);

                return (
                  <tr key={r.idDonHang || r._docId}>
                    <td className="ph-code">{r.idDonHang || r._docId}</td>
                    <td>
                      <div className="ph-pack-name">{r.tenGoi}</div>
                      <div className="ph-pack-term">
                        Thời hạn: {r.thoiHanNgay} ngày
                      </div>
                    </td>
                    <td>
                      {money(displayAmount)}
                      {Number(r.giamGia || 0) > 0 && (
                        <div className="ph-discount">Đã áp dụng -{r.giamGia}%</div>
                      )}
                    </td>
                    <td>
                      <span className={`ph-badge ${statusClass}`}>
                        {r.trangThai === "paid"
                          ? "Đã thanh toán"
                          : r.trangThai === "pending"
                          ? "Đang chờ"
                          : "Đã hủy"}
                      </span>
                    </td>
                    <td>{toVN(r.createdAt)}</td>
                    <td>{timeCol}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="ph-actions">
            <Button onClick={() => navigate("/traphi")}>
              Nâng cấp gói trả phí mới
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
