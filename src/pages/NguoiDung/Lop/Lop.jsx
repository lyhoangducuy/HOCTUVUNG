// Lop.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Lop.css";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEllipsisH, faLink } from "@fortawesome/free-solid-svg-icons";
import { PopUpFolder } from "../../../components";
import MoiThanhVien from "./chucNang/moiThanhVien";
import ThuVienLop from "./chucNang/thuVienLop";
import LopMenu from "./chucNang/lopMenu";               // ⬅️ thêm
import ChiTietLopModal from "./chucNang/chiTietLop"; // ⬅️ thêm

export default function Lop() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classDetail, setClassDetail] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("materials");
  const [showAddFolder, setShowAddFolder] = useState(false);

  // menu dấu 3 chấm
  const [showEllipsis, setShowEllipsis] = useState(false);
  const btnMenuRef = useRef(null);

  // modal chi tiết lớp
  const [openDetail, setOpenDetail] = useState(false);

  useEffect(() => {
    const listClass = JSON.parse(localStorage.getItem("lop") || "[]");
    const found = listClass.find((item) => String(item.idLop) === String(id));
    if (found && !Array.isArray(found.thanhVienIds)) found.thanhVienIds = [];
    setClassDetail(found || null);
  }, [id]);

  const toggleDropdown = () => setShowDropdown((prev) => !prev);
  const handleAddFlashcardSet = () => { setShowDropdown(false); setShowAddFolder(true); };
  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.href); alert("Đã sao chép liên kết!"); };

  // ———— HANDLERS MENU DẤU … ————
  const handleViewDetail = () => setOpenDetail(true);

  const handleDeleteClass = () => {
    if (!classDetail) return;
    const ok = window.confirm(`Bạn chắc chắn muốn xoá lớp "${classDetail.tenLop}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;

    const ds = JSON.parse(localStorage.getItem("lop") || "[]");
    const newList = ds.filter(l => String(l.idLop) !== String(classDetail.idLop));
    localStorage.setItem("lop", JSON.stringify(newList));
    window.dispatchEvent(new Event("lopUpdated")); // tuỳ ý, nếu nơi khác cần lắng nghe

    alert("Đã xoá lớp.");
    navigate("/giangvien"); // điều hướng sau khi xoá
  };

  const dsNguoiDung = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("nguoiDung") || "[]"); }
    catch { return []; }
  }, []);

  const thanhVien = useMemo(() => {
    if (!classDetail?.thanhVienIds?.length) return [];
    return classDetail.thanhVienIds
      .map((uid) => dsNguoiDung.find((u) => u.idNguoiDung === uid))
      .filter(Boolean);
  }, [classDetail, dsNguoiDung]);

  return (
    <>
      <div className="thong-tin-lop">
        <div className="ten-lop">
          <h1>{classDetail?.tenLop || "Lớp học"}</h1>
          <h3>{classDetail?.school || ""}</h3>
        </div>

        <div className="header-actions">
          <div style={{ position: "relative" }}>
            <button className="btn-them" onClick={toggleDropdown}>
              <FontAwesomeIcon icon={faPlus} className="icon" />
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <button onClick={handleAddFlashcardSet}>Thêm bộ thẻ</button>
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              ref={btnMenuRef}
              className="btn-menu"
              onClick={() => setShowEllipsis((p) => !p)}
              aria-haspopup="menu"
              aria-expanded={showEllipsis}
            >
              <FontAwesomeIcon icon={faEllipsisH} className="icon" />
            </button>

            <LopMenu
              open={showEllipsis}
              anchorRef={btnMenuRef}
              onClose={() => setShowEllipsis(false)}
              onViewDetail={handleViewDetail}
              onDelete={handleDeleteClass}
            />
          </div>
        </div>
      </div>

      <PopUpFolder showAddFolder={showAddFolder} setShowAddFolder={setShowAddFolder} />

      <div className="noi-dung-lop">
        <div className="tab-navigation">
          <button
            className={`tab-item ${activeTab === "materials" ? "active" : ""}`}
            onClick={() => setActiveTab("materials")}
          >
            Thư viện lớp học
          </button>
          <button
            className={`tab-item ${activeTab === "members" ? "active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            Thành viên
          </button>
        </div>

        {activeTab === "materials" && classDetail && (
          <div className="tab-content">
            <ThuVienLop
              lop={classDetail}
              onCapNhat={(lopMoi) => setClassDetail(lopMoi)}
            />
          </div>
        )}

        {activeTab === "members" && (
          <div className="tab-content" style={{ display: "block" }}>
            <div className="share-section">
              <h3>Mời bằng cách chia sẻ liên kết</h3>
              <button className="copy-link-btn" onClick={handleCopyLink}>
                <FontAwesomeIcon icon={faLink} />
                Sao chép liên kết
              </button>
            </div>

            {classDetail && (
              <MoiThanhVien
                idLop={classDetail.idLop}
                onCapNhat={(lopMoi) => setClassDetail(lopMoi)}
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

      <ChiTietLopModal
        open={openDetail}
        lop={classDetail}
        onClose={() => setOpenDetail(false)}
      />
    </>
  );
}
