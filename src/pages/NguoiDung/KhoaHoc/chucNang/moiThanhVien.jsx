// src/components/MoiThanhVien/MoiThanhVien.jsx
import React, { useMemo, useState, useEffect } from "react";
import "./MoiThanhVien.css";

import { auth, db } from "../../../../../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  limit,
  documentId,
} from "firebase/firestore";

/* ================= Helpers ================= */
const splitTokens = (txt) =>
  (txt || "")
    .split(/[\n,]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

const buildPages = (current, max) => {
  const pages = [];
  if (max <= 7) {
    for (let p = 1; p <= max; p++) pages.push(p);
    return pages;
  }
  pages.push(1);
  const left = Math.max(2, current - 1);
  const right = Math.min(max - 1, current + 1);
  if (left > 2) pages.push("…");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < max - 1) pages.push("…");
  pages.push(max);
  return pages;
};

const chunk = (arr, n = 10) => {
  const rs = [];
  for (let i = 0; i < arr.length; i += n) rs.push(arr.slice(i, i + n));
  return rs;
};

/** Tìm docRef khóa học theo docId hoặc field idKhoaHoc */
async function getCourseDocRefByAnyId(id) {
  const idStr = String(id);
  const ref1 = doc(db, "khoaHoc", idStr);
  const s1 = await getDoc(ref1);
  if (s1.exists()) return ref1;

  const rs = await getDocs(
    query(collection(db, "khoaHoc"), where("idKhoaHoc", "==", idStr), limit(1))
  );
  if (!rs.empty) return rs.docs[0].ref;
  return null;
}

/** Lấy người dùng theo danh sách ID: thử documentId() trước, còn thiếu thì thử field idNguoiDung */
async function fetchUsersByIds(ids) {
  const out = new Map();
  const uniq = Array.from(new Set(ids.map(String).filter(Boolean)));
  if (uniq.length === 0) return out;

  // 1) documentId() in [...]
  for (const group of chunk(uniq, 10)) {
    const rs = await getDocs(
      query(collection(db, "nguoiDung"), where(documentId(), "in", group))
    );
    rs.docs.forEach((d) => {
      const u = d.data();
      out.set(d.id, {
        _key: d.id,
        idNguoiDung: u?.idNguoiDung ?? d.id,
        tenNguoiDung: u?.tenNguoiDung || u?.hoten || u?.email || "Người dùng",
        email: u?.email || "",
      });
    });
  }

  // 2) Phần còn thiếu → thử theo field idNguoiDung in [...]
  const missing = uniq.filter((id) => !out.has(id));
  for (const group of chunk(missing, 10)) {
    const rs = await getDocs(
      query(collection(db, "nguoiDung"), where("idNguoiDung", "in", group))
    );
    rs.docs.forEach((d) => {
      const u = d.data();
      const key = String(u?.idNguoiDung || d.id);
      out.set(key, {
        _key: d.id,
        idNguoiDung: key,
        tenNguoiDung: u?.tenNguoiDung || u?.hoten || u?.email || "Người dùng",
        email: u?.email || "",
      });
    });
  }

  return out;
}

/** Tìm người dùng theo danh sách token (email/username) */
async function findUsersByTokens(tokens) {
  const found = new Map();

  // Ưu tiên exact match các field phổ biến
  const tryExact = async (field, values) => {
    if (!values.length) return;
    for (const group of chunk(values.slice(0, 50), 10)) {
      const rs = await getDocs(
        query(collection(db, "nguoiDung"), where(field, "in", group))
      );
      rs.docs.forEach((d) => {
        const u = d.data();
        const key = String(u?.idNguoiDung || d.id);
        found.set(key, {
          _key: d.id,
          idNguoiDung: key,
          tenNguoiDung: u?.tenNguoiDung || u?.hoten || u?.email || "Người dùng",
          email: u?.email || "",
        });
      });
    }
  };

  const emails = tokens.filter((t) => t.includes("@"));
  const names = tokens.filter((t) => !t.includes("@"));

  // 1) exact email & username
  await tryExact("email", emails);
  await tryExact("tenNguoiDung", names);

  // 2) nếu DB có field lower-case → dùng để match không phân biệt hoa-thường
  const emailsLower = emails.map((x) => x.toLowerCase());
  const namesLower = names.map((x) => x.toLowerCase());
  await tryExact("emailLower", emailsLower);
  await tryExact("tenNguoiDungLower", namesLower);

  return found; // Map keyed by idNguoiDung (hoặc doc id)
}

