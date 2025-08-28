// src/pages/Home/ThuVienCuaToi.jsx
import { useEffect, useMemo, useState } from "react";
import "./ThuVienCuaToi.css";
import { useNavigate } from "react-router-dom";

import ItemBo from "../../../components/BoThe/itemBo";
import ItemKH from "../../../components/BoThe/itemKH";

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

      {/* Tab Bộ thẻ */}
      {actionTab === "boThe" && (
        <div className="myLibCard">
          {cardLib.map((item) => {
            const author = userMap[String(item.idNguoiDung)] || {};
            return (
              <ItemBo
                key={item.idBoThe}
                item={item}
                author={author}
                onClick={(id) => handleStudy(id)}
              />
            );
          })}
          {cardLib.length === 0 && <p className="emty">Không có bộ thẻ nào cả</p>}
        </div>
      )}

      {/* Tab Khóa học */}
      {actionTab === "khoaHoc" && (
        <div className="myLop">
          {khoaHocList.length === 0 ? (
            <p className="emty">Không có khóa học nào cả</p>
          ) : (
            khoaHocList.map((k) => {
              const owner = userMap[String(k.idNguoiDung)] || null;
              return (
                <ItemKH
                  key={k.idKhoaHoc}
                  item={k}
                  author={owner}
                  isJoined
                  onClick={(id) => handleKhoaHoc(id)}
                  onEnter={(id) => handleKhoaHoc(id)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default ThuVienCuaToi;
