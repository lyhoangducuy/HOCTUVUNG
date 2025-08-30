// src/pages/NguoiDung/Vi/lichSuThanhToan.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./lichSuThanhToan.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import { auth, db } from "../../../../lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const VN = "vi-VN";
const money = (n) => Number(n || 0).toLocaleString(VN) + " đ";

const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (typeof v === "string") {
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }
  if (typeof v === "number") return new Date(v);
  return null;
};
const toVN = (v) => {
  const d = toDateFlexible(v);
  return d ? d.toLocaleString(VN) : "—";
};
const addDays = (dateLike, days) => {
  const d = toDateFlexible(dateLike);
  if (!d) return null;
  const x = new Date(d);
  x.setDate(x.getDate() + Number(days || 0));
  return x;
};

export default function LichSuThanhToan() {
  const navigate = useNavigate();
  const [uid, setUid] = useState(null);

  // 2 luồng dữ liệu theo loại hóa đơn
  const [ordersCourse, setOrdersCourse] = useState([]);
  const [ordersUpgrade, setOrdersUpgrade] = useState([]);

  // Lấy uid (Auth -> session)
  useEffect(() => {
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    const _uid = auth.currentUser?.uid || session?.idNguoiDung || null;
    if (!_uid) {
      navigate("/", { replace: true });
      return;
    }
    setUid(String(_uid));
  }, [navigate]);

  // ====== Lấy hóa đơn theo user & loaiThanhToan ======
  useEffect(() => {
    if (!uid) return;

    const qCourse = query(
      collection(db, "hoaDon"),
      where("idNguoiDung", "==", String(uid)),
      where("loaiThanhToan", "==", "muaKhoaHoc")
    );
    const qUpgrade = query(
      collection(db, "hoaDon"),
      where("idNguoiDung", "==", String(uid)),
      where("loaiThanhToan", "==", "nangCapTraPhi")
    );

    const u1 = onSnapshot(
      qCourse,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, idHoaDon: d.id, ...d.data() }));
        setOrdersCourse(list);
      },
      () => setOrdersCourse([])
    );
    const u2 = onSnapshot(
      qUpgrade,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, idHoaDon: d.id, ...d.data() }));
        setOrdersUpgrade(list);
      },
      () => setOrdersUpgrade([])
    );

    return () => {
      try { u1(); } catch { }
      try { u2(); } catch { }
    };
  }, [uid]);

  // Gộp + sort mới → cũ (ưu tiên paidAt, rồi canceledAt, rồi createdAt)
  const rows = useMemo(() => {
    const list = [...ordersCourse, ...ordersUpgrade];
    list.sort((a, b) => {
      const tB =
        toDateFlexible(b.paidAt || b.canceledAt || b.createdAt)?.getTime() || 0;
      const tA =
        toDateFlexible(a.paidAt || a.canceledAt || a.createdAt)?.getTime() || 0;
      return tB - tA;
    });
    return list;
  }, [ordersCourse, ordersUpgrade]);

  const hasData = rows.length > 0;

  const totalPaid = useMemo(
    () =>
      rows
        .filter((r) => r.trangThai === "paid")
        .reduce(
          (s, r) => s + Number(r.soTienThanhToanThucTe ?? r.soTienThanhToan ?? 0),
          0
        ),
    [rows]
  );

  /* ==== Phân trang (client) ==== */
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page]);

  const goPage = (p) => setPage(Math.min(totalPages, Math.max(1, p)));

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
            <Button onClick={() => navigate("/tra-phi")}>Mua gói ngay</Button>
          </div>
        </div>
      ) : (
        <div className="ph-table-wrap">
          <table className="ph-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Gói / Khoá học</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Tạo lúc</th>
                <th>Thanh toán/Hủy lúc</th>
                <th>Ngày hết hạn</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => {
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

                let endDateText = "—";
                if (r.trangThai === "paid" && Number(r.thoiHanNgay || 0) > 0) {
                  const end = addDays(r.paidAt, r.thoiHanNgay);
                  endDateText = end ? end.toLocaleDateString(VN) : "—";
                }

                return (
                  <tr key={r.idHoaDon || r.id}>
                    <td className="ph-code">{r.idHoaDon || r.id}</td>
                    <td>
                      <div className="ph-pack-name">{r.tenGoi || "—"}</div>
                      <div className="ph-pack-term">
                        Thời hạn: {Number(r.thoiHanNgay || 0)} ngày
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
                    <td>{endDateText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="ph-pagination">
            <div className="ph-actions">
              <Button onClick={() => navigate("/tra-phi")} variant="blue">
                Nâng cấp gói trả phí mới
              </Button>
            </div>

            {/* Nút lùi */}
            <button
              className="ph-page-btn"
              onClick={() => goPage(page - 1)}
              disabled={page <= 1}
              aria-label="Trang trước"
            >
              ← Trước
            </button>

            <div className="ph-page-numbers">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`ph-page-number ${p === page ? "active" : ""}`}
                    onClick={() => goPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Nút tới */}
            <button
              className="ph-page-btn"
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages}
              aria-label="Trang sau"
            >
              Sau →
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
