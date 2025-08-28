// src/pages/NguoiDung/Vi/utils/dinhDang.js

const VN = "vi-VN";

/** Chuẩn hoá mọi kiểu về Date (hỗ trợ Firestore Timestamp, ms/seconds, string) */
export function toDate(v) {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate();      // Firestore Timestamp
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    // nếu có vẻ là giây (10 số) thì đổi sang ms
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Định dạng ngày/giờ theo vi-VN. 
 *  @param {any} v - Date/Timestamp/number/string
 *  @param {{withTime?: boolean}} opts - withTime=true để hiện cả giờ
 */
export function formatDate(v, opts = {}) {
  const { withTime = true } = opts;
  const d = toDate(v);
  if (!d) return "";
  return withTime ? d.toLocaleString(VN) : d.toLocaleDateString(VN);
}

/** Định dạng tiền VND kiểu "1.234đ" (không dùng ký hiệu ₫ để đồng nhất UI) */
export function formatVND(n) {
  const x = Number(n || 0);
  return `${x.toLocaleString("vi-VN")}đ`;
}

/** Ép số an toàn, fallback nếu NaN/undefined/null */
export function toNumberSafe(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Nhận biết loại rút tiền từ trường `loai` trong BDCV */
export function isWithdrawType(loai) {
  const t = String(loai || "").toLowerCase();
  return t === "chi_rut_tien" || t === "rut_tien" || t === "withdraw";
}
