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

export default function Lop() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chiTietLop, setChiTietLop] = useState(null);
  const [hienDropdown, setHienDropdown] = useState(false);
  const [tabDangChon, setTabDangChon] = useState("thuVien");

  const [hienMenu3Cham, setHienMenu3Cham] = useState(false);
  const nutMenuRef = useRef(null);

  const [moChiTietLop, setMoChiTietLop] = useState(false);
  const [moChonBoThe, setMoChonBoThe] = useState(false);

  useEffect(() => {
    const dsLop = JSON.parse(localStorage.getItem("lop") || "[]");
    const lopTimThay = dsLop.find((item) => String(item.idLop) === String(id));
    if (lopTimThay && !Array.isArray(lopTimThay.thanhVienIds)) {
      lopTimThay.thanhVienIds = [];
    }
    setChiTietLop(lopTimThay || null);
  }, [id]);

  const doiTrangThaiDropdown = () => setHienDropdown((prev) => !prev);

  const dsNguoiDung = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch {
      return [];
    }
  }, []);

  const thanhVien = useMemo(() => {
    if (!chiTietLop?.thanhVienIds?.length) return [];
    return chiTietLop.thanhVienIds
      .map((uid) => dsNguoiDung.find((u) => u.idNguoiDung === uid))
      .filter(Boolean);
  }, [chiTietLop, dsNguoiDung]);

  const moHopThoaiChiTiet = () => setMoChiTietLop(true);

  const xoaLop = () => {
    if (!chiTietLop) return;
    const xacNhan = window.confirm(
      `Bạn chắc chắn muốn xoá lớp "${chiTietLop.tenLop}"?`
    );
    if (!xacNhan) return;

    const ds = JSON.parse(localStorage.getItem("lop") || "[]");
    const dsMoi = ds.filter(
      (l) => String(l.idLop) !== String(chiTietLop.idLop)
    );
    localStorage.setItem("lop", JSON.stringify(dsMoi));

    alert("Đã xoá lớp.");
    navigate("/giangvien");
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
          <h1>{chiTietLop?.tenLop || "Lớp học"}</h1>
          <h3>{chiTietLop?.school || ""}</h3>
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
              onDelete={xoaLop}
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
            Thư viện lớp học
          </button>
          <button
            className={`tab-item ${tabDangChon === "thanhVien" ? "active" : ""
              }`}
            onClick={() => setTabDangChon("thanhVien")}
          >
            Thành viên
          </button>
        </div>

        {tabDangChon === "thuVien" && chiTietLop && (
          <div className="tab-content">
            <ThuVienLop
              lop={chiTietLop}
              onCapNhat={(lopMoi) => setChiTietLop(lopMoi)}
            />
          </div>
        )}

        {tabDangChon === "thanhVien" && (
          <div className="tab-content" style={{ display: "block" }}>
            {chiTietLop && (
              <MoiThanhVien
                idLop={chiTietLop.idLop}
                onCapNhat={(lopMoi) => setChiTietLop(lopMoi)}
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
                      {u.tenNguoiDung}{" "}
                      <span style={{ opacity: 0.65 }}>({u.email})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal chi tiết lớp */}
      <ChiTietLopModal
        open={moChiTietLop}
        lop={chiTietLop}
        onClose={() => setMoChiTietLop(false)}
      />

      {/* Modal chọn bộ thẻ */}
      {moChonBoThe && chiTietLop && (
        <ChonBoThe
          idLop={chiTietLop.idLop}
          onDong={() => setMoChonBoThe(false)}
          onCapNhat={(lopMoi) => setChiTietLop(lopMoi)}
        />
      )}
    </>
  );
}
