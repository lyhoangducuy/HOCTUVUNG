import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const Ctx = createContext({ user: null, profile: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({ user: null, profile: null, loading: true });

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return setState({ user: null, profile: null, loading: false });
      const snap = await getDoc(doc(db, "users", u.uid));
      setState({ user: u, profile: snap.exists() ? snap.data() : null, loading: false });
    });
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
};

export const useSession = () => useContext(Ctx);
