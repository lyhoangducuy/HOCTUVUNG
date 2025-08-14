import React, { useEffect, useState } from "react";
import "./Lop.css";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEllipsisH, faLink, faSchool } from "@fortawesome/free-solid-svg-icons";
import { PopUpFolder } from "../../../components";

export default function Lop() {
  const { id } = useParams();
  const [classDetail, setClassDetail] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  const [showAddFolder, setShowAddFolder] = useState(false);

  useEffect(() => {
    const listClass = JSON.parse(localStorage.getItem("class")) || [];
    const classFound = listClass.find(
      (item) => String(item.idLop) === String(id)
    );
    setClassDetail(classFound || null);
  }, [id]);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleAddFlashcardSet = () => {
    setShowDropdown(false);
    alert("Thêm bộ thẻ");
  };

  const handleAddFolder = () => {
    setShowDropdown(false);
    setShowAddFolder(true);

  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Đã sao chép liên kết!");
  };

  return (
    <>
      <div className="thong-tin-lop">

        <div className="ten-lop">
          <h1>{classDetail?.tenLop || "12321"}</h1>
          <h3>{classDetail?.school || "12321 VA"}</h3>
        </div>
        <div className="header-actions">
          <div style={{ position: "relative" }}>
            <button className="btn-them" onClick={toggleDropdown}>
              <FontAwesomeIcon icon={faPlus} className="icon" />
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <button onClick={handleAddFlashcardSet}>Thêm bộ thẻ</button>
                <button onClick={handleAddFolder}>Thêm folder</button>
              </div>
            )}
          </div>
          <button className="btn-menu">
            <FontAwesomeIcon icon={faEllipsisH} className="icon" />
          </button>
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

        {activeTab === "members" && (
          <div className="tab-content">
            <div className="share-section">
              <h3>Mời bằng cách chia sẻ liên kết</h3>
              <button className="copy-link-btn" onClick={handleCopyLink}>
                <FontAwesomeIcon icon={faLink} />
                Sao chép liên kết
              </button>
            </div>

            <div className="email-section">
              <h3>Mời qua email</h3>
              <input
                type="text"
                className="email-input"
                placeholder="Nhập tên người dùng hoặc địa chỉ email (phân tách bằng dấu phẩy hoặc ngắt dòng)"
              />
            </div>
          </div>
        )}

        {activeTab === "materials" && (
          <div className="tab-content">
            <div>Thư viện lớp học</div>
          </div>
        )}
        {activeTab === "members" && (
          <div className="tab-content">
            <div>Thanhf vien</div>
          </div>
        )}
      </div>
    </>
  );
}