// src/pages/Home/Lop/Lop.jsx
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

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

/* ===== Helpers hiển thị ngày từ Firestore Timestamp/epoch ===== */
const toVNDate = (date) =>
  date instanceof Date && !Number.isNaN(date) ? date.toLocaleDateString("vi-VN") : "";

const fromMaybeTs = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate(); // Firestore Timestamp
  if (!Number.isNaN(Number(val))) {
    const n = Number(val);
    return new Date(n > 1e12 ? n : n * 1000); // ms|s epoch
  }
  const d = new Date(val);
  return Number.isNaN(d) ? null : d;
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

  // Preview bộ thẻ đầu tiên
  const [firstDeck, setFirstDeck] = useState(null);
  const [firstCards, setFirstCards] = useState([]);
  const [loadingFirst, setLoadingFirst] = useState(false);

  /* ===== 1) Xác định danh tính hiện tại (chuẩn) ===== */
  const [authUid, setAuthUid] = useState(null); // Firebase Auth UID
  const [altId, setAltId] = useState(null);     // nguoiDung.idNguoiDung (legacy)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthUid(u?.uid || null));
    return () => unsub();
  }, []);

  // Lấy altId từ hồ sơ người dùng
  useEffect(() => {
    (async () => {
      if (!authUid) { setAltId(null); return; }
      try {
        const snap = await getDoc(doc(db, "nguoiDung", String(authUid)));
        const idField = snap.exists() ? snap.data()?.idNguoiDung : null;
        setAltId(idField ? String(idField) : null);
      } catch {
        setAltId(null);
      }
    })();
  }, [authUid]);

  // Tập hợp các ID đại diện cho "tôi"
  const myIds = useMemo(() => [authUid, altId].filter(Boolean).map(String), [authUid, altId]);

  /* ===== 2) Nạp khóa học theo id (Firestore) ===== */
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

  /* ===== 3) Quyền: Owner / Member ===== */
  const ownerId = useMemo(
    () => String(chiTietKhoaHoc?.idNguoiDung || ""),
    [chiTietKhoaHoc]
  );
  const memberIds = useMemo(
    () => (Array.isArray(chiTietKhoaHoc?.thanhVienIds) ? chiTietKhoaHoc.thanhVienIds.map(String) : []),
    [chiTietKhoaHoc]
  );

  // Chủ lớp khi idNguoiDung khớp bất kỳ ID của tôi (authUid hoặc altId)
  const isOwner = useMemo(() => {
    if (!chiTietKhoaHoc || myIds.length === 0) return false;
    return myIds.includes(ownerId);
  }, [chiTietKhoaHoc, myIds, ownerId]);

  // Thành viên khi thanhVienIds chứa bất kỳ ID của tôi
  const isMember = useMemo(() => {
    if (!chiTietKhoaHoc || myIds.length === 0) return false;
    return memberIds.some((x) => myIds.includes(String(x)));
  }, [chiTietKhoaHoc, myIds, memberIds]);

  const canLeave = isMember && !isOwner;         // chỉ thành viên mới rời được
  const canViewInside = isOwner || isMember;     // xem thư viện khi là chủ hoặc thành viên

  // Reset "đang xử lý" khi đổi lớp / user
  useEffect(() => { setDaYeuCau(false); }, [chiTietKhoaHoc, authUid]);

  const doiTrangThaiDropdown = () => setHienDropdown((prev) => !prev);
  const moHopThoaiChiTiet = () => setMoChiTietKhoaHoc(true);

  /* ===== 4) Xoá khóa học ===== */
  const xoaKhoaHoc = async () => {
    if (!chiTietKhoaHoc || !isOwner) return;
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

  /* ===== 5) Lưu chi tiết khóa học (từ modal) ===== */
  const luuChiTietKhoaHoc = async (khDaSua) => {
    try {
      if (!khDaSua?.idKhoaHoc) return;
      await updateDoc(doc(db, "khoaHoc", String(khDaSua.idKhoaHoc)), khDaSua);
      alert("Đã lưu thay đổi khóa học.");
      setMoChiTietKhoaHoc(false);
    } catch (e) {
      console.error(e);
      alert("Không thể lưu chi tiết khóa học.");
    }
  };

  /* ===== 6) Giá / thời hạn / định dạng ===== */
  const getGiaThamGia = (kh) => {
    const v = kh?.giaThamGia ?? kh?.hocPhi ?? kh?.giaKhoaHoc ?? 0;
    return Number(v) || 0;
  };
  const getThoiHanNgay = (kh) => {
    const v = kh?.thoiHanNgay ?? 30;
    return Number(v) || 30;
  };
  const fmtVND = (v, donVi = "VND") => {
    if (String(donVi).toUpperCase() === "VND") {
      return (Number(v) || 0).toLocaleString("vi-VN") + " đ";
    }
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: donVi }).format(Number(v) || 0);
  };

  /* ===== 7) Tạo hóa đơn tham gia lớp (JOIN_CLASS) ===== */
  const xuLyThamGia = async () => {
    if (!authUid) {
      if (window.confirm("Bạn cần đăng nhập để thanh toán. Đi đến trang đăng nhập?")) {
        navigate("/dang-nhap");
      }
      return;
    }
    if (!chiTietKhoaHoc) return;
    try {
      setDaYeuCau(true);
      const soTien = getGiaThamGia(chiTietKhoaHoc);
      const thoiHan = getThoiHanNgay(chiTietKhoaHoc);

      const ref = await addDoc(collection(db, "hoaDon"), {
        idNguoiDung: String(authUid),
        tenGoi: `Tham gia: ${chiTietKhoaHoc.tenKhoaHoc || "Khóa học"}`,
        thoiHanNgay: thoiHan,
        soTienThanhToan: soTien,
        giamGia: Number(chiTietKhoaHoc?.giamGia || 0),
        trangThai: "pending",
        createdAt: serverTimestamp(),

        // Phân loại hóa đơn
        loaiThanhToan: "muaKhoaHoc",
        idKhoaHoc: String(chiTietKhoaHoc.idKhoaHoc || id),
      });

      navigate("/checkout", { state: { orderId: ref.id } });
    } catch (e) {
      console.error(e);
      setDaYeuCau(false);
      alert("Không thể tạo đơn tham gia. Vui lòng thử lại.");
    }
  };

  /* ===== 8) LẤY BỘ THẺ ĐẦU TIÊN (preview) ===== */
  useEffect(() => {
    const loadFirstDeck = async () => {
      try {
        setLoadingFirst(true);
        setFirstDeck(null);
        setFirstCards([]);

        // Nếu đã tham gia (hoặc là chủ) thì KHÔNG load preview
        if (!chiTietKhoaHoc || canViewInside) { setLoadingFirst(false); return; }

        const ids = Array.isArray(chiTietKhoaHoc?.boTheIds) ? chiTietKhoaHoc.boTheIds : [];
        const firstId = ids.length ? String(ids[0]) : null;
        if (!firstId) { setLoadingFirst(false); return; }

        const snap = await getDoc(doc(db, "boThe", firstId));
        if (!snap.exists()) { setLoadingFirst(false); return; }

        const data = snap.data() || {};
        const danhSachThe = Array.isArray(data.danhSachThe) ? data.danhSachThe : [];

        setFirstDeck({
          idBoThe: data.idBoThe ?? firstId,
          tenBoThe: data.tenBoThe || `Bộ thẻ #${firstId}`,
          soTu: data.soTu ?? danhSachThe.length
        });

        const pickPair = (c) => {
          if (typeof c === "string") return { front: c, back: "" };
          if (!c || typeof c !== "object") return { front: "—", back: "" };
          const f = c.front || c.matTruoc || c.tu || c.word || c.term || c.question || c.q || "";
          const b = c.back || c.matSau || c.nghia || c.meaning || c.definition || c.answer || c.a || "";
          const fallback = Object.values(c).find((v) => typeof v === "string") || "";
          return { front: f || fallback || "—", back: b };
        };

        // Có thể chỉnh số dòng preview tại đây
        const MAX_PREVIEW_ROWS = 20;
        setFirstCards(danhSachThe.slice(0, MAX_PREVIEW_ROWS).map(pickPair));
      } catch (e) {
        console.error("Load first deck failed:", e);
        setFirstDeck(null);
        setFirstCards([]);
      } finally {
        setLoadingFirst(false);
      }
    };
    loadFirstDeck();
  }, [chiTietKhoaHoc, canViewInside]);

  /* ===== 9) Hiển thị thông tin khóa học + preview ===== */
  const ThongTinKhoaHoc = () => {
    if (!chiTietKhoaHoc) return null;

    const soBoThe = Array.isArray(chiTietKhoaHoc.boTheIds) ? chiTietKhoaHoc.boTheIds.length : 0;
    const soThanhVien = Array.isArray(chiTietKhoaHoc.thanhVienIds) ? chiTietKhoaHoc.thanhVienIds.length : 0;
    const tags = chiTietKhoaHoc.kienThuc || [];
    const donVi = chiTietKhoaHoc.donViTien || "VND";

    // Ngày tạo (chỉ hiển thị, đọc từ 'ngayTao')
    const ngayTaoStr = toVNDate(fromMaybeTs(chiTietKhoaHoc.ngayTao));

    const giaGoc = getGiaThamGia(chiTietKhoaHoc);
    const giamGia = Number(chiTietKhoaHoc?.giamGia || 0);
    const giaSauGiam = Number(
      chiTietKhoaHoc?.giaSauGiam ||
      (giaGoc && giamGia ? Math.round((giaGoc * (100 - giamGia)) / 100) : 0)
    );

    return (
      <div style={{
        gridColumn: "1 / -1",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
        boxShadow: "0 8px 20px rgba(0,0,0,.06)",
        marginBottom: 12
      }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Thông tin khóa học</h3>

        <div style={{ marginTop: 10, color: "#374151", display: "grid", gap: 6 }}>
          <div><strong>Tên khóa học:</strong> {chiTietKhoaHoc.tenKhoaHoc || "—"}</div>
          <div><strong>Mô tả:</strong> {chiTietKhoaHoc.moTa || "—"}</div>

          {/* Ngày tạo */}
          <div><strong>Ngày tạo:</strong> {ngayTaoStr || "—"}</div>

          <div>
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

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6 }}>
            <div><strong>Bộ thẻ:</strong> {soBoThe}</div>
            <div><strong>Thành viên:</strong> {soThanhVien}</div>
            {giaGoc > 0 && (
              <div>
                <strong>Giá:</strong>{" "}
                {giamGia > 0 || giaSauGiam > 0 ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#6b7280", marginRight: 6 }}>
                      {fmtVND(giaGoc, donVi)}
                    </span>
                    <span style={{ fontWeight: 800, color: "#111827" }}>
                      {fmtVND(giaSauGiam || giaGoc, donVi)}
                    </span>
                    {giamGia > 0 && <span style={{ marginLeft: 8, color: "#ef4444" }}>-{giamGia}%</span>}
                  </>
                ) : (
                  <span style={{ fontWeight: 800 }}>{fmtVND(giaGoc, donVi)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {!canViewInside && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn-join" onClick={xuLyThamGia} disabled={daYeuCau}>
              {daYeuCau ? "Đang mở thanh toán..." : "Tham gia khóa học"}
            </button>
            <span style={{ color: "#6b7280", fontSize: 14 }}>
              Sau khi thanh toán, bạn sẽ truy cập toàn bộ nội dung.
            </span>
          </div>
        )}
      </div>
    );
  };

  const FirstDeckPreview = () => {
    // CHỈ hiển thị khi CHƯA tham gia/không phải chủ
    if (canViewInside) return null;

    if (loadingFirst) {
      return (
        <div style={{
          gridColumn: "1 / -1",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
          boxShadow: "0 8px 20px rgba(0,0,0,.06)",
          marginBottom: 12
        }}>
          Đang tải bộ thẻ đầu tiên…
        </div>
      );
    }
    if (!firstDeck) return null;

    return (
      <div style={{
        gridColumn: "1 / -1",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
        boxShadow: "0 8px 20px rgba(0,0,0,.06)",
        marginBottom: 12
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Xem trước bộ thẻ trong khóa học: {firstDeck.tenBoThe}
          </h3>
          <span style={{ color: "#6b7280" }}>{firstDeck.soTu} thẻ</span>
        </div>

        {firstCards.length === 0 ? (
          <div style={{ marginTop: 8, color: "#6b7280" }}>Bộ thẻ này chưa có thẻ nào.</div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #e5e7eb" }}>#</th>
                  <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Từ</th>
                  <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Nghĩa</th>
                </tr>
              </thead>
              <tbody>
                {firstCards.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 ? "#fafafa" : "transparent" }}>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{i + 1}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", fontWeight: 600, color: "#111827" }}>
                      {c.front || "—"}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>
                      {c.back || <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Gợi ý: chỉnh số hàng preview ở MAX_PREVIEW_ROWS trong effect phía trên */}
          </div>
        )}
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
              onLeft={() => { }}
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
            {/* Thông tin khóa học luôn hiển thị */}
            <ThongTinKhoaHoc />

            {/* Preview bộ thẻ đầu tiên (chỉ khi CHƯA tham gia/chưa là chủ) */}
            {!canViewInside && <FirstDeckPreview />}

            {canViewInside ? (
              <ThuVienLop
                khoaHoc={chiTietKhoaHoc}
                onCapNhat={(khMoi) => setChiTietKhoaHoc(khMoi)}
              />
            ) : null}

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
