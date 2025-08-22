import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* Helpers gọn */
const docJSON = (k, fb = []) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; }
  catch { return fb; }
};
const ghiJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export default function chonBoThe({
  idKhoaHoc,     // 🔹 ID khóa học (bắt buộc)
  onDong,        // đóng popup
  onCapNhat,     // trả khóa học mới lên cha
}) {
  const navigate = useNavigate();

  // phiên đăng nhập
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);
  const idNguoiDung = session?.idNguoiDung;

  // danh sách bộ thẻ của user hiện tại
  const danhSachBoThe = useMemo(() => {
    const all = docJSON("boThe", []);
    if (!idNguoiDung) return [];
    return all.filter((b) => b?.idNguoiDung === idNguoiDung);
  }, [idNguoiDung]);

  // khóa học hiện tại
  const khoaHocHienTai = useMemo(() => {
    const dsKH = docJSON("khoaHoc", []);
    return dsKH.find((kh) => String(kh.idKhoaHoc) === String(idKhoaHoc)) || null;
  }, [idKhoaHoc]);

  const boTheDaCo = useMemo(
    () => new Set(Array.isArray(khoaHocHienTai?.boTheIds) ? khoaHocHienTai.boTheIds : []),
    [khoaHocHienTai]
  );

  const [daChon, setDaChon] = useState(new Set()); // idBoThe đã chọn
  const [tim, setTim] = useState("");

  const toggleChon = (idBoThe) => {
    setDaChon((prev) => {
      const s = new Set(prev);
      if (s.has(idBoThe)) s.delete(idBoThe);
      else s.add(idBoThe);
      return s;
    });
  };

  const danhSachLoc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    if (!q) return danhSachBoThe;
    return danhSachBoThe.filter(
      (b) => b.tenBoThe?.toLowerCase().includes(q) || String(b.idBoThe).includes(q)
    );
  }, [tim, danhSachBoThe]);

  const xuLyXacNhan = () => {
    if (!khoaHocHienTai) return;

    const dsKH = docJSON("khoaHoc", []);
    const i = dsKH.findIndex((kh) => String(kh.idKhoaHoc) === String(idKhoaHoc));
    if (i === -1) return;

    const cu = Array.isArray(dsKH[i].boTheIds) ? dsKH[i].boTheIds : [];
    const them = Array.from(daChon).filter((id) => !boTheDaCo.has(id));
    dsKH[i] = { ...dsKH[i], boTheIds: Array.from(new Set([...cu, ...them])) };

    ghiJSON("khoaHoc", dsKH);
    window.dispatchEvent(new Event("khoaHocUpdated"));

    onCapNhat?.(dsKH[i]); // cập nhật UI cha
    onDong?.();
  };

  const diTaoBoThe = () => {
    onDong?.();
    navigate("/newBoThe");
  };

  if (!khoaHocHienTai) {
    return (
      <div className="popup-overlay">
        <div className="popup-content" style={{ width: 520 }}>
          <div className="popup-header">
            <h3>Không tìm thấy khóa học</h3>
            <button className="popup-close" onClick={onDong}>✕</button>
          </div>
          <div className="popup-body" style={{ padding: 12 }}>
            Vui lòng kiểm tra lại <code>idKhoaHoc</code>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-overlay">
      <div className="popup-content" style={{ width: 640 }}>
        <div className="popup-header">
          <h3>Chọn bộ thẻ để thêm vào khóa học</h3>
          <button className="popup-close" onClick={onDong}>✕</button>
        </div>

        <div className="popup-body" style={{ gap: 12 }}>
          <input
            className="popup-input"
            placeholder="Tìm theo tên hoặc ID bộ thẻ…"
            value={tim}
            onChange={(e) => setTim(e.target.value)}
          />

          {/* Danh sách bộ thẻ */}
          <div
            style={{
              maxHeight: 360,
              overflow: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 8,
            }}
          >
            {danhSachLoc.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.7 }}>Chưa có bộ thẻ nào.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {danhSachLoc.map((bt) => {
                  const daCo = boTheDaCo.has(bt.idBoThe);
                  const checked = daChon.has(bt.idBoThe);
                  return (
                    <li
                      key={bt.idBoThe}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "24px 1fr auto",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 8px",
                        borderBottom: "1px dashed #eee",
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled={daCo}
                        checked={checked || daCo}
                        onChange={() => toggleChon(bt.idBoThe)}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {bt.tenBoThe || `Bộ thẻ #${bt.idBoThe}`}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {bt.soTu ?? (bt.danhSachThe?.length || 0)} từ • ID: {bt.idBoThe}
                        </div>
                      </div>
                      {daCo && (
                        <span
                          style={{
                            fontSize: 12,
                            padding: "4px 8px",
                            background: "#f3f4f6",
                            borderRadius: 999,
                          }}
                        >
                          Đã có trong khóa học
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="popup-footer" style={{ gap: 8 }}>
          <button
            className="btn-primary"
            onClick={diTaoBoThe}
            style={{ background: "#6b7280" }}
          >
            Tạo bộ thẻ mới
          </button>
          <button className="btn-primary" onClick={xuLyXacNhan}>
            Thêm vào khóa học
          </button>
        </div>
      </div>
    </div>
  );
}
