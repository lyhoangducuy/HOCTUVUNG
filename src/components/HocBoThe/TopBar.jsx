import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEllipsisH } from "@fortawesome/free-solid-svg-icons";

export default function TopBar({
  onBack,
  isOwner,
  openMenu,
  onToggleMenu,
  menuBtnRef,
  menuRef,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className="bt-top-row"
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
    >
      <div className="back" onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        Quay lại
      </div>

      {isOwner && (
        <div className="more-wrapper" style={{ position: "relative" }}>
          <button
            ref={menuBtnRef}
            className="more-btn"
            onClick={onToggleMenu}
            aria-haspopup="menu"
            aria-expanded={openMenu}
            title="Tùy chọn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--line,#e5e7eb)",
              background: "white",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon icon={faEllipsisH} />
          </button>

          {openMenu && (
            <div
              ref={menuRef}
              className="more-menu"
              style={{
                position: "absolute",
                top: 44,
                right: 0,
                background: "white",
                border: "1px solid var(--line,#e5e7eb)",
                borderRadius: 10,
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                minWidth: 160,
                zIndex: 20,
                overflow: "hidden",
              }}
            >
              <button
                className="more-item"
                onClick={onEdit}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Sửa bộ thẻ
              </button>
              <button
                className="more-item danger"
                onClick={onDelete}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "white",
                  border: "none",
                  color: "#dc2626",
                  cursor: "pointer",
                }}
              >
                Xoá bộ thẻ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
