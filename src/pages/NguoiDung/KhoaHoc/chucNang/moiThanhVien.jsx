import React, { useMemo, useState, useEffect } from "react";
import "./MoiThanhVien.css";

/* ==== Helpers đọc/ghi LS gọn ==== */
const docJSON = (k, fb = []) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; }
  catch { return fb; }
};
const ghiJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* Tách nhiều input: "a, b" hoặc xuống dòng */
const tachDanhSachMoi = (txt) =>
  (txt || "")
    .split(/[\n,]+/g)
    .map(s => s.trim())
    .filter(Boolean);

/* Tìm user theo email hoặc tenNguoiDung */
const timUserTheoToken = (token, ds) => {
  const t = token.toLowerCase();
  return ds.find(u =>
    u?.email?.toLowerCase() === t ||
    u?.tenNguoiDung?.toLowerCase() === t
  ) || null;
};

/* Tạo dãy số trang gọn (có …) */
const buildPages = (current, max) => {
  const pages = [];
  if (max <= 7) {
    for (let p = 1; p <= max; p++) pages.push(p);
    return pages;
  }
  pages.push(1);
  const left = Math.max(2, current - 1);
  const right = Math.min(max - 1, current + 1);
  if (left > 2) pages.push("…");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < max - 1) pages.push("…");
  pages.push(max);
  return pages;
};

