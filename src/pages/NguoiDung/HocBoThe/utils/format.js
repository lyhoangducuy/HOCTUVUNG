export const formatDateVN = (v) => {
  if (!v) return "";
  const d =
    typeof v?.toDate === "function" ? v.toDate() :
    v instanceof Date ? v : new Date(v);
  return Number.isNaN(d?.getTime?.()) ? "" : d.toLocaleString("vi-VN");
};
