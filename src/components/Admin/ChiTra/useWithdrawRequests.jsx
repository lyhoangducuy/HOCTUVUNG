// src/pages/Admin/ChiTra/hooks/useWithdrawRequests.js
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function useWithdrawRequests(db) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    let unsub;
    try {
      unsub = onSnapshot(
        query(collection(db, "rutTien"), orderBy("NgayTao", "desc")),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setRows(list);
          setLoading(false);
        },
        () => { setRows([]); setLoading(false); }
      );
    } catch {
      unsub = onSnapshot(collection(db, "rutTien"), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b?.NgayTao?.seconds || 0) - (a?.NgayTao?.seconds || 0));
        setRows(list);
        setLoading(false);
      });
    }
    return () => unsub && unsub();
  }, [db]);

  return { rows, loading };
}