export default function MoiThanhVien({ idKhoaHoc, onCapNhat }) {
  const [textMoi, setTextMoi] = useState("");
  const [thongBao, setThongBao] = useState("");

  // cache danh sách người dùng để tra cứu
  const dsNguoiDung = useMemo(() => docJSON("nguoiDung", []), []);

  // lấy khóa học hiện tại (để render)
  const khoaHoc = useMemo(() => {
    const ds = docJSON("khoaHoc", []);
    return ds.find(kh => String(kh.idKhoaHoc) === String(idKhoaHoc)) || null;
  }, [idKhoaHoc, thongBao]);

  const thanhVienIds = Array.isArray(khoaHoc?.thanhVienIds) ? khoaHoc.thanhVienIds : [];
  const pendingIds   = Array.isArray(khoaHoc?.yeuCauThamGiaIds) ? khoaHoc.yeuCauThamGiaIds : [];
  const idChuKhoa    = khoaHoc?.idNguoiDung;

  // ===== Phân trang =====
  const PAGE_SIZE_PENDING = 5;
  const PAGE_SIZE_MEMBER  = 8;

  const [pagePending, setPagePending] = useState(1);
  const [pageMember, setPageMember]   = useState(1);

  const totalPending = pendingIds.length;
  const totalMember  = thanhVienIds.length;

  const maxPendingPage = Math.max(1, Math.ceil(totalPending / PAGE_SIZE_PENDING));
  const maxMemberPage  = Math.max(1, Math.ceil(totalMember  / PAGE_SIZE_MEMBER));

  // Clamp khi dữ liệu thay đổi
  useEffect(() => {
    if (pagePending > maxPendingPage) setPagePending(maxPendingPage);
  }, [maxPendingPage, pagePending]);

  useEffect(() => {
    if (pageMember > maxMemberPage) setPageMember(maxMemberPage);
  }, [maxMemberPage, pageMember]);

  const startPending = (pagePending - 1) * PAGE_SIZE_PENDING;
  const startMember  = (pageMember  - 1) * PAGE_SIZE_MEMBER;

  const pendingPageIds = pendingIds.slice(startPending, startPending + PAGE_SIZE_PENDING);
  const memberPageIds  = thanhVienIds.slice(startMember,  startMember  + PAGE_SIZE_MEMBER);

  // ===== Helpers =====
  const capNhatKhoaHoc = (kh) => {
    const ds = docJSON("khoaHoc", []);
    const i = ds.findIndex(x => String(x.idKhoaHoc) === String(kh.idKhoaHoc));
    if (i > -1) ds[i] = kh; else ds.push(kh);
    ghiJSON("khoaHoc", ds);
    onCapNhat?.(kh);
  };
  const getUser = (id) => dsNguoiDung.find(u => String(u.idNguoiDung) === String(id));

  // ===== Mời trực tiếp =====
  const handleMoi = () => {
    setThongBao("");
    const tokens = tachDanhSachMoi(textMoi);
    if (tokens.length === 0) {
      setThongBao("Nhập email hoặc tên người dùng trước đã.");
      return;
    }

    const idsMoi = tokens
      .map(t => timUserTheoToken(t, dsNguoiDung)?.idNguoiDung)
      .filter(Boolean);

    if (idsMoi.length === 0) {
      setThongBao("Không tìm thấy người dùng phù hợp.");
      return;
    }

    const dsKH = docJSON("khoaHoc", []);
    const i = dsKH.findIndex(kh => String(kh.idKhoaHoc) === String(idKhoaHoc));
    if (i === -1) {
      setThongBao("Không tìm thấy khóa học.");
      return;
    }

    const kh = { ...dsKH[i] };
    const cu = Array.isArray(kh.thanhVienIds) ? kh.thanhVienIds : [];
    const uniq = Array.from(new Set([...cu, ...idsMoi]));
    const soMoiThem = uniq.length - cu.length;

    kh.thanhVienIds = uniq;
    dsKH[i] = kh;
    ghiJSON("khoaHoc", dsKH);

    setTextMoi("");
    setThongBao(soMoiThem > 0 ? `Đã thêm ${soMoiThem} thành viên mới.` : "Tất cả đã có trong khóa học.");
    onCapNhat?.(kh);
  };

  // ===== Duyệt yêu cầu =====
  const chapNhan = (idNguoiDung) => {
    if (!khoaHoc) return;
    const kh = { ...khoaHoc };
    kh.yeuCauThamGiaIds = (kh.yeuCauThamGiaIds || []).filter(x => String(x) !== String(idNguoiDung));
    const cu = Array.isArray(kh.thanhVienIds) ? kh.thanhVienIds : [];
    if (!cu.includes(idNguoiDung)) cu.push(idNguoiDung);
    kh.thanhVienIds = cu;
    capNhatKhoaHoc(kh);
    setThongBao("Đã chấp nhận yêu cầu tham gia.");
  };

  const tuChoi = (idNguoiDung) => {
    if (!khoaHoc) return;
    const kh = { ...khoaHoc };
    kh.yeuCauThamGiaIds = (kh.yeuCauThamGiaIds || []).filter(x => String(x) !== String(idNguoiDung));
    capNhatKhoaHoc(kh);
    setThongBao("Đã từ chối yêu cầu tham gia.");
  };

  // ===== Quản lý thành viên =====
  const xoaThanhVien = (idNguoiDung) => {
    if (!khoaHoc) return;
    if (String(idNguoiDung) === String(idChuKhoa)) {
      alert("Không thể xóa chủ khóa học.");
      return;
    }
    if (!window.confirm("Xóa thành viên này khỏi khóa học?")) return;

    const kh = { ...khoaHoc };
    kh.thanhVienIds = (kh.thanhVienIds || []).filter(x => String(x) !== String(idNguoiDung));
    capNhatKhoaHoc(kh);
    setThongBao("Đã xóa thành viên.");
  };

  return (
    <div className="mtv-wrap">
      {/* Mời qua email / tên người dùng */}
      <section className="mtv-panel">
        <h3 className="mtv-title">Mời qua email / tên người dùng</h3>
        <textarea
          className="mtv-textarea"
          rows={3}
          placeholder="Nhập email hoặc tên người dùng (ngăn cách bởi dấu phẩy hoặc xuống dòng)"
          value={textMoi}
          onChange={(e) => setTextMoi(e.target.value)}
        />
        <div className="mtv-actions">
          <button className="mtv-btn mtv-btn--primary" onClick={handleMoi}>
            Mời
          </button>
        </div>
        {thongBao && <div className="mtv-note">{thongBao}</div>}
      </section>

      {/* YÊU CẦU THAM GIA */}
      <section className="mtv-panel">
        <div className="mtv-panel-head">
          <h3 className="mtv-title">
            Yêu cầu tham gia ({totalPending})
          </h3>
        </div>

        {totalPending === 0 ? (
          <div className="mtv-empty">Không có yêu cầu nào.</div>
        ) : (
          <>
            <ul className="mtv-list">
              {pendingPageIds.map((uid) => {
                const u = getUser(uid);
                return (
                  <li className="mtv-row" key={uid}>
                    <div className="mtv-user">
                      <strong>{u?.tenNguoiDung || "Ẩn danh"}</strong>
                      <span className="mtv-muted">({u?.email || "—"})</span>
                    </div>
                    <div className="mtv-row-actions">
                      <button className="mtv-btn mtv-btn--success" onClick={() => chapNhan(uid)}>
                        Chấp nhận
                      </button>
                      <button className="mtv-btn mtv-btn--danger" onClick={() => tuChoi(uid)}>
                        Từ chối
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {maxPendingPage > 1 && (
              <div className="mtv-pagination">
                <button
                  className="mtv-page-btn"
                  onClick={() => setPagePending(p => Math.max(1, p - 1))}
                  disabled={pagePending === 1}
                  aria-label="Trang trước"
                >
                  «
                </button>
                {buildPages(pagePending, maxPendingPage).map((p, i) =>
                  p === "…" ? (
                    <span className="mtv-page-ellipsis" key={`pp-ellipsis-${i}`}>…</span>
                  ) : (
                    <button
                      key={`pp-${p}`}
                      className={`mtv-page-btn ${p === pagePending ? "active" : ""}`}
                      onClick={() => setPagePending(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className="mtv-page-btn"
                  onClick={() => setPagePending(p => Math.min(maxPendingPage, p + 1))}
                  disabled={pagePending === maxPendingPage}
                  aria-label="Trang sau"
                >
                  »
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* THÀNH VIÊN */}
      <section className="mtv-panel">
        <div className="mtv-panel-head">
          <h3 className="mtv-title">
            Thành viên ({totalMember})
          </h3>
        </div>

        {totalMember === 0 ? (
          <div className="mtv-empty">Chưa có thành viên nào.</div>
        ) : (
          <>
            <ul className="mtv-list">
              {memberPageIds.map((uid) => {
                const u = getUser(uid);
                const isOwnerRow = String(uid) === String(idChuKhoa);
                return (
                  <li className="mtv-row" key={uid}>
                    <div className="mtv-user">
                      <strong>{u?.tenNguoiDung || "Ẩn danh"}</strong>
                      <span className="mtv-muted">({u?.email || "—"})</span>
                      {isOwnerRow && <span className="mtv-badge">Chủ khóa</span>}
                    </div>
                    {!isOwnerRow && (
                      <button className="mtv-btn mtv-btn--danger" onClick={() => xoaThanhVien(uid)}>
                        Xóa
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {maxMemberPage > 1 && (
              <div className="mtv-pagination">
                <button
                  className="mtv-page-btn"
                  onClick={() => setPageMember(p => Math.max(1, p - 1))}
                  disabled={pageMember === 1}
                  aria-label="Trang trước"
                >
                  «
                </button>
                {buildPages(pageMember, maxMemberPage).map((p, i) =>
                  p === "…" ? (
                    <span className="mtv-page-ellipsis" key={`mp-ellipsis-${i}`}>…</span>
                  ) : (
                    <button
                      key={`mp-${p}`}
                      className={`mtv-page-btn ${p === pageMember ? "active" : ""}`}
                      onClick={() => setPageMember(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className="mtv-page-btn"
                  onClick={() => setPageMember(p => Math.min(maxMemberPage, p + 1))}
                  disabled={pageMember === maxMemberPage}
                  aria-label="Trang sau"
                >
                  »
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
