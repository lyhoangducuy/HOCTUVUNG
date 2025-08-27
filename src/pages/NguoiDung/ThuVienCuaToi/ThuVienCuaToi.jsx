// src/pages/Home/ThuVienCuaToi.jsx
import { useEffect, useMemo, useState } from "react";
import "./ThuVienCuaToi.css";
import { useNavigate } from "react-router-dom";

import ItemBo from "../../../components/BoThe/itemBo"; // <-- THÊM

import { auth, db } from "../../../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  documentId,
} from "firebase/firestore";

function ThuVienCuaToi() {
  const navigate = useNavigate();

  const [cardLib, setCardLib] = useState([]);
  const [actionTab, setActionTab] = useState("boThe");

  const [khOwner, setKhOwner] = useState([]);
  const [khMember, setKhMember] = useState([]);
  const [khoaHocList, setKhoaHocList] = useState([]);

  const [userMap, setUserMap] = useState({}); // { uid: {tenNguoiDung, anhDaiDien} }

  // Lấy uid (ưu tiên Firebase Auth, fallback session cũ nếu có)
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);
  const uid = auth.currentUser?.uid || session?.idNguoiDung || null;

  // ===== Bộ thẻ của tôi =====
  useEffect(() => {
    if (!uid) { setCardLib([]); return; }
    const qCards = query(collection(db, "boThe"), where("idNguoiDung", "==", String(uid)));
    const unsub = onSnapshot(qCards, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          soTu:
            typeof data.soTu === "number"
              ? data.soTu
              : Array.isArray(data.danhSachThe)
              ? data.danhSachThe.length
              : 0,
          luotHoc: Number(data.luotHoc || 0),
        };
      });
      setCardLib(items);
    }, () => setCardLib([]));
    return () => unsub();
  }, [uid]);

  // ===== Khóa học tôi sở hữu =====
  useEffect(() => {
    if (!uid) { setKhOwner([]); return; }
    const qOwner = query(collection(db, "khoaHoc"), where("idNguoiDung", "==", String(uid)));
    const unsub = onSnapshot(qOwner, (snap) => {
      const items = snap.docs.map((d) => d.data());
      setKhOwner(items);
    }, () => setKhOwner([]));
    return () => unsub();
  }, [uid]);

  // ===== Khóa học tôi là thành viên =====
  useEffect(() => {
    if (!uid) { setKhMember([]); return; }
    const qMember = query(
      collection(db, "khoaHoc"),
      where("thanhVienIds", "array-contains", String(uid))
    );
    const unsub = onSnapshot(qMember, (snap) => {
      const items = snap.docs.map((d) => d.data());
      setKhMember(items);
    }, () => setKhMember([]));
    return () => unsub();
  }, [uid]);

  // Gộp danh sách khóa học (loại bỏ trùng)
  useEffect(() => {
    const map = new Map();
    [...khOwner, ...khMember].forEach((k) => {
      if (k?.idKhoaHoc != null) map.set(String(k.idKhoaHoc), k);
    });
    setKhoaHocList(Array.from(map.values()));
  }, [khOwner, khMember]);

  // ===== Tải hồ sơ tác giả cho cả cardLib & khoaHocList =====
  useEffect(() => {
    const ownerIds = [
      ...new Set(
        [...cardLib, ...khoaHocList]
          .map((x) => (x?.idNguoiDung != null ? String(x.idNguoiDung) : null))
          .filter(Boolean)
      ),
    ];
    if (ownerIds.length === 0) { setUserMap({}); return; }

    // Firestore 'in' tối đa 10 id mỗi lần → chia lô
    const chunks = [];
    for (let i = 0; i < ownerIds.length; i += 10) chunks.push(ownerIds.slice(i, i + 10));

    (async () => {
      const map = {};
      for (const chunk of chunks) {
        const q = query(collection(db, "nguoiDung"), where(documentId(), "in", chunk));
        const rs = await getDocs(q);
        rs.forEach((d) => (map[d.id] = d.data()));
      }
      setUserMap(map);
    })();
  }, [cardLib, khoaHocList]);

  const handleStudy = (id) => navigate(`/flashcard/${id}`);
  const handleKhoaHoc = (id) => navigate(`/khoaHoc/${id}`);

  return (
    <div className="myLib-container">
      <h2 className="tittle-lib">Thư viện của tôi</h2>

      <ul className="header-lib">
        <li
          className={`lib-item ${actionTab === "boThe" ? "active" : ""}`}
          onClick={() => setActionTab("boThe")}
        >
          Bộ Thẻ
        </li>
        <li
          className={`lib-item ${actionTab === "khoaHoc" ? "active" : ""}`}
          onClick={() => setActionTab("khoaHoc")}
        >
          Khóa học
        </li>
      </ul>

      {actionTab === "boThe" && (
        <div className="myLibCard">
          {cardLib.map((item) => {
            const author = userMap[String(item.idNguoiDung)] || {};
            return (
              <ItemBo
                key={item.idBoThe}
                item={item}
                author={author}                    // {tenNguoiDung, anhDaiDien}
                onClick={(id) => handleStudy(id)} // click toàn card
                // onLearn không truyền thì mặc định = onClick
              />
            );
          })}
          {cardLib.length === 0 && <p className="emty">Không có bộ thẻ nào cả</p>}
        </div>
      )}

      {actionTab === "khoaHoc" && (
        <div className="myLop">
          {khoaHocList.map((item) => {
            const owner = userMap[String(item.idNguoiDung)] || {};
            const tenNguoiTao = owner.tenNguoiDung || "Ẩn danh";
            const anhNguoiTao = owner.anhDaiDien || "";

            return (
              <div
                key={item.idKhoaHoc}
                className="mini-card"
                onClick={() => handleKhoaHoc(item.idKhoaHoc)}
              >
                <div className="mini-title">{item?.tenKhoaHoc || "Khóa học"}</div>
                <div className="mini-sub">
                  {(item.boTheIds?.length || 0)} bộ thẻ • {(item.thanhVienIds?.length || 0)} thành viên
                </div>

                <div className="mini-meta">
                  <div
                    className="mini-avatar"
                    style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
                    aria-label={tenNguoiTao}
                    title={tenNguoiTao}
                  />
                  <span className="mini-name">{tenNguoiTao}</span>
                </div>

                <div className="mini-actions">
                  <button
                    className="btn ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKhoaHoc(item.idKhoaHoc);
                    }}
                  >
                    Vào khóa học
                  </button>
                </div>
              </div>
            );
          })}

          {khoaHocList.length === 0 && <p className="emty">Không có khóa học nào cả</p>}
        </div>
      )}
    </div>
  );
}

export default ThuVienCuaToi;
