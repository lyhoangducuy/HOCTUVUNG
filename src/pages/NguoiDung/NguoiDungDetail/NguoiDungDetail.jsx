import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./NguoiDungDetail.css";

import { db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";

// ===== Mapping vai trò → nhãn & class CSS =====
const ROLE_LABELS = {
  HOC_VIEN: "Học viên",
  GIANG_VIEN: "Giảng viên",
  ADMIN: "Quản trị",
};
const roleLabel = (r) => ROLE_LABELS[r] || "Người dùng";
const roleClass = (r) =>
  ({ HOC_VIEN: "hoc_vien", GIANG_VIEN: "giang_vien", ADMIN: "admin" }[r] ||
    "khac");

export default function NguoiDungDetail() {
  const { uid } = useParams(); // route: /user/:uid
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState([]);      // boThe của user -> lọc công khai
  const [courses, setCourses] = useState([]);  // khoaHoc của user (chỉ cho GIANG_VIEN)
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // ===== Load profile =====
  useEffect(() => {
    if (!uid) return;
    setLoadingProfile(true);
    const unsub = onSnapshot(
      doc(db, "nguoiDung", String(uid)),
      (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
        setLoadingProfile(false);
      },
      () => setLoadingProfile(false)
    );
    return () => unsub();
  }, [uid]);

  // ===== Load boThe của user (lọc công khai ở client để tránh cần composite index) =====
  useEffect(() => {
    if (!uid) return;
    setLoadingCards(true);
    const unsub = onSnapshot(
      query(collection(db, "boThe"), where("idNguoiDung", "==", String(uid)), limit(300)),
      (snap) => {
        const rows = snap.docs.map((d) => {
          const x = d.data();
          return {
            ...x,
            soTu:
              typeof x.soTu === "number"
                ? x.soTu
                : Array.isArray(x.danhSachThe)
                ? x.danhSachThe.length
                : 0,
            luotHoc: Number(x.luotHoc || 0),
          };
        });
        setCards(rows);
        setLoadingCards(false);
      },
      () => setLoadingCards(false)
    );
    return () => unsub();
  }, [uid]);

  // ===== Load khoaHoc nếu là GIANG_VIEN =====
  useEffect(() => {
    if (!uid) return;
    if (profile?.vaiTro !== "GIANG_VIEN") {
      setCourses([]);
      setLoadingCourses(false);
      return;
    }
    setLoadingCourses(true);
    const unsub = onSnapshot(
      query(collection(db, "khoaHoc"), where("idNguoiDung", "==", String(uid)), limit(200)),
      (snap) => {
        const rows = snap.docs.map((d) => {
          const x = d.data();
          return {
            ...x,
            boTheIds: Array.isArray(x.boTheIds) ? x.boTheIds : [],
            thanhVienIds: Array.isArray(x.thanhVienIds) ? x.thanhVienIds : [],
            kienThuc: Array.isArray(x.kienThuc) ? x.kienThuc : [],
          };
        });
        setCourses(rows);
        setLoadingCourses(false);
      },
      () => setLoadingCourses(false)
    );
    return () => unsub();
  }, [uid, profile?.vaiTro]);

  // ===== Derived =====
  const cardsPublic = useMemo(
    () =>
      cards
        .filter((c) => c.cheDo === "cong_khai")
        .sort((a, b) => Number(b.luotHoc || 0) - Number(a.luotHoc || 0)),
    [cards]
  );

  const fullName = profile?.hoten || "";
  const userName = profile?.tenNguoiDung || "";
  const email = profile?.email || "";
  const avatar = profile?.anhDaiDien || "";
  const role = profile?.vaiTro || "";

  // ===== Handlers =====
  const denHoc = (idBoThe) => navigate(`/flashcard/${idBoThe}`);
  const denKhoaHoc = (idKhoaHoc) => navigate(`/khoaHoc/${idKhoaHoc}`);

  return (
    <div className="userpage-wrap">
      {/* Header: avatar + info */}
      <section className="user-head">
        <div
          className="avatar"
          style={avatar ? { backgroundImage: `url(${avatar})` } : {}}
        />
        <div className="user-info">
          <h2 className="user-username">
            {loadingProfile ? "Đang tải..." : userName || "Người dùng"}
          </h2>
          <div className="user-fullname">{fullName}</div>
          <div className="user-email">{email}</div>
          <div className={`user-role ${roleClass(role)}`}>{roleLabel(role)}</div>
        </div>
      </section>

      {/* Bộ thẻ công khai */}
      <section className="block">
        <div className="block-head">
          <h3 className="block-title">Bộ thẻ công khai</h3>
          {!loadingCards && (
            <div className="block-sub">{cardsPublic.length} bộ thẻ</div>
          )}
        </div>

        {loadingCards ? (
          <div className="empty">Đang tải bộ thẻ...</div>
        ) : cardsPublic.length === 0 ? (
          <div className="empty">Chưa có bộ thẻ công khai nào.</div>
        ) : (
          <div className="grid-cards">
            {cardsPublic.map((c) => (
              <div key={c.idBoThe} className="card" onClick={() => denHoc(c.idBoThe)}>
                <div className="card-title">{c.tenBoThe || "Không tên"}</div>
                <div className="card-sub">
                  {(c.soTu ?? 0)} thẻ • {(c.luotHoc ?? 0)} lượt học
                </div>
                <div className="card-actions">
                  <button
                    className="btn ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      denHoc(c.idBoThe);
                    }}
                  >
                    Học
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Khóa học (chỉ GIANG_VIEN) */}
      {role === "GIANG_VIEN" && (
        <section className="block">
          <div className="block-head">
            <h3 className="block-title">Khóa học</h3>
            {!loadingCourses && (
              <div className="block-sub">{courses.length} khóa</div>
            )}
          </div>

          {loadingCourses ? (
            <div className="empty">Đang tải khóa học...</div>
          ) : courses.length === 0 ? (
            <div className="empty">Chưa có khóa học nào.</div>
          ) : (
            <div className="grid-courses">
              {courses.map((k) => (
                <div
                  key={k.idKhoaHoc}
                  className="course"
                  onClick={() => denKhoaHoc(k.idKhoaHoc)}
                >
                  <div className="course-title">{k.tenKhoaHoc || "Khóa học"}</div>
                  <div className="course-sub">
                    {(k.boTheIds?.length || 0)} bộ thẻ • {(k.thanhVienIds?.length || 0)} thành viên
                  </div>
                  {Array.isArray(k.kienThuc) && k.kienThuc.length > 0 && (
                    <div className="tags">
                      {k.kienThuc.map((t, i) => (
                        <span className="tag" key={i}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="course-actions">
                    <button
                      className="btn ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        denKhoaHoc(k.idKhoaHoc);
                      }}
                    >
                      Xem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
