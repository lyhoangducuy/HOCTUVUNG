// src/pages/Lop/chucNang/ThuVienLop.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const readJSON = (k, fb = []) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; }
  catch { return fb; }
};
const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export default function ThuVienLop({ lop, onCapNhat }) {
  const navigate = useNavigate();
  if (!lop) return <div>Không tìm thấy lớp.</div>;

  // lấy object bộ thẻ theo boTheIds từ lớp truyền xuống
  const boTheTrongLop = useMemo(() => {
    const ids = Array.isArray(lop.boTheIds) ? lop.boTheIds : [];
    if (!ids.length) return [];
    const all = readJSON("boThe", []);
    return ids
      .map(id => all.find(b => String(b.idBoThe) === String(id)))
      .filter(Boolean);
  }, [lop.boTheIds]); // nhận update ngay khi cha đổi

  const xemBoThe = (idBoThe) => navigate(`/flashcard/${idBoThe}`);

  const goBoTheKhoiLop = (idBoThe) => {
    const ds = readJSON("lop", []);
    const idx = ds.findIndex(l => String(l.idLop) === String(lop.idLop));
    if (idx === -1) return;

    const lopMoi = { ...ds[idx] };
    const cur = Array.isArray(lopMoi.boTheIds) ? lopMoi.boTheIds : [];
    lopMoi.boTheIds = cur.filter(x => String(x) !== String(idBoThe));

    ds[idx] = lopMoi;
    writeJSON("lop", ds);
    onCapNhat?.(lopMoi); // báo cha -> cha setClassDetail -> re-render ngay
  };

  if (boTheTrongLop.length === 0) {
    return <div style={{opacity:.7}}>Chưa có bộ thẻ nào. Bấm “+ → Thêm bộ thẻ”.</div>;
  }

  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:16}}>
      {boTheTrongLop.map(bt => (
        <div key={bt.idBoThe}
             style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12, background:"#fff",
                     boxShadow:"0 4px 12px rgba(0,0,0,.05)", display:"flex", flexDirection:"column", gap:8, cursor:"pointer"}}
             onClick={() => xemBoThe(bt.idBoThe)}>
          <div style={{fontWeight:800, fontSize:16}}>
            {bt.tenBoThe || `Bộ thẻ #${bt.idBoThe}`}
          </div>
          <div style={{fontSize:13, opacity:.7}}>
            {bt.soTu ?? (bt.danhSachThe?.length || 0)} từ
          </div>

          <div style={{display:"flex", alignItems:"center", gap:8, marginTop:4}}>
            {bt.nguoiDung?.anhDaiDien ? (
              <img src={bt.nguoiDung.anhDaiDien} alt="" width={24} height={24}
                   style={{borderRadius:"50%", objectFit:"cover"}} onClick={(e)=>e.stopPropagation()} />
            ) : (
              <div style={{width:24, height:24, borderRadius:"50%", background:"#e5e7eb"}}
                   onClick={(e)=>e.stopPropagation()} />
            )}
            <span style={{fontSize:13, opacity:.75}}>
              {bt.nguoiDung?.tenNguoiDung || "Không rõ"}
            </span>
          </div>

          <div style={{display:"flex", gap:8, marginTop:8}}>
            <button
              style={{padding:"6px 10px", borderRadius:8, border:"1px solid #e5e7eb",
                      background:"#f9fafb", cursor:"pointer", fontSize:13}}
              onClick={(e)=> { e.stopPropagation(); xemBoThe(bt.idBoThe); }}>
              Học
            </button>
            <button
              style={{padding:"6px 10px", borderRadius:8, border:"1px solid #ef4444",
                      background:"#fef2f2", color:"#991b1b", cursor:"pointer", fontSize:13, marginLeft:"auto"}}
              onClick={(e)=> { e.stopPropagation(); goBoTheKhoiLop(bt.idBoThe); }}>
              Gỡ khỏi lớp
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
