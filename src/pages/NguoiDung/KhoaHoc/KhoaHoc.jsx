// Lop.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Lop.css";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEllipsisH, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import MoiThanhVien from "./chucNang/moiThanhVien";
import ThuVienLop from "./chucNang/thuVienLop";
import LopMenu from "./chucNang/lopMenu";
import ChiTietLopModal from "./chucNang/chiTietLop";
import ChonBoThe from "./chucNang/chonBoThe";
import FeedbackTab from "./chucNang/feedBackTab";

const readJSON = (k, fb) => {
  try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? fb; }
  catch { return fb; }
};

export default function Lop() {
  const { id } = useParams(); // idKhoaHoc từ route /lop/:id
  const navigate = useNavigate();

  const [chiTietKhoaHoc, setChiTietKhoaHoc] = useState(null);
  const [hienDropdown, setHienDropdown] = useState(false);
  const [tabDangChon, setTabDangChon] = useState("thuVien");
  const [hienMenu3Cham, setHienMenu3Cham] = useState(false);
  const nutMenuRef = useRef(null);
  const [moChiTietKhoaHoc, setMoChiTietKhoaHoc] = useState(false);
  const [moChonBoThe, setMoChonBoThe] = useState(false);
  const [daYeuCau, setDaYeuCau] = useState(false);

  // nạp khóa học theo id
  useEffect(() => {
    const dsKH = readJSON("khoaHoc", []);
    const kh = dsKH.find((x) => String(x.idKhoaHoc) === String(id)) || null;
    if (kh) {
      if (!Array.isArray(kh.thanhVienIds)) kh.thanhVienIds = [];
      if (!Array.isArray(kh.boTheIds)) kh.boTheIds = [];
      if (!Array.isArray(kh.folderIds)) kh.folderIds = [];
      if (!Array.isArray(kh.kienThuc)) kh.kienThuc = [];
      if (!Array.isArray(kh.yeuCauThamGiaIds)) kh.yeuCauThamGiaIds = [];
    }
    setChiTietKhoaHoc(kh);
  }, [id]);

  // reload khi nơi khác sửa khóa học
  useEffect(() => {
    const reload = () => {
      const ds = readJSON("khoaHoc", []);
      const kh = ds.find((k) => String(k.idKhoaHoc) === String(id)) || null;
      setChiTietKhoaHoc(kh);
    };
    window.addEventListener("khoaHocChanged", reload);
    return () => window.removeEventListener("khoaHocChanged", reload);
  }, [id]);

  const dsNguoiDung = useMemo(() => readJSON("nguoiDung", []), []);
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);

  const isOwner = useMemo(() => {
    if (!chiTietKhoaHoc || !session?.idNguoiDung) return false;
    return String(chiTietKhoaHoc.idNguoiDung) === String(session.idNguoiDung);
  }, [chiTietKhoaHoc, session]);

  const canLeave = useMemo(() => {
    if (!chiTietKhoaHoc || !session?.idNguoiDung) return false;
    if (String(chiTietKhoaHoc.idNguoiDung) === String(session.idNguoiDung)) return false; // chủ không rời
    const tv = Array.isArray(chiTietKhoaHoc.thanhVienIds) ? chiTietKhoaHoc.thanhVienIds : [];
    return tv.some(x => String(x) === String(session.idNguoiDung));
  }, [chiTietKhoaHoc, session]);

  const isMember = canLeave || isOwner;
  const canViewInside = isOwner || isMember;

  // đã gửi yêu cầu?
  useEffect(() => {
    if (!chiTietKhoaHoc || !session?.idNguoiDung) { setDaYeuCau(false); return; }
    setDaYeuCau((chiTietKhoaHoc.yeuCauThamGiaIds || []).includes(session.idNguoiDung));
  }, [chiTietKhoaHoc, session]);

  const thanhVien = useMemo(() => {
    if (!chiTietKhoaHoc?.thanhVienIds?.length) return [];
    return chiTietKhoaHoc.thanhVienIds
      .map((uid) => dsNguoiDung.find((u) => u.idNguoiDung === uid))
      .filter(Boolean);
  }, [chiTietKhoaHoc, dsNguoiDung]);

  const doiTrangThaiDropdown = () => setHienDropdown((prev) => !prev);
  const moHopThoaiChiTiet = () => setMoChiTietKhoaHoc(true);

  const xoaKhoaHoc = () => {
    if (!chiTietKhoaHoc) return;
    const xacNhan = window.confirm(`Xóa khóa học "${chiTietKhoaHoc.tenKhoaHoc || ""}"?`);
    if (!xacNhan) return;
    const ds = readJSON("khoaHoc", []);
    const dsMoi = ds.filter((k) => String(k.idKhoaHoc) !== String(chiTietKhoaHoc.idKhoaHoc));
    localStorage.setItem("khoaHoc", JSON.stringify(dsMoi));
    alert("Đã xóa khóa học.");
    navigate("/thuviencuatoi");
  };

  const saveCourse = (kh) => {
    const ds = readJSON("khoaHoc", []);
    const idx = ds.findIndex((k) => String(k.idKhoaHoc) === String(kh.idKhoaHoc));
    if (idx > -1) ds[idx] = { ...ds[idx], ...kh };
    else ds.push(kh);
    localStorage.setItem("khoaHoc", JSON.stringify(ds));
    window.dispatchEvent(new Event("khoaHocChanged"));
  };

  const luuChiTietKhoaHoc = (khDaSua) => {
    saveCourse(khDaSua);
    setChiTietKhoaHoc(khDaSua);
  };

  const guiYeuCau = () => {
    if (!session?.idNguoiDung) {
      if (window.confirm("Bạn cần đăng nhập để gửi yêu cầu. Đi đến trang đăng nhập?")) {
        navigate("/dang-nhap");
      }
      return;
    }
    const kh = { ...(chiTietKhoaHoc || {}) };
    kh.yeuCauThamGiaIds = Array.isArray(kh.yeuCauThamGiaIds) ? kh.yeuCauThamGiaIds : [];
    if (!kh.yeuCauThamGiaIds.includes(session.idNguoiDung)) {
      kh.yeuCauThamGiaIds.push(session.idNguoiDung);
      saveCourse(kh);
      setChiTietKhoaHoc(kh);
      setDaYeuCau(true);
      alert("Đã gửi yêu cầu tham gia. Vui lòng chờ giảng viên duyệt.");
    }
  };

  const GateCard = () => {
    const soBoThe = chiTietKhoaHoc?.boTheIds?.length || 0;
    const soTV = chiTietKhoaHoc?.thanhVienIds?.length || 0;
    const tags = chiTietKhoaHoc?.kienThuc || [];
    return (
      <div
        style={{
          gridColumn: "1 / -1",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
          boxShadow: "0 8px 20px rgba(0,0,0,.06)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Thông tin khóa học</h3>
        <div style={{ marginTop: 10, color: "#374151" }}>
          <div style={{ marginBottom: 6 }}>
            <strong>Mô tả:</strong> {chiTietKhoaHoc?.moTa || "—"}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Kiến thức:</strong>{" "}
            {tags.length ? tags.map((t, i) => (
              <span key={i} style={{
                display: "inline-block",
                padding: "4px 8px",
                border: "1px solid #e5e7eb",
                borderRadius: 999,
                fontSize: 12,
                marginRight: 6,
                marginTop: 6,
              }}>{t}</span>
            )) : "—"}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Số bộ thẻ:</strong> {soBoThe}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Thành viên:</strong> {soTV}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn-join" onClick={guiYeuCau} disabled={daYeuCau}>
            {daYeuCau ? "Đã gửi yêu cầu" : "Yêu cầu tham gia"}
          </button>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            Sau khi được duyệt, bạn sẽ xem toàn bộ nội dung.
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="thong-tin-lop">
        <div className="back" onClick={() => navigate(-1)} title="Quay lại">
          <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
          Quay lại
        </div>

        <div className="ten-lop">
          <h1>{chiTietKhoaHoc?.tenKhoaHoc || "Khóa học"}</h1>
        </div>

        <div className="header-actions">
          {isOwner && (
            <div style={{ position: "relative" }}>
              <button className="btn-them" onClick={doiTrangThaiDropdown}>
                <FontAwesomeIcon icon={faPlus} className="icon" />
              </button>
              {hienDropdown && (
                <div className="dropdown-menu">
                  <button onClick={() => { setHienDropdown(false); setMoChonBoThe(true); }}>
                    Thêm bộ thẻ
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ position: "relative" }}>
            <button
              ref={nutMenuRef}
              className="btn-menu"
              onClick={() => setHienMenu3Cham((p) => !p)}
              aria-haspopup="menu"
              aria-expanded={hienMenu3Cham}
            >
              <FontAwesomeIcon icon={faEllipsisH} className="icon" />
            </button>

            <LopMenu
              open={hienMenu3Cham}
              anchorRef={nutMenuRef}
              onClose={() => setHienMenu3Cham(false)}
              onViewDetail={moHopThoaiChiTiet}
              onDelete={xoaKhoaHoc}
              idKhoaHoc={chiTietKhoaHoc?.idKhoaHoc}
              isOwner={isOwner}
              canLeave={canLeave}
              onLeft={() => {
                // sau khi rời, đọc lại và hiển thị GateCard
                const ds = readJSON("khoaHoc", []);
                const kh = ds.find(k => String(k.idKhoaHoc) === String(id)) || null;
                setChiTietKhoaHoc(kh);
              }}
            />
          </div>
        </div>
      </div>

      <div className="noi-dung-lop">
        <div className="tab-navigation">
          <button
            className={`tab-item ${tabDangChon === "thuVien" ? "active" : ""} ${!canViewInside ? "locked" : ""}`}
            onClick={() => setTabDangChon("thuVien")}
            title={!canViewInside ? "Bạn cần tham gia để xem thư viện" : ""}
          >
            Thư viện khóa học
          </button>

          {isOwner && (
            <button
              className={`tab-item ${tabDangChon === "thanhVien" ? "active" : ""}`}
              onClick={() => setTabDangChon("thanhVien")}
            >
              Thành viên
            </button>
          )}

          <button
            className={`tab-item ${tabDangChon === "feedback" ? "active" : ""}`}
            onClick={() => setTabDangChon("feedback")}
          >
            Feedback
          </button>
        </div>

        {tabDangChon === "thuVien" && chiTietKhoaHoc && (
          <div className="tab-content">
            {canViewInside ? (
              <ThuVienLop
                khoaHoc={chiTietKhoaHoc}
                onCapNhat={(khMoi) => setChiTietKhoaHoc(khMoi)}
              />
            ) : (
              <GateCard />
            )}
          </div>
        )}

        {tabDangChon === "feedback" && chiTietKhoaHoc && (
          <div className="tab-content" style={{ display: "block" }}>
            <FeedbackTab idKhoaHoc={chiTietKhoaHoc.idKhoaHoc} />
          </div>
        )}

        {tabDangChon === "thanhVien" && isOwner && chiTietKhoaHoc && (
          <div className="tab-content" style={{ display: "block" }}>
            <MoiThanhVien
              idKhoaHoc={chiTietKhoaHoc.idKhoaHoc}
              onCapNhat={(khMoi) => setChiTietKhoaHoc(khMoi)}
            />
          </div>
        )}
      </div>

      <ChiTietLopModal
        open={moChiTietKhoaHoc}
        lop={chiTietKhoaHoc}
        onClose={() => setMoChiTietKhoaHoc(false)}
        onSave={luuChiTietKhoaHoc}
      />

      {moChonBoThe && chiTietKhoaHoc && (
        <ChonBoThe
          idKhoaHoc={chiTietKhoaHoc.idKhoaHoc}
          onDong={() => setMoChonBoThe(false)}
          onCapNhat={(khMoi) => setChiTietKhoaHoc(khMoi)}
        />
      )}
    </>
  );
}
