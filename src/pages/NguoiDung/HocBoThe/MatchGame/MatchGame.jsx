import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";
import "./MatchGame.css";

/* Trộn mảng đơn giản */
function tronMang(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchGame() {
  const { id } = useParams();

  // ===== State tiếng Việt =====
  const [boThe, setBoThe] = useState(null);             // bộ thẻ đã chọn
  const [capTuNghia, setCapTuNghia] = useState([]);     // [{id, tu, nghia}]
  const [oLuoi, setOLuoi] = useState([]);               // mảng ô hiển thị: [{id, loai:'tu'|'nghia', vanBan}]
  const [chiSoDangChon, setChiSoDangChon] = useState([]); // các index đang chọn (tối đa 2)
  const [idDaGhep, setIdDaGhep] = useState(new Set());  // id cặp đã ghép đúng (để style nếu muốn)
  const [viTriAn, setViTriAn] = useState(new Set());    // index đã ẩn (giữ chỗ)
  const [thongBao, setThongBao] = useState("");         // "ĐÚNG" | "SAI" | ""
  const [khoaClick, setKhoaClick] = useState(false);    // khoá khi đang xử lý

  // ===== Lấy bộ thẻ theo id URL =====
  useEffect(() => {
    try {
      const ds = JSON.parse(localStorage.getItem("boThe") || "[]");
      const tim = Array.isArray(ds)
        ? ds.find((x) => String(x.idBoThe) === String(id))
        : null;

      if (tim?.danhSachThe?.length) {
        setBoThe(tim);
      } else {
        setBoThe(null);
      }
    } catch {
      setBoThe(null);
    }
  }, [id]);

  // Tạo cặp {id, tu, nghia}
  useEffect(() => {
    if (!boThe?.danhSachThe?.length) {
      setCapTuNghia([]);
      return;
    }
    const base = boThe.danhSachThe.map((t, i) => ({
      id: i, tu: t.tu, nghia: t.nghia,
    }));
    setCapTuNghia(base);
  }, [boThe]);

  // Tạo ô lưới (mỗi cặp thành 2 ô) + reset trạng thái
  useEffect(() => {
    if (!capTuNghia.length) {
      setOLuoi([]);
      return;
    }
    const oTu = capTuNghia.map((p) => ({ id: p.id, loai: "tu", vanBan: p.tu }));
    const oNghia = capTuNghia.map((p) => ({ id: p.id, loai: "nghia", vanBan: p.nghia }));
    setOLuoi(tronMang([...oTu, ...oNghia]));
    setIdDaGhep(new Set());
    setChiSoDangChon([]);
    setViTriAn(new Set());
    setThongBao("");
    setKhoaClick(false);
  }, [capTuNghia]);

  const chonO = (index) => {
    if (khoaClick) return;
    if (!oLuoi[index]) return;
    if (viTriAn.has(index)) return;              // đã ẩn
    if (chiSoDangChon.includes(index)) return;   // không chọn lại ô đang chọn

    const tiepTheo = [...chiSoDangChon, index].slice(-2);
    setChiSoDangChon(tiepTheo);

    if (tiepTheo.length === 2) {
      setKhoaClick(true);
      const [i1, i2] = tiepTheo;
      const a = oLuoi[i1], b = oLuoi[i2];
      const dung = a && b && a.id === b.id && a.loai !== b.loai;

      if (dung) {
        setThongBao("ĐÚNG");
        setIdDaGhep((prev) => new Set(prev).add(a.id));
        // Ẩn 2 ô nhưng giữ chỗ (CSS .gone dùng visibility:hidden)
        setViTriAn((prev) => {
          const s = new Set(prev);
          s.add(i1); s.add(i2);
          return s;
        });
        setChiSoDangChon([]);
        setTimeout(() => { setThongBao(""); setKhoaClick(false); }, 300);
      } else {
        setThongBao("SAI");
        setTimeout(() => {
          setChiSoDangChon([]);
          setThongBao("");
          setKhoaClick(false);
        }, 600);
      }
    }
  };

  const hoanThanh = viTriAn.size === oLuoi.length && oLuoi.length > 0;

  return (
    <div className="container">
      <HocBoThe_Header activeMode="game" />

      <div className="main">
        <div className="header">
          <h2 className="nameCard">{boThe?.tenBoThe || "Trò chơi ghép cặp"}</h2>
        </div>

        <div className="study">
          {!oLuoi.length ? (
            <p>Không có dữ liệu để chơi.</p>
          ) : (
            <>
              <div className="question">
                {oLuoi.map((o, idx) => {
                  const dangChon = chiSoDangChon.includes(idx);
                  const daAn = viTriAn.has(idx);
                  const daGhep = idDaGhep.has(o.id); // nếu muốn style riêng

                  return (
                    <div
                      key={`${o.loai}-${o.id}-${idx}`}
                      className={
                        `question-item${dangChon ? " selected" : ""}` +
                        (daGhep ? " matched" : "") +
                        (daAn ? " gone" : "")
                      }
                      onClick={() => chonO(idx)}
                      aria-hidden={daAn}
                    >
                      {o.vanBan}
                    </div>
                  );
                })}
              </div>

              <div className={`display ${thongBao === "ĐÚNG" ? "correct" : thongBao === "SAI" ? "wrong" : ""}`}>
                {hoanThanh ? (
                  <span className="feedback">Hoàn thành 🎉</span>
                ) : thongBao ? (
                  <span className="feedback">{thongBao}</span>
                ) : (
                  <span className="feedback" style={{ opacity: 0.6 }}>Chọn 2 ô để ghép</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
