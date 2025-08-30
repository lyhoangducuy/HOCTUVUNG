// src/components/ChonBoThe/ChonBoThe.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../../../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

// ===== Helpers Firestore =====
const boTheCol = () => collection(db, "boThe");
const khoaHocCol = () => collection(db, "khoaHoc");

/** Tìm docRef theo docId hoặc field idKhoaHoc */
async function getCourseDocRefByAnyId(id) {
  const idStr = String(id);
  // 1) thử docId
  const refById = doc(db, "khoaHoc", idStr);
  const s1 = await getDoc(refById);
  if (s1.exists()) return refById;

  // 2) thử field idKhoaHoc
  const q1 = query(khoaHocCol(), where("idKhoaHoc", "==", idStr), limit(1));
  const rs = await getDocs(q1);
  if (!rs.empty) return rs.docs[0].ref;

  return null;
}

/** Lấy hồ sơ người dùng (để đọc altId nếu DB cũ dùng idNguoiDung ≠ auth.uid) */
async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "nguoiDung", String(uid)));
    return snap.exists() ? { _docId: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}

/**
 * Chọn bộ thẻ để thêm vào khóa học (Firebase)
 * Props:
 * - idKhoaHoc: string|number (bắt buộc)
 * - onDong: () => void
 * - onCapNhat: (khoaHocMoi) => void  // callback sau khi cập nhật Firestore (đọc lại doc và trả lên)
 */
