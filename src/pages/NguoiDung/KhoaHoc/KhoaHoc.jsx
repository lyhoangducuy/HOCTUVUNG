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

  // nạp khóa học theo id từ localStorage.khoaHoc
  useEffect(() => {
    try {
      const dsKH = JSON.parse(localStorage.getItem("khoaHoc") || "[]");
      const khTimThay = dsKH.find((item) => String(item.idKhoaHoc) === String(id));
      if (khTimThay) {
        if (!Array.isArray(khTimThay.thanhVienIds)) khTimThay.thanhVienIds = [];
        if (!Array.isArray(khTimThay.boTheIds)) khTimThay.boTheIds = [];
        if (!Array.isArray(khTimThay.folderIds)) khTimThay.folderIds = [];
        if (!Array.isArray(khTimThay.kienThuc)) khTimThay.kienThuc = [];
      }
      setChiTietKhoaHoc(khTimThay || null);
    } catch {
      setChiTietKhoaHoc(null);
    }
  }, [id]);

  const doiTrangThaiDropdown = () => setHienDropdown((prev) => !prev);

  const dsNguoiDung = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch {
      return [];
    }
  }, []);

  const session = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("session") || "null");
    } catch {
      return null;
    }
  }, []);

  const thanhVien = useMemo(() => {
    if (!chiTietKhoaHoc?.thanhVienIds?.length) return [];
    return chiTietKhoaHoc.thanhVienIds
      .map((uid) => dsNguoiDung.find((u) => u.idNguoiDung === uid))
      .filter(Boolean);
  }, [chiTietKhoaHoc, dsNguoiDung]);

  const moHopThoaiChiTiet = () => setMoChiTietKhoaHoc(true);

  const xoaKhoaHoc = () => {
    if (!chiTietKhoaHoc) return;
    const xacNhan = window.confirm(`Bạn chắc chắn muốn xoá khóa học "${chiTietKhoaHoc.tenKhoaHoc || ""}"?`);
    if (!xacNhan) return;

    const ds = JSON.parse(localStorage.getItem("khoaHoc") || "[]");
    const dsMoi = ds.filter((k) => String(k.idKhoaHoc) !== String(chiTietKhoaHoc.idKhoaHoc));
    localStorage.setItem("khoaHoc", JSON.stringify(dsMoi));

    alert("Đã xoá khóa học.");
    navigate("/giangvien");
  };

  // ✅ lưu thay đổi từ modal vào localStorage + state
  const luuChiTietKhoaHoc = (khDaSua) => {
    try {
      const ds = JSON.parse(localStorage.getItem("khoaHoc") || "[]");
      const idx = ds.findIndex((k) => String(k.idKhoaHoc) === String(khDaSua?.idKhoaHoc));
      if (idx > -1) {
        ds[idx] = { ...ds[idx], ...khDaSua };
      } else if (khDaSua) {
        ds.push(khDaSua);
      }
      localStorage.setItem("khoaHoc", JSON.stringify(ds));
      setChiTietKhoaHoc(idx > -1 ? ds[idx] : khDaSua);
    } catch (e) {
      console.error("Không thể lưu khóa học vào localStorage:", e);
      setChiTietKhoaHoc(khDaSua);
    }
  };

  return (
    <>
      <div className="thong-tin-lop">
        <div
          className="back"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", opacity: 0.9 }}
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
          Quay lại
        </div>

        <div className="ten-lop">
          <h1>{chiTietKhoaHoc?.tenKhoaHoc || "Khóa học"}</h1>
          {/* BỎ dòng tên trường */}
        </div>

        <div className="header-actions">
          <div style={{ position: "relative" }}>
            <button className="btn-them" onClick={doiTrangThaiDropdown}>
              <FontAwesomeIcon icon={faPlus} className="icon" />
            </button>
            {hienDropdown && (
              <div className="dropdown-menu">
                <button
                  onClick={() => {
                    setHienDropdown(false);
                    setMoChonBoThe(true);
                  }}
                >
                  Thêm bộ thẻ
                </button>
              </div>
            )}
          </div>

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
              isOwner={chiTietKhoaHoc?.idNguoiDung === session?.idNguoiDung}
            />
          </div>
        </div>
      </div>

      <div className="noi-dung-lop">
        <div className="tab-navigation">
          <button
            className={`tab-item ${tabDangChon === "thuVien" ? "active" : ""}`}
            onClick={() => setTabDangChon("thuVien")}
          >
            Thư viện khóa học
          </button>

          {chiTietKhoaHoc?.idNguoiDung === session?.idNguoiDung && (
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
            <ThuVienLop
              khoaHoc={chiTietKhoaHoc}
              onCapNhat={(khMoi) => setChiTietKhoaHoc(khMoi)}
            />
          </div>
        )}

        {tabDangChon === "feedback" && chiTietKhoaHoc && (
          <FeedbackTab idKhoaHoc={chiTietKhoaHoc.idKhoaHoc} />
        )}

        {tabDangChon === "thanhVien" && (
          <div className="tab-content" style={{ display: "block" }}>
            {chiTietKhoaHoc && (
              <MoiThanhVien
                idKhoaHoc={chiTietKhoaHoc.idKhoaHoc}
                onCapNhat={(khMoi) => setChiTietKhoaHoc(khMoi)}
              />
            )}

            <div style={{ marginTop: 30 }}>
              <h3>Thành viên ({thanhVien.length})</h3>
              {thanhVien.length === 0 ? (
                <div style={{ opacity: 0.6 }}>Chưa có thành viên.</div>
              ) : (
                <ul>
                  {thanhVien.map((u) => (
                    <li key={u.idNguoiDung}>
                      {u.tenNguoiDung} <span style={{ opacity: 0.65 }}>({u.email})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal chi tiết khóa học — ✅ truyền onSave để lưu localStorage */}
      <ChiTietLopModal
        open={moChiTietKhoaHoc}
        lop={chiTietKhoaHoc}
        onClose={() => setMoChiTietKhoaHoc(false)}
        onSave={luuChiTietKhoaHoc}
      />

      {/* Modal chọn bộ thẻ */}
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
