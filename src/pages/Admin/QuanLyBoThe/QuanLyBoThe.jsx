import { useEffect, useMemo, useState } from "react";
import MainContentQLBT from "./MainQuanLyBoThe/MainContent";

import { db } from "../../../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const QuanLyBoThe = () => {
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // boThe
    const unsubCards = onSnapshot(
      collection(db, "boThe"),
      (snap) => {
        const list = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
        setCards(list);
      },
      () => setCards([])
    );

    // nguoiDung
    const unsubUsers = onSnapshot(
      collection(db, "nguoiDung"),
      (snap) => {
        const list = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
        setUsers(list);
      },
      () => setUsers([])
    );

    return () => {
      unsubCards();
      unsubUsers();
    };
  }, []);

  const Databothe = useMemo(() => {
    const nameById = new Map(
      users.map((u) => [String(u.idNguoiDung ?? u._docId), u.tenNguoiDung || "Ẩn danh"])
    );

    return (Array.isArray(cards) ? cards : []).map((item) => {
      const id = item.idBoThe ?? item._docId ?? "";
      const name = item.tenBoThe ?? "";
      const userid = String(item.idNguoiDung ?? "");
      const userCreated = nameById.get(userid) || "Ẩn danh";
      const numBer =
        item.soTu ??
        (Array.isArray(item.danhSachThe) ? item.danhSachThe.length : 0) ??
        0;

      return { id, name, userCreated, numBer };
    });
  }, [cards, users]);

  return <MainContentQLBT Data={Databothe} />;
};

export default QuanLyBoThe;
