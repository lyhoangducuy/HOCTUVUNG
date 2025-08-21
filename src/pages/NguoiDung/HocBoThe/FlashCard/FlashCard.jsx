import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./FlashCard.css";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";

export default function FlashCard() {
  const { id } = useParams();
  const [pack, setPack] = useState(null); // bộ thẻ đã chọn
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("boThe") || "[]");
      const selected = Array.isArray(list)
        ? list.find((x) => String(x.idBoThe) === String(id))
        : null;

      setPack(selected || null);
      setCurrentCardIndex(0);
      setFlip(false);
    } catch {
      setPack(null);
    }
  }, [id]);

  const cards = pack?.danhSachThe || [];
  const currentCard = cards[currentCardIndex];

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((i) => i + 1);
      setFlip(false);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((i) => i - 1);
      setFlip(false);
    }
  };

  return (
    <div className="container">
      <HocBoThe_Header activeMode="flashcard" />

      <div className="main">
        <div className="header">
          <h2 className="nameCard">{pack?.tenBoThe || "Bộ thẻ"}</h2>
        </div>

        <div className="study">
          {currentCard ? (
            <div
              className={`card ${flip ? "flipped" : ""}`}
              onClick={() => setFlip(!flip)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <h3 className="word">{currentCard.tu}</h3>
                </div>
                <div className="card-back">
                  <h3 className="word">{currentCard.nghia}</h3>
                </div>
              </div>
            </div>
          ) : (
            <p>Không có thẻ nào trong bộ này.</p>
          )}

          <div className="btn-group">
            <button
              className="left"
              onClick={handlePrev}
              disabled={currentCardIndex === 0}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <span>
              {cards.length ? currentCardIndex + 1 : 0}/{cards.length}
            </span>
            <button
              className="right"
              onClick={handleNext}
              disabled={currentCardIndex >= cards.length - 1}
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
