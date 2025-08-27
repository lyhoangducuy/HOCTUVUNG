import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./TrangTimKiem.css";

import { db } from "../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  limit,
  where,          // <-- THÊM
} from "firebase/firestore";

/* ---------- Item components ---------- */
function ItemBoThe({ item, dsNguoiDung, onClick }) {
  const nguoiTao = dsNguoiDung.find(
    (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
  );
  const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
  const anhNguoiTao = nguoiTao?.anhDaiDien || "";

  return (
    <div className="item-Search" onClick={() => onClick(item.idBoThe)}>
      <h1>{item.tenBoThe || "Không tên"}</h1>
      <p>{item.soTu ?? (item.danhSachThe?.length || 0)} thẻ</p>
      <div className="user-item">
        <div
          className="mini-avatar"
          style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
        />
        <span>{tenNguoiTao}</span>
      </div>
      <button
        className="btn-hoc"
        onClick={(e) => {
          e.stopPropagation();
          onClick(item.idBoThe);
        }}
      >
        Học
      </button>
    </div>
  );
}

function ItemUser({ item }) {
  return (
    <div className="item-Search">
      <div className="user-item">
        <div
          className="mini-avatar"
          style={item.anhDaiDien ? { backgroundImage: `url(${item.anhDaiDien})` } : {}}
        />
        <span>{item.tenNguoiDung}</span>
      </div>
    </div>
  );
}

function ItemKhoaHoc({ item, dsNguoiDung, onClick }) {
  const nguoiTao = dsNguoiDung.find(
    (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
  );
  const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
  const anhNguoiTao = nguoiTao?.anhDaiDien || "";

  return (
    <div className="item-Search" onClick={() => onClick(item.idKhoaHoc)}>
      <h1>{item.tenKhoaHoc || "Khóa học"}</h1>
      <p>
        {(item.boTheIds?.length || 0)} bộ thẻ • {(item.thanhVienIds?.length || 0)} thành viên
      </p>
      {Array.isArray(item.kienThuc) && item.kienThuc.length > 0 && (
        <div className="tags">
          {item.kienThuc.map((t, i) => (
            <span className="tag" key={i}>
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="user-item">
        <div
          className="mini-avatar"
          style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
        />
        <span>{tenNguoiTao}</span>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function TrangTimKiem() {
  const { id } = useParams(); // /search/:id
  const navigate = useNavigate();

  const [typeSearch, setTypeSearch] = useState("All");
  const [boThe, setBoThe] = useState([]);
  const [nguoiDung, setNguoiDung] = useState([]);
  const [khoaHoc, setKhoaHoc] = useState([]);

  // nạp dữ liệu từ Firestore
  useEffect(() => {
    // >>> CHỈ LẤY BỘ THẺ CÔNG KHAI
    const unsubBoThe = onSnapshot(
      query(
        collection(db, "boThe"),
        where("cheDo", "==", "cong_khai"),
        limit(200)
      ),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            soTu:
              typeof data.soTu === "number"
                ? data.soTu
                : Array.isArray(data.danhSachThe)
                ? data.danhSachThe.length
                : 0,
          };
        });
        setBoThe(list);
      },
      () => setBoThe([])
    );

    const unsubNguoiDung = onSnapshot(
      query(collection(db, "nguoiDung"), limit(200)),
      (snap) => setNguoiDung(snap.docs.map((d) => d.data())),
      () => setNguoiDung([])
    );

    const unsubKhoaHoc = onSnapshot(
      query(collection(db, "khoaHoc"), limit(200)),
      (snap) => {
        const list = snap.docs.map((d) => {
          const x = d.data();
          return {
            ...x,
            boTheIds: Array.isArray(x.boTheIds) ? x.boTheIds : [],
            thanhVienIds: Array.isArray(x.thanhVienIds) ? x.thanhVienIds : [],
            kienThuc: Array.isArray(x.kienThuc) ? x.kienThuc : [],
          };
        });
        setKhoaHoc(list);
      },
      () => setKhoaHoc([])
    );

    return () => {
      unsubBoThe();
      unsubNguoiDung();
      unsubKhoaHoc();
    };
  }, []);

  const q = useMemo(() => String(id || "").trim().toLowerCase(), [id]);

  // lọc kết quả (client-side)
  const listBoTheTimKiem = useMemo(() => {
    if (!q) return boThe;
    return boThe.filter((x) => (x.tenBoThe || "").toLowerCase().includes(q));
  }, [boThe, q]);

  const listUserTimKiem = useMemo(() => {
    if (!q) return nguoiDung;
    return nguoiDung.filter((x) => (x.tenNguoiDung || "").toLowerCase().includes(q));
  }, [nguoiDung, q]);

  const listKhoaHocTimKiem = useMemo(() => {
    if (!q) return khoaHoc;
    return khoaHoc.filter((k) => {
      const byName = (k.tenKhoaHoc || "").toLowerCase().includes(q);
      const byTag = Array.isArray(k.kienThuc)
        ? k.kienThuc.some((t) => String(t).toLowerCase().includes(q))
        : false;
      return byName || byTag;
    });
  }, [khoaHoc, q]);

  // điều hướng
  const denHoc = (idBoThe) => navigate(`/flashcard/${idBoThe}`);
  const denKhoaHoc = (idKhoaHoc) => navigate(`/khoaHoc/${idKhoaHoc}`);

  return (
    <div className="search-container">
      <div className="type-search">
        <ul>
          <li
            className={typeSearch === "All" ? "active" : ""}
            onClick={() => setTypeSearch("All")}
          >
            All
          </li>
          <li
            className={typeSearch === "BoThe" ? "active" : ""}
            onClick={() => setTypeSearch("BoThe")}
          >
            Bộ thẻ
          </li>
          <li
            className={typeSearch === "User" ? "active" : ""}
            onClick={() => setTypeSearch("User")}
          >
            Người dùng
          </li>
          <li
            className={typeSearch === "KhoaHoc" ? "active" : ""}
            onClick={() => setTypeSearch("KhoaHoc")}
          >
            Khóa học
          </li>
        </ul>
      </div>

      <div className="list-Search">
        {typeSearch === "All" && (
          <>
            <h3 className="list-Search-title">Bộ thẻ</h3>
            {listBoTheTimKiem.length > 0
              ? listBoTheTimKiem.map((item) => (
                  <ItemBoThe
                    key={item.idBoThe}
                    item={item}
                    dsNguoiDung={nguoiDung}
                    onClick={denHoc}
                  />
                ))
              : "Không tìm thấy bộ thẻ nào"}

            <h3 className="list-Search-title">Người dùng</h3>
            {listUserTimKiem.length > 0
              ? listUserTimKiem.map((item) => (
                  <ItemUser key={`user-${item.idNguoiDung}`} item={item} />
                ))
              : "Không tìm thấy người dùng nào"}

            <h3 className="list-Search-title">Khóa học</h3>
            {listKhoaHocTimKiem.length > 0
              ? listKhoaHocTimKiem.map((item) => (
                  <ItemKhoaHoc
                    key={`kh-${item.idKhoaHoc}`}
                    item={item}
                    dsNguoiDung={nguoiDung}
                    onClick={denKhoaHoc}
                  />
                ))
              : "Không tìm thấy khóa học nào"}
          </>
        )}

        {typeSearch === "BoThe" &&
          (listBoTheTimKiem.length > 0
            ? listBoTheTimKiem.map((item) => (
                <ItemBoThe
                  key={item.idBoThe}
                  item={item}
                  dsNguoiDung={nguoiDung}
                  onClick={denHoc}
                />
              ))
            : "Không tìm thấy bộ thẻ nào")}

        {typeSearch === "User" &&
          (listUserTimKiem.length > 0
            ? listUserTimKiem.map((item) => (
                <ItemUser key={`user-${item.idNguoiDung}`} item={item} />
              ))
            : "Không tìm thấy người dùng nào")}

        {typeSearch === "KhoaHoc" &&
          (listKhoaHocTimKiem.length > 0
            ? listKhoaHocTimKiem.map((item) => (
                <ItemKhoaHoc
                  key={`kh-${item.idKhoaHoc}`}
                  item={item}
                  dsNguoiDung={nguoiDung}
                  onClick={denKhoaHoc}
                />
              ))
            : "Không tìm thấy khóa học nào")}
      </div>
    </div>
  );
}
