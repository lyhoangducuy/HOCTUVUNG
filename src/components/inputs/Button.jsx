// src/components/Button.jsx
import React from "react";
import "./Button.css";

export default function Button({ children, onClick, variant = "register", disabled = false }) {
  return (
    <button
      className={`btn ${variant === "register" ? "btn-register" : "btn-cancel"}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
