import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./lichSuThanhToan.css"; // <-- thêm dòng này
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
  }, [navigate]);

  const hasData = rows.length > 0;

  const totalPaid = useMemo(() => {
    return rows
      .filter(r => r.trangThai === "paid")
      .reduce((s, r) => s + Number(r.soTienThanhToanThucTe ?? r.soTienThanhToan ?? 0), 0);
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
            {rows.filter(r => r.trangThai === "paid").length} giao dịch • {money(totalPaid)}
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

          <div className="ph-actions">
            <Button  onClick={() => navigate("/traphi")}>Nâng cấp gói trả phí mới</Button>
          </div>
        </div>
      )}
    </div>
  );
}