export default function ChonBoThe({ idKhoaHoc, onDong, onCapNhat }) {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [altId, setAltId] = useState(null); // nếu hồ sơ có idNguoiDung khác uid

  // Khóa học hiện tại
  const [courseRef, setCourseRef] = useState(null);
  const [khoaHoc, setKhoaHoc] = useState(null);

  // Danh sách bộ thẻ của user
  const [dsBoThe, setDsBoThe] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [daChon, setDaChon] = useState(new Set()); // idBoThe đã chọn
  const [tim, setTim] = useState("");

  // ==== 1) Lấy uid từ Firebase Auth & altId từ hồ sơ ====
  useEffect(() => {
    const _uid = auth.currentUser?.uid || null;
    if (!_uid) {
      alert("Vui lòng đăng nhập.");
      navigate("/dang-nhap");
      return;
    }
    setUid(_uid);
    (async () => {
      const prof = await getUserProfile(_uid);
      const idField = prof?.idNguoiDung;
      setAltId(idField && String(idField) !== String(_uid) ? String(idField) : null);
    })();
  }, [navigate]);

  // ==== 2) Lấy khóa học theo id ====
  useEffect(() => {
    (async () => {
      if (!idKhoaHoc) return;
      const ref = await getCourseDocRefByAnyId(idKhoaHoc);
      if (!ref) {
        setCourseRef(null);
        setKhoaHoc(null);
        return;
      }
      setCourseRef(ref);
      const snap = await getDoc(ref);
      setKhoaHoc(snap.exists() ? { _docId: ref.id, ...snap.data() } : null);
    })();
  }, [idKhoaHoc]);

  // === 3) Lấy danh sách bộ thẻ thuộc user hiện tại ===
  useEffect(() => {
    (async () => {
      if (!uid) return;
      setLoading(true);
      try {
        let qs = [];
        if (altId && String(altId) !== String(uid)) {
          // Dùng 'in' nếu có altId khác uid
          // Cần index nếu Firestore yêu cầu.
          const qIn = query(boTheCol(), where("idNguoiDung", "in", [String(uid), String(altId)]));
          qs.push(qIn);
        } else {
          const q1 = query(boTheCol(), where("idNguoiDung", "==", String(uid)));
          qs.push(q1);
        }

        // gom kết quả từ 1 hoặc 2 query (nếu Firestore không support 'in' ở dự án của bạn,
        // có thể tách ra 2 query riêng where("==", uid) & where("==", altId) rồi merge)
        const allDocs = [];
        for (const qx of qs) {
          const rs = await getDocs(qx);
          allDocs.push(...rs.docs);
        }

        // map -> normalize
        const list = allDocs.map((d) => {
          const x = d.data();
          const idBoThe = String(x.idBoThe || d.id);
          const tenBoThe = x.tenBoThe || "";
          const soTu = Number.isFinite(x.soTu) ? x.soTu : (Array.isArray(x.danhSachThe) ? x.danhSachThe.length : 0);
          return { idBoThe, tenBoThe, soTu };
        });

        // loại trùng theo idBoThe
        const seen = new Set();
        const uniq = [];
        for (const it of list) {
          if (seen.has(it.idBoThe)) continue;
          seen.add(it.idBoThe);
          uniq.push(it);
        }

        setDsBoThe(uniq);
      } catch (e) {
        console.error("Lỗi tải bộ thẻ:", e);
        setDsBoThe([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid, altId]);

  // ==== Tập id bộ thẻ đã có trong khóa học ====
  const boTheDaCo = useMemo(() => {
    return new Set(Array.isArray(khoaHoc?.boTheIds) ? khoaHoc.boTheIds.map(String) : []);
  }, [khoaHoc]);

  // ==== Filter theo ô tìm kiếm ====
  const danhSachLoc = useMemo(() => {
    const q = tim.trim().toLowerCase();
    if (!q) return dsBoThe;
    return dsBoThe.filter(
      (b) => b.tenBoThe.toLowerCase().includes(q) || String(b.idBoThe).includes(q)
    );
  }, [tim, dsBoThe]);

  const toggleChon = (idBoThe) => {
    setDaChon((prev) => {
      const s = new Set(prev);
      if (s.has(idBoThe)) s.delete(idBoThe);
      else s.add(idBoThe);
      return s;
    });
  };

  // ==== 4) Xác nhận: arrayUnion vào khóa học ====
  const xuLyXacNhan = async () => {
    try {
      if (!courseRef || !khoaHoc) return;
      const them = Array.from(daChon).filter((id) => !boTheDaCo.has(String(id)));
      if (them.length === 0) {
        onDong?.();
        return;
      }

      // cập nhật Firestore
      await updateDoc(courseRef, { boTheIds: arrayUnion(...them.map(String)) });

      // đọc lại doc để trả về UI cha (nếu cần)
      const snap = await getDoc(courseRef);
      const khMoi = snap.exists() ? { _docId: courseRef.id, ...snap.data() } : null;

      onCapNhat?.(khMoi);
      onDong?.();
    } catch (e) {
      console.error("Cập nhật khóa học thất bại:", e);
      alert("Không thể thêm bộ thẻ vào khóa học. Vui lòng thử lại.");
    }
  };

  const diTaoBoThe = () => {
    onDong?.();
    navigate("/newBoThe");
  };

  if (!khoaHoc) {
    return (
      <div className="popup-overlay">
        <div className="popup-content" style={{ width: 520 }}>
          <div className="popup-header">
            <h3>Không tìm thấy khóa học</h3>
            <button className="popup-close" onClick={onDong}>✕</button>
          </div>
          <div className="popup-body" style={{ padding: 12 }}>
            Vui lòng kiểm tra lại <code>idKhoaHoc</code>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-overlay">
      <div className="popup-content" style={{ width: 640 }}>
        <div className="popup-header">
          <h3>Chọn bộ thẻ để thêm vào khóa học</h3>
          <button className="popup-close" onClick={onDong}>✕</button>
        </div>

        <div className="popup-body" style={{ gap: 12 }}>
          <input
            className="popup-input"
            placeholder="Tìm theo tên hoặc ID bộ thẻ…"
            value={tim}
            onChange={(e) => setTim(e.target.value)}
          />

          {/* Danh sách bộ thẻ */}
          <div
            style={{
              maxHeight: 360,
              overflow: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 8,
            }}
          >
            {loading ? (
              <div style={{ padding: 12, opacity: 0.7 }}>Đang tải…</div>
            ) : danhSachLoc.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.7 }}>Chưa có bộ thẻ nào.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {danhSachLoc.map((bt) => {
                  const daCo = boTheDaCo.has(String(bt.idBoThe));
                  const checked = daChon.has(String(bt.idBoThe));
                  return (
                    <li
                      key={bt.idBoThe}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "24px 1fr auto",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 8px",
                        borderBottom: "1px dashed #eee",
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled={daCo}
                        checked={checked || daCo}
                        onChange={() => toggleChon(String(bt.idBoThe))}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {bt.tenBoThe || `Bộ thẻ #${bt.idBoThe}`}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {bt.soTu ?? 0} từ • ID: {bt.idBoThe}
                        </div>
                      </div>
                      {daCo && (
                        <span
                          style={{
                            fontSize: 12,
                            padding: "4px 8px",
                            background: "#f3f4f6",
                            borderRadius: 999,
                          }}
                        >
                          Đã có trong khóa học
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="popup-footer" style={{ gap: 8 }}>
          <button
            className="btn-primary"
            onClick={diTaoBoThe}
            style={{ background: "#6b7280" }}
          >
            Tạo bộ thẻ mới
          </button>
          <button className="btn-primary" onClick={xuLyXacNhan} disabled={daChon.size === 0}>
            Thêm vào khóa học
          </button>
        </div>
      </div>
    </div>
  );
}
