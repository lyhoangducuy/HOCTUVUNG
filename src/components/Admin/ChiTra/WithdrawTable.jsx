// src/pages/Admin/ChiTra/components/WithdrawTable.jsx
import React from "react";

const VN = "vi-VN";
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const vnd = (n) => num(n).toLocaleString(VN) + "đ";
const toDate = (v) => (typeof v?.toDate === "function" ? v.toDate() : new Date(v || 0));
const time = (v) => {
  try { const d = toDate(v); return isNaN(d.getTime()) ? "" : d.toLocaleString(VN); }
  catch { return ""; }
};

export default function WithdrawTable({
  loading,
  rows,
  nameById,
  onApprove,
  onPaid,
  onCancel,
}) {
  return (
    <div className="rt-table-wrap">
      <table className="rt-table">
        <thead>
          <tr>
            <th>Mã YC</th>
            <th>Người dùng</th>
            <th>Số tiền</th>
            <th>Phí</th>
            <th>Thực chi</th>
            <th>Số TK NH</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th style={{ minWidth: 220 }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="rt-empty">Đang tải…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={9} className="rt-empty">Chưa có yêu cầu nào.</td></tr>
          ) : (
            rows.map((r) => {
              const st = String(r.TinhTrang || "pending");
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{nameById(r.idNguoiDung)}</td>
                  <td>{vnd(r.SoTien)}</td>
                  <td>{vnd(r.Phi)}</td>
                  <td>{vnd(r.TienSauPhi)}</td>
                  <td>{r.SoTaiKhoanNganHang || "—"}</td>
                  <td>
                    <span className={`rt-badge rt-badge--${st}`}>
                      {st === "pending" ? "Đang xử lý"
                        : st === "approved" ? "Đã duyệt"
                        : st === "paid" ? "Đã trả"
                        : "Đã hủy"}
                    </span>
                  </td>
                  <td>{time(r.NgayTao)}</td>
                  <td className="rt-actions">
                    <button
                      className="rt-btn"
                      disabled={st !== "pending"}
                      onClick={() => onApprove(r)}
                    >
                      Duyệt
                    </button>
                    <button
                      className="rt-btn"
                      disabled={!(st === "pending" || st === "approved")}
                      onClick={() => onPaid(r)}
                    >
                      Đã trả
                    </button>
                    <button
                      className="rt-btn rt-btn-danger"
                      disabled={st === "paid" || st === "canceled"}
                      onClick={() => onCancel(r)}
                    >
                      Huỷ
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
