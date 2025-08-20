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
  const { id } = useParams();
  const navigate = useNavigate();

  const [chiTietLop, setChiTietLop] = useState(null);
  const [hienDropdown, setHienDropdown] = useState(false);
  const [tabDangChon, setTabDangChon] = useState("thuVien");

  const [hienMenu3Cham, setHienMenu3Cham] = useState(false);
  const nutMenuRef = useRef(null);

  const [moChiTietLop, setMoChiTietLop] = useState(false);
  const [moChonBoThe, setMoChonBoThe] = useState(false);

  // nạp lớp theo id từ localStorage
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
  // thêm vào ngay dưới const dsNguoiDung = useMemo(...)
  const session = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("session") || "null");
    } catch {
      return null;
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
    const xacNhan = window.confirm(`Bạn chắc chắn muốn xoá lớp "${chiTietLop.tenLop}"?`);
    if (!xacNhan) return;

    const ds = JSON.parse(localStorage.getItem("lop") || "[]");
    const dsMoi = ds.filter((l) => String(l.idLop) !== String(chiTietLop.idLop));
    localStorage.setItem("lop", JSON.stringify(dsMoi));

    alert("Đã xoá lớp.");
    navigate("/giangvien");
  };

  // ✅ lưu thay đổi từ modal vào localStorage + state
  const luuChiTietLop = (lopDaSua) => {
    try {
      const ds = JSON.parse(localStorage.getItem("lop") || "[]");
      const idx = ds.findIndex((l) => String(l.idLop) === String(lopDaSua?.idLop));
      if (idx > -1) {
        ds[idx] = { ...ds[idx], ...lopDaSua };
      } else if (lopDaSua) {
        ds.push(lopDaSua); // phòng khi chưa có, sẽ thêm mới
      }
      localStorage.setItem("lop", JSON.stringify(ds));
      // đồng bộ lại state hiển thị
      setChiTietLop(idx > -1 ? ds[idx] : lopDaSua);
    } catch (e) {
      console.error("Không thể lưu lớp vào localStorage:", e);
      // vẫn cập nhật state để UI phản ánh
      setChiTietLop(lopDaSua);
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
          <h1>{chiTietLop?.tenLop || "Lớp học"}</h1>
          <h3>{chiTietLop?.tenTruong || ""}</h3>
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
              idLop={chiTietLop?.idLop}
              isOwner={chiTietLop?.idNguoiDung === session?.idNguoiDung}
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

          {chiTietLop?.idNguoiDung === session?.idNguoiDung && (
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


        {tabDangChon === "thuVien" && chiTietLop && (
          <div className="tab-content">
            <ThuVienLop
              lop={chiTietLop}
              onCapNhat={(lopMoi) => setChiTietLop(lopMoi)}
            />
          </div>
        )}
        {tabDangChon === "feedback" && chiTietLop && (
          <FeedbackTab idLop={chiTietLop.idLop} />
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
                      {u.tenNguoiDung} <span style={{ opacity: 0.65 }}>({u.email})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal chi tiết lớp — ✅ truyền onSave để lưu localStorage */}
      <ChiTietLopModal
        open={moChiTietLop}
        lop={chiTietLop}
        onClose={() => setMoChiTietLop(false)}
        onSave={luuChiTietLop}
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
