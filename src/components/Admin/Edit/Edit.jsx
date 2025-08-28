// src/components/Admin/Edit/Edit.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./Edit.css";

/**
 * Props:
 * - user: object dữ liệu đang chỉnh
 * - onClose(): đóng modal
 * - onSave(payload, isEditFlag?): parent tự đóng khi thành công
 * - isEditMode: boolean (parent bật bằng cách gọi onSave(user, true))
 * - Colums: [{ name, key, options? }]           // nếu có options sẽ render dropdown
 * - showAvatar?: boolean
 *
 * Mở rộng:
 * - readOnlyKeys?: string[]
 * - selectOptions?: { [key]: Array<string | {value,label}> }  // có thể truyền ngoài cột
 *
 * Validate:
 * - validationSchema?: Yup schema
 * - validateOnChange?: boolean (mặc định false: chỉ onBlur + khi Lưu)
 */
const Edit = ({
  user,
  onClose,
  onSave,
  isEditMode = false,
  Colums = [],
  showAvatar = false,
  readOnlyKeys = [],
  selectOptions = {},           // map key -> options
  validationSchema,             // Yup schema
  validateOnChange = false,
}) => {
  const [formData, setFormData] = useState({ ...user });
  const [errors, setErrors] = useState({}); // { key: "message" }
  const fileInputRef = useRef(null);

  /* ========== sync dữ liệu ========== */
  useEffect(() => {
    setFormData({ ...user });
    setErrors({});
  }, [user]);

  /* ========== helpers ========== */
  const isTimestamp = (v) =>
    v && (typeof v?.toDate === "function" || (typeof v?.seconds === "number" && typeof v?.nanoseconds === "number"));

  const toDate = (v) => {
    try {
      if (typeof v?.toDate === "function") return v.toDate();
      if (typeof v?.seconds === "number") return new Date(v.seconds * 1000);
      if (v instanceof Date) return v;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const displayValue = (v) => {
    if (v == null) return "";
    if (isTimestamp(v)) {
      const d = toDate(v);
      return d ? d.toLocaleString("vi-VN") : "";
    }
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const normalizeOptions = (opts) => {
    if (!opts) return null;
    return opts.map((o) =>
      typeof o === "string" ? { value: o, label: o } : { value: String(o.value), label: o.label ?? o.value }
    );
  };

  const optionsForKey = (key, colOpts) =>
    normalizeOptions(Array.isArray(colOpts) ? colOpts : selectOptions[key]);

  const getLabelFromOpts = (value, opts) => {
    const val = String(value ?? "");
    const found = (opts || []).find((o) => String(o.value) === val);
    return found ? found.label : val;
  };

  /* ========== Validate (Yup) ========== */
  const setFieldError = (key, message) =>
    setErrors((prev) => ({ ...prev, [key]: message || "" }));

  const clearFieldError = (key) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validateField = useCallback(
    async (key, data) => {
      if (!validationSchema || !validationSchema.validateAt) return;
      try {
        await validationSchema.validateAt(key, data);
        clearFieldError(key);
      } catch (err) {
        setFieldError(key, err?.message || "Giá trị không hợp lệ");
      }
    },
    [validationSchema]
  );

  const validateAll = useCallback(async () => {
    if (!validationSchema) return { ok: true };
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return { ok: true };
    } catch (err) {
      if (err?.name === "ValidationError") {
        const map = {};
        for (const e of err.inner || []) if (e.path && !map[e.path]) map[e.path] = e.message;
        setErrors(map);
      }
      return { ok: false };
    }
  }, [validationSchema, formData]);

  /* ========== Handlers ========== */
  const handleInputChange = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (validateOnChange) validateField(key, next);
      return next;
    });
  };

  const handleBlur = (key) => () => validateField(key, formData);

  const handleSave = async () => {
    const { ok } = await validateAll();
    if (!ok) return;
    onSave(formData); // parent tự đóng khi xong
  };

  const handleAvatarClick = () => {
    if (isEditMode) fileInputRef.current?.click();
  };
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormData((p) => ({ ...p, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  /* ========== UI ========== */
  return (
    <div className="user-detail-modal-overlay">
      <div className="user-detail-modal">
        <div className="user-detail-modal-header">
          <h2>Thông tin chi tiết</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-detail-modal-content">
          {showAvatar && (
            <div className="user-avatar-section">
              <div className="user-avatar">
                <div className="avatar-placeholder" onClick={handleAvatarClick}>
                  {formData.image ? (
                    <img src={formData.image} alt="Avatar" className="avatar-image" />
                  ) : (
                    <div className="avatar-icon">👤</div>
                  )}
                </div>
                {isEditMode && <div className="avatar-edit-icon">+</div>}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>
          )}

          <div className="user-info-section">
            {Colums.map((col, idx) => {
              const key = col.key;
              const readOnly = readOnlyKeys.includes(key);
              const val = formData[key];
              const errMsg = errors[key];
              const opts = optionsForKey(key, col.options);

              // --- Dropdown ---
              if (opts) {
                if (!isEditMode || readOnly) {
                  return (
                    <div className="info-row" key={idx}>
                      <label>{col.name}</label>
                      <span>{getLabelFromOpts(val, opts)}</span>
                    </div>
                  );
                }
                return (
                  <div className="info-row" key={idx}>
                    <label>{col.name}</label>
                    <select
                      value={val ?? ""}
                      onChange={handleInputChange(key)}
                      onBlur={handleBlur(key)}
                      className={`edit-input ${errMsg ? "error" : ""}`}
                    >
                      {opts.map((o) => (
                        <option key={String(o.value)} value={String(o.value)}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {errMsg && <div className="field-error">{errMsg}</div>}
                  </div>
                );
              }

              // --- Password (nếu cột đặt type=password) ---
              if (col.type === "password") {
                if (!isEditMode || readOnly) {
                  return (
                    <div className="info-row" key={idx}>
                      <label>{col.name}</label>
                      <span>••••••</span>
                    </div>
                  );
                }
                return (
                  <div className="info-row" key={idx}>
                    <label>{col.name}</label>
                    <input
                      type="password"
                      value={String(val ?? "")}
                      onChange={handleInputChange(key)}
                      onBlur={handleBlur(key)}
                      className={`edit-input ${errMsg ? "error" : ""}`}
                    />
                    {errMsg && <div className="field-error">{errMsg}</div>}
                  </div>
                );
              }

              // --- Text: readOnly vs Editable ---
              if (!isEditMode || readOnly) {
                return (
                  <div className="info-row" key={idx}>
                    <label>{col.name}</label>
                    <span>{displayValue(val)}</span>
                  </div>
                );
              }

              return (
                <div className="info-row" key={idx}>
                  <label>{col.name}</label>
                  <input
                    type="text"
                    value={String(val ?? "")}
                    onChange={handleInputChange(key)}
                    onBlur={handleBlur(key)}
                    className={`edit-input ${errMsg ? "error" : ""}`}
                  />
                  {errMsg && <div className="field-error">{errMsg}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="user-detail-modal-actions">
          <button className="btn-cancel" onClick={onClose}>Đóng</button>
          {isEditMode ? (
            <button className="btn-save" onClick={handleSave}>Lưu</button>
          ) : (
            <button className="btn-edit" onClick={() => onSave(formData, true)}>Chỉnh sửa</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Edit;
