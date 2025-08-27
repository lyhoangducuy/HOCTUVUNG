import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./TrangTimKiem.css";
import { db } from "../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  limit,
  where,
} from "firebase/firestore";
import ItemKhoaHoc from "../../../components/TimKiem/ItemKhoaHoc";
import ItemUser from "../../../components/TimKiem/ItemUser";
import ItemBoThe from "../../../components/TimKiem/ItemBoThe";





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
    // Bộ thẻ công khai
    const unsubBoThe = onSnapshot(
      query(collection(db, "boThe"), where("cheDo", "==", "cong_khai"), limit(200)),
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

    // Người dùng (đảm bảo có idNguoiDung)
    const unsubNguoiDung = onSnapshot(
      query(collection(db, "nguoiDung"), limit(200)),
      (snap) =>
        setNguoiDung(
          snap.docs.map((d) => {
            const x = d.data();
            return { ...x, idNguoiDung: x.idNguoiDung ?? d.id };
          })
        ),
      () => setNguoiDung([])
    );

    // Khóa học
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
  const denNguoiDung = (uid) => navigate(`/nguoiDung/${uid}`);

  return (
    <div className="search-container">
      <div className="type-search">
        <ul>
          <li className={typeSearch === "All" ? "active" : ""} onClick={() => setTypeSearch("All")}>
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
                  <ItemUser
                    key={`user-${item.idNguoiDung}`}
                    item={item}
                    onClick={denNguoiDung}
                  />
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
                <ItemUser
                  key={`user-${item.idNguoiDung}`}
                  item={item}
                  onClick={denNguoiDung}
                />
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