/* ================= Component ================= */
export default function MoiThanhVien({ idKhoaHoc, onCapNhat }) {
  const [textMoi, setTextMoi] = useState("");
  const [thongBao, setThongBao] = useState("");

  // Khoá học + realtime
  const [courseRef, setCourseRef] = useState(null);
  const [khoaHoc, setKhoaHoc] = useState(null);

  // Cache người dùng (id -> info)
  const [userCache, setUserCache] = useState(new Map());

  // Phân trang
  const PAGE_SIZE_PENDING = 5;
  const PAGE_SIZE_MEMBER = 8;
  const [pagePending, setPagePending] = useState(1);
  const [pageMember, setPageMember] = useState(1);

  const thanhVienIds = useMemo(
    () => (Array.isArray(khoaHoc?.thanhVienIds) ? khoaHoc.thanhVienIds.map(String) : []),
    [khoaHoc]
  );
  const pendingIds = useMemo(
    () => (Array.isArray(khoaHoc?.yeuCauThamGiaIds) ? khoaHoc.yeuCauThamGiaIds.map(String) : []),
    [khoaHoc]
  );
  const idChuKhoa = useMemo(() => String(khoaHoc?.idNguoiDung || ""), [khoaHoc]);

  // ===== 1) Lấy doc khóa học + theo dõi realtime =====
  useEffect(() => {
    let unsub = null;
    (async () => {
      const ref = await getCourseDocRefByAnyId(idKhoaHoc);
      setCourseRef(ref);
      if (!ref) {
        setKhoaHoc(null);
        return;
      }
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            setKhoaHoc(null);
            return;
          }
          setKhoaHoc({ _docId: ref.id, ...snap.data() });
        },
        () => setKhoaHoc(null)
      );
    })();

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [idKhoaHoc]);

  // ===== 2) Tải thông tin người dùng cho member + pending =====
  useEffect(() => {
    (async () => {
      const ids = Array.from(new Set([...thanhVienIds, ...pendingIds]));
      if (ids.length === 0) {
        setUserCache(new Map());
        return;
      }
      const map = await fetchUsersByIds(ids);
      setUserCache(map);
    })();
  }, [thanhVienIds.join(","), pendingIds.join(",")]);

  // ===== 3) Clamp phân trang khi data thay đổi =====
  const totalPending = pendingIds.length;
  const totalMember = thanhVienIds.length;
  const maxPendingPage = Math.max(1, Math.ceil(totalPending / PAGE_SIZE_PENDING));
  const maxMemberPage = Math.max(1, Math.ceil(totalMember / PAGE_SIZE_MEMBER));
  useEffect(() => {
    if (pagePending > maxPendingPage) setPagePending(maxPendingPage);
  }, [maxPendingPage, pagePending]);
  useEffect(() => {
    if (pageMember > maxMemberPage) setPageMember(maxMemberPage);
  }, [maxMemberPage, pageMember]);

  const startPending = (pagePending - 1) * PAGE_SIZE_PENDING;
  const startMember = (pageMember - 1) * PAGE_SIZE_MEMBER;
  const pendingPageIds = pendingIds.slice(startPending, startPending + PAGE_SIZE_PENDING);
  const memberPageIds = thanhVienIds.slice(startMember, startMember + PAGE_SIZE_MEMBER);

  // ===== 4) Mời trực tiếp (email / tên người dùng) =====
  const handleMoi = async () => {
    setThongBao("");
    const tokens = splitTokens(textMoi);
    if (tokens.length === 0) {
      setThongBao("Nhập email hoặc tên người dùng trước đã.");
      return;
    }

    try {
      const found = await findUsersByTokens(tokens); // Map keyed by idNguoiDung/docId
      const idsMoi = Array.from(found.keys());

      if (idsMoi.length === 0) {
        setThongBao("Không tìm thấy người dùng phù hợp.");
        return;
      }
      if (!courseRef || !khoaHoc) {
        setThongBao("Không tìm thấy khóa học.");
        return;
      }

      const cu = Array.isArray(khoaHoc.thanhVienIds) ? khoaHoc.thanhVienIds.map(String) : [];
      const newIds = idsMoi.filter((id) => !cu.includes(String(id)));
      if (newIds.length === 0) {
        setThongBao("Tất cả đã có trong khóa học.");
        setTextMoi("");
        return;
      }

      await updateDoc(courseRef, { thanhVienIds: arrayUnion(...newIds.map(String)) });

      setTextMoi("");
      setThongBao(`Đã thêm ${newIds.length} thành viên mới.`);
      // onSnapshot sẽ tự cập nhật; nếu muốn callback lên cha:
      onCapNhat?.({ ...khoaHoc, thanhVienIds: Array.from(new Set([...cu, ...newIds])) });
    } catch (e) {
      console.error("Mời thành viên thất bại:", e);
      setThongBao("Không thể mời thành viên. Vui lòng thử lại.");
    }
  };

  // ===== 5) Duyệt yêu cầu =====
  const chapNhan = async (idNguoiDung) => {
    try {
      if (!courseRef) return;
      await updateDoc(courseRef, {
        yeuCauThamGiaIds: arrayRemove(String(idNguoiDung)),
        thanhVienIds: arrayUnion(String(idNguoiDung)),
      });
      setThongBao("Đã chấp nhận yêu cầu tham gia.");
    } catch (e) {
      console.error(e);
      setThongBao("Không thể chấp nhận yêu cầu.");
    }
  };

  const tuChoi = async (idNguoiDung) => {
    try {
      if (!courseRef) return;
      await updateDoc(courseRef, {
        yeuCauThamGiaIds: arrayRemove(String(idNguoiDung)),
      });
      setThongBao("Đã từ chối yêu cầu tham gia.");
    } catch (e) {
      console.error(e);
      setThongBao("Không thể từ chối yêu cầu.");
    }
  };

  // ===== 6) Quản lý thành viên =====
  const xoaThanhVien = async (idNguoiDung) => {
    if (String(idNguoiDung) === String(idChuKhoa)) {
      alert("Không thể xóa chủ khóa học.");
      return;
    }
    if (!window.confirm("Xóa thành viên này khỏi khóa học?")) return;

    try {
      if (!courseRef) return;
      await updateDoc(courseRef, {
        thanhVienIds: arrayRemove(String(idNguoiDung)),
      });
      setThongBao("Đã xóa thành viên.");
    } catch (e) {
      console.error(e);
      setThongBao("Không thể xóa thành viên.");
    }
  };

  // ===== 7) Render =====
  const getUser = (id) => {
    const u = userCache.get(String(id));
    return u || { tenNguoiDung: "Người dùng", email: "" };
  };

  return (
    <div className="mtv-wrap">
      {/* Mời qua email / tên người dùng */}
      <section className="mtv-panel">
        <h3 className="mtv-title">Mời qua email / tên người dùng</h3>
        <textarea
          className="mtv-textarea"
          rows={3}
          placeholder="Nhập email hoặc tên người dùng (ngăn cách bởi dấu phẩy hoặc xuống dòng)"
          value={textMoi}
          onChange={(e) => setTextMoi(e.target.value)}
        />
        <div className="mtv-actions">
          <button className="mtv-btn mtv-btn--primary" onClick={handleMoi}>
            Mời
          </button>
        </div>
        {thongBao && <div className="mtv-note">{thongBao}</div>}
      </section>

      {/* YÊU CẦU THAM GIA */}
      <section className="mtv-panel">
        <div className="mtv-panel-head">
          <h3 className="mtv-title">Yêu cầu tham gia ({totalPending})</h3>
        </div>

        {totalPending === 0 ? (
          <div className="mtv-empty">Không có yêu cầu nào.</div>
        ) : (
          <>
            <ul className="mtv-list">
              {pendingPageIds.map((uid) => {
                const u = getUser(uid);
                return (
                  <li className="mtv-row" key={uid}>
                    <div className="mtv-user">
                      <strong>{u.tenNguoiDung}</strong>
                      <span className="mtv-muted">({u.email || "—"})</span>
                    </div>
                    <div className="mtv-row-actions">
                      <button className="mtv-btn mtv-btn--success" onClick={() => chapNhan(uid)}>
                        Chấp nhận
                      </button>
                      <button className="mtv-btn mtv-btn--danger" onClick={() => tuChoi(uid)}>
                        Từ chối
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {maxPendingPage > 1 && (
              <div className="mtv-pagination">
                <button
                  className="mtv-page-btn"
                  onClick={() => setPagePending((p) => Math.max(1, p - 1))}
                  disabled={pagePending === 1}
                  aria-label="Trang trước"
                >
                  «
                </button>
                {buildPages(pagePending, maxPendingPage).map((p, i) =>
                  p === "…" ? (
                    <span className="mtv-page-ellipsis" key={`pp-ellipsis-${i}`}>…</span>
                  ) : (
                    <button
                      key={`pp-${p}`}
                      className={`mtv-page-btn ${p === pagePending ? "active" : ""}`}
                      onClick={() => setPagePending(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className="mtv-page-btn"
                  onClick={() => setPagePending((p) => Math.min(maxPendingPage, p + 1))}
                  disabled={pagePending === maxPendingPage}
                  aria-label="Trang sau"
                >
                  »
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* THÀNH VIÊN */}
      <section className="mtv-panel">
        <div className="mtv-panel-head">
          <h3 className="mtv-title">Thành viên ({totalMember})</h3>
        </div>

        {totalMember === 0 ? (
          <div className="mtv-empty">Chưa có thành viên nào.</div>
        ) : (
          <>
            <ul className="mtv-list">
              {memberPageIds.map((uid) => {
                const u = getUser(uid);
                const isOwnerRow = String(uid) === String(idChuKhoa);
                return (
                  <li className="mtv-row" key={uid}>
                    <div className="mtv-user">
                      <strong>{u.tenNguoiDung}</strong>
                      <span className="mtv-muted">({u.email || "—"})</span>
                      {isOwnerRow && <span className="mtv-badge">Chủ khóa</span>}
                    </div>
                    {!isOwnerRow && (
                      <button className="mtv-btn mtv-btn--danger" onClick={() => xoaThanhVien(uid)}>
                        Xóa
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {maxMemberPage > 1 && (
              <div className="mtv-pagination">
                <button
                  className="mtv-page-btn"
                  onClick={() => setPageMember((p) => Math.max(1, p - 1))}
                  disabled={pageMember === 1}
                  aria-label="Trang trước"
                >
                  «
                </button>
                {buildPages(pageMember, maxMemberPage).map((p, i) =>
                  p === "…" ? (
                    <span className="mtv-page-ellipsis" key={`mp-ellipsis-${i}`}>…</span>
                  ) : (
                    <button
                      key={`mp-${p}`}
                      className={`mtv-page-btn ${p === pageMember ? "active" : ""}`}
                      onClick={() => setPageMember(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className="mtv-page-btn"
                  onClick={() => setPageMember((p) => Math.min(maxMemberPage, p + 1))}
                  disabled={pageMember === maxMemberPage}
                  aria-label="Trang sau"
                >
                  »
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
