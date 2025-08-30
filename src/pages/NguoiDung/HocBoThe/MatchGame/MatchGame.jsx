import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";
import "./MatchGame.css";

import { db } from "../../../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

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

  // ===== State =====
  const [boThe, setBoThe] = useState(null); // bộ thẻ đã chọn
  const [capTuNghia, setCapTuNghia] = useState([]); // [{id, tu, nghia}]
  const [oLuoi, setOLuoi] = useState([]); // [{id, loai:'tu'|'nghia', vanBan}]
  const [chiSoDangChon, setChiSoDangChon] = useState([]); // index đang chọn (<=2)
  const [viTriAn, setViTriAn] = useState(new Set()); // index đã ẩn (giữ chỗ)
  const [thongBao, setThongBao] = useState(""); // "ĐÚNG" | "SAI" | ""
  const [khoaClick, setKhoaClick] = useState(false); // khoá khi đang xử lý
  const [loading, setLoading] = useState(true);

  // ===== Lấy bộ thẻ từ Firestore =====
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setBoThe(null);

    const ref = doc(db, "boThe", String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setBoThe(data);
        setLoading(false);
      },
      () => {
        setBoThe(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  // Tạo cặp {id, tu, nghia}
  useEffect(() => {
    if (!boThe?.danhSachThe?.length) {
      setCapTuNghia([]);
      return;
    }
    const base = boThe.danhSachThe.map((t, i) => ({
      id: i,
      tu: t.tu,
      nghia: t.nghia,
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
    const oNghia = capTuNghia.map((p) => ({
      id: p.id,
      loai: "nghia",
      vanBan: p.nghia,
    }));
    setOLuoi(tronMang([...oTu, ...oNghia]));
    setChiSoDangChon([]);
    setViTriAn(new Set());
    setThongBao("");
    setKhoaClick(false);
  }, [capTuNghia]);

  const chonO = (index) => {
    if (khoaClick) return;
    if (!oLuoi[index]) return;
    if (viTriAn.has(index)) return;
    if (chiSoDangChon.includes(index)) return;

    const tiepTheo = [...chiSoDangChon, index].slice(-2);
    setChiSoDangChon(tiepTheo);

    if (tiepTheo.length === 2) {
      setKhoaClick(true);
      const [i1, i2] = tiepTheo;
      const a = oLuoi[i1],
        b = oLuoi[i2];

      const dung = a && b && a.loai !== b.loai && a.id === b.id;

      if (dung) {
        setThongBao("ĐÚNG");
        // ẩn sau 300ms để người chơi kịp thấy feedback
        setTimeout(() => {
          setViTriAn((prev) => {
            const s = new Set(prev);
            s.add(i1);
            s.add(i2);
            return s;
          });
          setChiSoDangChon([]);
          setThongBao("");
          setKhoaClick(false);
        }, 300);
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
          {loading ? (
            <p>Đang tải...</p>
          ) : !oLuoi.length ? (
            <p>Không có dữ liệu để chơi.</p>
          ) : (
            <>
              <div className="question">
                {oLuoi.map((o, idx) => {
                  const dangChon = chiSoDangChon.includes(idx);
                  const daAn = viTriAn.has(idx);
                  return (
                    <div
                      key={`${o.loai}-${o.id}-${idx}`}
                      className={
                        `question-item${dangChon ? " selected" : ""}` +
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

              <div
                className={`display ${
                  thongBao === "ĐÚNG"
                    ? "correct"
                    : thongBao === "SAI"
                    ? "wrong"
                    : ""
                }`}
              >
                {hoanThanh ? (
                  <span className="feedback">Hoàn thành 🎉</span>
                ) : thongBao ? (
                  <span className="feedback">{thongBao}</span>
                ) : (
                  <span className="feedback" style={{ opacity: 0.6 }}>
                    Chọn 2 ô để ghép
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
