import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSession } from "/providers/AuthProvider";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

async function hasActiveSub(uid) {
  const now = new Date();
  // Yêu cầu Firestore có collection "subscriptions" với fields: userId, status, expiresAt (Timestamp)
  const q = query(
    collection(db, "subscriptions"),
    where("userId", "==", uid),
    where("status", "==", "active"),
    where("expiresAt", ">=", now)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export default function YeuCauTraPhi() {
  const { user, loading } = useSession();
  const location = useLocation();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      const valid = await hasActiveSub(user.uid);
      if (mounted) setOk(valid);
    })();
    return () => (mounted = false);
  }, [user]);

  if (loading || ok === null) return null; // hoặc spinner
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location }} />;

  if (!ok) {
    return <Navigate to="/tra-phi" replace state={{ from: location, reason: "no_active_sub" }} />;
  }
  return <Outlet />;
}
