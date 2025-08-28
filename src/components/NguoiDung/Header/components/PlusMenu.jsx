import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faClone, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import "../header.css";

export default function PlusMenu({ role, navigate }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const outside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div className="plus-container" ref={ref}>
      <FontAwesomeIcon
        icon={faCirclePlus}
        className="icon plus-icon"
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="plus">
          <div
            className="plus-item"
            onClick={() => {
              navigate("/newBoThe");
              setOpen(false);
            }}
          >
            <FontAwesomeIcon icon={faClone} />
            <span>Bộ thẻ mới</span>
          </div>

          {(role === "GIANG_VIEN" || role === "ADMIN") && (
            <div
              className="plus-item"
              onClick={() => {
                navigate("/newKhoaHoc");
                setOpen(false);
              }}
            >
              <FontAwesomeIcon icon={faBookOpen} />
              <span>Khóa học mới</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
