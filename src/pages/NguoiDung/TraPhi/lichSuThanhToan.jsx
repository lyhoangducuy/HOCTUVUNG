import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./lichSuThanhToan.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const VN = "vi-VN";
const toVN = (d) => (d ? new Date(d).toLocaleString(VN) : "—");
const money = (n) => (Number(n || 0)).toLocaleString(VN) + " đ";

// helpers
const readJSON = (key, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
};

export default function lichSuThanhToan() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);

  // --- Phân trang ---
  const [page, setPage] = useState(1);
  // Trước: const [pageSize, setPageSize] = useState(10);
const [pageSize, setPageSize] = useState(5); // mặc định 5/trang
// 5/10/20/50

  useEffect(() => {
    const ss = JSON.parse(sessionStorage.getItem("session") || "null");
    if (!ss?.idNguoiDung) {
      navigate("/", { replace: true });
      return;
    }
    setUser(ss);

    const all = readJSON("donHangTraPhi", []);
    const packsById = Object.fromEntries(readJSON("goiTraPhi", []).map(p => [p.idGoi, p]));
    const mine = (all || [])
      .filter(o => o.idNguoiDung === ss.idNguoiDung)
      .map(o => ({
        ...o,
        tenGoi: o.tenGoi || packsById[o.idGoi]?.tenGoi || "(gói không xác định)",
        thoiHanNgay: o.thoiHanNgay ?? packsById[o.idGoi]?.thoiHan ?? 0,
      }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setRows(mine);
    setPage(1); // về trang đầu mỗi khi reload dữ liệu
  }, [navigate]);

  const hasData = rows.length > 0;

  // Tổng tiền đã thanh toán
  const totalPaid = useMemo(() => {
    return rows
      .filter(r => r.trangThai === "paid")
      .reduce((s, r) => s + Number(r.soTienThanhToanThucTe ?? r.soTienThanhToan ?? 0), 0);
  }, [rows]);

  // Tính phân trang
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const startIdx = (current - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageRows = rows.slice(startIdx, endIdx);

  // Nếu thay pageSize, đảm bảo page không vượt quá tổng trang
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, totalPages]);

  const goto = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const PageButtons = () => {
    // hiển thị vài nút xung quanh trang hiện tại
    const windowSize = 2; // số nút 2 bên
    const from = Math.max(1, current - windowSize);
    const to = Math.min(totalPages, current + windowSize);
    const btns = [];
    for (let i = from; i <= to; i++) {
      btns.push(
        <button
          key={i}
          className={`ph-page-btn ${i === current ? "is-active" : ""}`}
          onClick={() => goto(i)}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="ph-page-buttons">
        <button className="ph-page-btn" onClick={() => goto(1)} disabled={current === 1}>&laquo;</button>
        <button className="ph-page-btn" onClick={() => goto(current - 1)} disabled={current === 1}>&lsaquo;</button>
        {btns}
        <button className="ph-page-btn" onClick={() => goto(current + 1)} disabled={current === totalPages}>&rsaquo;</button>
        <button className="ph-page-btn" onClick={() => goto(totalPages)} disabled={current === totalPages}>&raquo;</button>
      </div>
    );
  };

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
            {rows.filter(r => r.trangThai === "paid").length} giao dịch • {money(totalPaid)}
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
                <th>Gói</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Tạo lúc</th>
                <th>Thanh toán/Hủy lúc</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const statusClass =
                  r.trangThai === "paid" ? "is-paid" :
                  r.trangThai === "pending" ? "is-pending" :
                  "is-canceled";
                const displayAmount = r.soTienThanhToanThucTe ?? r.soTienThanhToan ?? 0;
                const timeCol = r.trangThai === "paid" ? toVN(r.paidAt) : toVN(r.canceledAt);

                return (
                  <tr key={r.idDonHang}>
                    <td className="ph-code">{r.idDonHang}</td>
                    <td>
                      <div className="ph-pack-name">{r.tenGoi}</div>
                      <div className="ph-pack-term">Thời hạn: {r.thoiHanNgay} ngày</div>
                    </td>
                    <td>
                      {money(displayAmount)}
                      {Number(r.giamGia || 0) > 0 && (
                        <div className="ph-discount">Đã áp dụng -{r.giamGia}%</div>
                      )}
                    </td>
                    <td>
                      <span className={`ph-badge ${statusClass}`}>
                        {r.trangThai === "paid" ? "Đã thanh toán"
                          : r.trangThai === "pending" ? "Đang chờ"
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

          {/* Pagination */}
          <div className="ph-pagination">
            <div className="ph-page-left">
              
              
              
            </div>

            <PageButtons />
          </div>

          <div className="ph-actions">
            <Button onClick={() => navigate("/tra-phi")}>Nâng cấp gói trả phí mới</Button>
          </div>
        </div>
      )}
    </div>
  );
}
