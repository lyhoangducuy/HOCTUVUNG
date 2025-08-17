import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";
import "./TracNghiem.css";

/* Trộn mảng đơn giản */
function tronMang(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TracNghiem() {
  const { id } = useParams();

  // ===== State tiếng Việt, ngắn gọn =====
  const [boThe, setBoThe] = useState(null);
  const [danhSach, setDanhSach] = useState([]);      // danh sách thẻ {tu, nghia}
  const [thuTuCau, setThuTuCau] = useState([]);      // thứ tự câu hỏi (index)
  const [chiSo, setChiSo] = useState(0);             // đang ở câu số mấy
  const [cauHienTai, setCauHienTai] = useState(null);
  const [phuongAn, setPhuongAn] = useState([]);      // [{vanBan, dung}]
  const [daChon, setDaChon] = useState(false);       // đã chọn ở câu hiện tại?
  const [dapAnDaChon, setDapAnDaChon] = useState(-1);
  const [ketQua, setKetQua] = useState("");          // "dung" | "sai" | ""
  const [diem, setDiem] = useState(0);

  // ===== Lấy bộ thẻ theo id trên URL =====
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("boThe") || "[]");
      const found = Array.isArray(list)
        ? list.find((x) => String(x.idBoThe) === String(id))
        : null;

      if (found?.danhSachThe?.length) {
        setBoThe(found);
        setDanhSach(found.danhSachThe);
        setThuTuCau(tronMang(found.danhSachThe.map((_, i) => i))); // trộn thứ tự câu
        setChiSo(0);
        setDiem(0);
      } else {
        setBoThe(null);
        setDanhSach([]);
        setThuTuCau([]);
      }
    } catch {
      setBoThe(null);
      setDanhSach([]);
      setThuTuCau([]);
    }
  }, [id]);

  const tongCau = thuTuCau.length;
  const daDenCuoi = chiSo === Math.max(0, tongCau - 1);
  const hoanThanh = daDenCuoi && daChon;

  // ===== Mỗi khi đổi câu → tạo câu hỏi + phương án =====
  useEffect(() => {
    if (!danhSach.length || !thuTuCau.length) return;
    const indexCau = thuTuCau[chiSo];
    const cau = danhSach[indexCau];
    setCauHienTai(cau);

    // tạo 3 sai (nếu đủ) + 1 đúng, rồi trộn
    const chiSoSai = danhSach.map((_, i) => i).filter((i) => i !== indexCau);
    const chonSai = tronMang(chiSoSai).slice(0, Math.min(3, chiSoSai.length));
    const dsSai = chonSai.map((i) => ({ vanBan: danhSach[i].nghia, dung: false }));
    const dsDung = { vanBan: cau.nghia, dung: true };

    setPhuongAn(tronMang([dsDung, ...dsSai]));
    setDaChon(false);
    setDapAnDaChon(-1);
    setKetQua("");
  }, [danhSach, thuTuCau, chiSo]);

  // ===== Người dùng chọn đáp án =====
  const chonDapAn = (i) => {
    if (daChon) return;             // chọn rồi thì thôi
    setDaChon(true);
    setDapAnDaChon(i);

    if (phuongAn[i]?.dung) {
      setKetQua("dung");
      setDiem((d) => d + 1);
    } else {
      setKetQua("sai");
    }
  };

  // ===== Sang câu tiếp =====
  const cauTiep = () => {
    if (chiSo < tongCau - 1) {
      setChiSo((x) => x + 1);
    }
  };

  // ===== Làm lại (trộn lại thứ tự câu) =====
  const lamLai = () => {
    if (!danhSach.length) return;
    setThuTuCau(tronMang(danhSach.map((_, i) => i)));
    setChiSo(0);
    setDiem(0);
    // các state khác reset theo useEffect ở trên
  };

  return (
    <div className="tn-container">
      <HocBoThe_Header activeMode="tracnghiem" />

      {!boThe ? (
        <div className="tn-khong-thay">Không tìm thấy bộ thẻ.</div>
      ) : (
        <div className="tn-khung">
          <h2 className="tn-tieu-de">Bộ thẻ: {boThe.tenBoThe}</h2>

          <div className="tn-the-cau">
            <div className="tn-nhac">Chọn đáp án đúng của:</div>
            <div className="tn-tu">{cauHienTai?.tu || "—"}</div>
          </div>

          <div className="tn-luoi-dap-an">
            {phuongAn.map((pa, i) => (
              <button
                key={i}
                className={
                  "tn-nut-dap-an" +
                  (dapAnDaChon === i ? " da-chon" : "") +
                  (daChon && pa.dung ? " dung" : "") +
                  (daChon && dapAnDaChon === i && !pa.dung ? " sai" : "")
                }
                onClick={() => chonDapAn(i)}
                disabled={daChon}    // chọn rồi khóa
              >
                {pa.vanBan}
              </button>
            ))}
          </div>

          <div
            className={
              "tn-trang-thai " +
              (ketQua === "dung" ? "dung" : ketQua === "sai" ? "sai" : "")
            }
          >
            {ketQua === ""
              ? ""
              : ketQua === "dung"
              ? "✔️ ĐÚNG"
              : `✖️ SAI — Đáp án: ${cauHienTai?.nghia || ""}`}
          </div>

          <div className="tn-thanh-duoi">
            <span className="tn-dem">{Math.min(chiSo + 1, tongCau)}/{tongCau}</span>

            {hoanThanh ? (
              <>
                <span className="tn-diem">Điểm: {diem}/{tongCau}</span>
                <button className="tn-nut" onClick={lamLai}>Làm lại</button>
              </>
            ) : (
              <button className="tn-nut" onClick={cauTiep} disabled={!daChon}>
                Câu tiếp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
