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

import { auth, db } from "../../../../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";

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

  // session hiện tại (fallback nếu chưa có auth.currentUser)
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);
  const uid = auth.currentUser?.uid || session?.idNguoiDung || null;

  // nạp khóa học theo id (Firestore)
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "khoaHoc", String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setChiTietKhoaHoc(null);
          return;
        }
        const kh = snap.data() || null;

        // đảm bảo các trường mảng tồn tại
        ["thanhVienIds", "boTheIds", "folderIds", "kienThuc", "yeuCauThamGiaIds"].forEach((k) => {
          if (!Array.isArray(kh[k])) kh[k] = [];
        });

        setChiTietKhoaHoc(kh);
      },
      () => setChiTietKhoaHoc(null)
    );
    return () => unsub();
  }, [id]);

  const isOwner = useMemo(() => {
    if (!chiTietKhoaHoc || !uid) return false;
    return String(chiTietKhoaHoc.idNguoiDung) === String(uid);
  }, [chiTietKhoaHoc, uid]);

  const canLeave = useMemo(() => {
    if (!chiTietKhoaHoc || !uid) return false;
    if (String(chiTietKhoaHoc.idNguoiDung) === String(uid)) return false; // chủ không rời
    const tv = Array.isArray(chiTietKhoaHoc.thanhVienIds) ? chiTietKhoaHoc.thanhVienIds : [];
    return tv.some((x) => String(x) === String(uid));
  }, [chiTietKhoaHoc, uid]);

  const isMember = isOwner || canLeave;
  const canViewInside = isOwner || isMember;

  // đã gửi yêu cầu?
  useEffect(() => {
    if (!chiTietKhoaHoc || !uid) { setDaYeuCau(false); return; }
    setDaYeuCau((chiTietKhoaHoc.yeuCauThamGiaIds || []).includes(uid));
  }, [chiTietKhoaHoc, uid]);

  const doiTrangThaiDropdown = () => setHienDropdown((prev) => !prev);
  const moHopThoaiChiTiet = () => setMoChiTietKhoaHoc(true);

  // Xoá khóa học (Firestore)
  const xoaKhoaHoc = async () => {
    if (!chiTietKhoaHoc) return;
    if (!isOwner) return;
    const xacNhan = window.confirm(`Xóa khóa học "${chiTietKhoaHoc.tenKhoaHoc || ""}"?`);
    if (!xacNhan) return;
    try {
      await deleteDoc(doc(db, "khoaHoc", String(chiTietKhoaHoc.idKhoaHoc)));
      alert("Đã xóa khóa học.");
      navigate("/thuviencuatoi");
    } catch (e) {
      console.error(e);
      alert("Không thể xóa khóa học. Vui lòng thử lại.");
    }
  };

  // Lưu chi tiết khóa học (từ modal)
  const luuChiTietKhoaHoc = async (khDaSua) => {
    try {
      if (!khDaSua?.idKhoaHoc) return;
      await updateDoc(doc(db, "khoaHoc", String(khDaSua.idKhoaHoc)), khDaSua);
      // onSnapshot sẽ tự cập nhật UI
      setMoChiTietKhoaHoc(false);
    } catch (e) {
      console.error(e);
      alert("Không thể lưu chi tiết khóa học.");
    }
  };

  // Gửi yêu cầu tham gia
  const guiYeuCau = async () => {
    if (!uid) {
      if (window.confirm("Bạn cần đăng nhập để gửi yêu cầu. Đi đến trang đăng nhập?")) {
        navigate("/dang-nhap");
      }
      return;
    }
    try {
      await updateDoc(doc(db, "khoaHoc", String(id)), {
        yeuCauThamGiaIds: arrayUnion(String(uid)),
      });
      setDaYeuCau(true);
      alert("Đã gửi yêu cầu tham gia. Vui lòng chờ giảng viên duyệt.");
    } catch (e) {
      console.error(e);
      alert("Không thể gửi yêu cầu. Vui lòng thử lại.");
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
                // Không cần làm gì: onSnapshot sẽ tự cập nhật sau khi rời lớp
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
                onCapNhat={(khMoi) => setChiTietKhoaHoc(khMoi)} // hoặc để onSnapshot cập nhật
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
