// src/pages/Admin/ChiTra/components/FeeConfig.jsx
import React, { useState, useCallback } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db as defaultDb } from "../../../../lib/firebase";

export default function FeeConfig({ feePct, setFeePct, db }) {
  const database = db || defaultDb;
  const [saving, setSaving] = useState(false);

  const saveFee = useCallback(async () => {
    if (!database) return;
    try {
      setSaving(true);
      const pct = Math.min(Math.max(Number(feePct) || 0, 0), 100);
      await setDoc(
        doc(database, "cauHinh", "rutTien"),
        { phiPhanTram: pct, updatedAt: serverTimestamp() },
        { merge: true }
      );
      alert("Đã lưu phí mới.");
    } catch (e) {
      console.error(e);
      alert("Không thể lưu phí. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }, [database, feePct]);

  return (
    <div className="rt-config-left">
      <label className="rt-label">Phí hiện tại (%)</label>
      <input
        className="rt-input2"
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={feePct}
        onChange={(e) => setFeePct(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") saveFee();
        }}
      />
      <button
        className="rt-btn rt-btn-primary"
        onClick={saveFee}
        disabled={saving}
      >
        {saving ? "Đang lưu…" : "Cập nhật phí"}
      </button>
    </div>
  );
}
