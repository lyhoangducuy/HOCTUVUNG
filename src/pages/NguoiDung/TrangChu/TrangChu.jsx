import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./TrangChu.css";

export default function TrangChu() {
  const boThe = [];
  const navigate = useNavigate();

  const [cards, setCards] = useState(boThe);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("boThe")) || [];
    if (!saved || saved.length === 0) {
      localStorage.setItem("boThe", JSON.stringify(boThe)); 
      setCards(boThe);
    } else {
      setCards(saved);
    }
  }, []);

  const handleStudy = (id) => {
    navigate(`/flashcard/${id}`);
  };
  return (
    <div className="container">
      <div className="section section-word">
        <h2 className="title">Gần Đây</h2>
        <div className="wordgroup">
          <ul>
            {cards.map((item, index) => (
              <li
                key={index}
                onClick={() => handleStudy(item.idBoThe)}
                className="word-item"
              >
                {" "}
                <FontAwesomeIcon icon={faBook} className="icon icon-book" />
                Từ vưng buổi {index + 1}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="section section-card">
        <h2 className="title">Bộ thẻ phổ biến</h2>
        <div className="card-group">
          {cards.map((item, index) => (
            <div
              key={index}
              className="card-item"
              onClick={() => handleStudy(item.idBoThe)}
            >
              <h3 className="nameCard">{item.tenBoThe}</h3>
              <h4 className="numberWord">{item.soTu}</h4>
              <div className="infor">
                <img src={item.nguoiDung.anhDaiDien || null} alt="info" />
                <span className="nameUser">{item.nguoiDung.tenNguoiDung}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
