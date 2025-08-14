import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClone,
  faListCheck,
  faLayerGroup,
  faFilePen,
  faPlay,
  faArrowLeft,
  faArrowRight,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import "./FlashCard.css";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";

function FlashCard() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flip, setFlip] = useState(false);
  const nagative = useNavigate();
  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selected"));
    if (selected) {
      setCards([selected]);
    }
  }, []);

  const currentCard = cards[0]?.danhSachThe?.[currentCardIndex];

  const handleNext = () => {
    if (currentCardIndex < cards[0]?.danhSachThe?.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setFlip(false);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
      setFlip(false);
    }
  };
  const handleLib = () => {
    
  }
  return (
    <div className="container">
       <HocBoThe_Header activeMode={"flashcard"}/>

      <div className="main">
        <div className="header">
          <h2 className="nameCard">{cards[0]?.tenBoThe}</h2>
        </div>

        <div className="study">
          {currentCard && (
            <div className="card" onClick={() => setFlip(!flip)}>
              <h3 className="word">
                {flip ? currentCard.nghia : currentCard.tu}
              </h3>
            </div>
          )}

          <div className="btn-group">
            <div className="left" onClick={handlePrev}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </div>
            <span>
              {currentCardIndex + 1}/{cards[0]?.danhSachThe?.length}
            </span>
            <div className="right" onClick={handleNext}>
              <FontAwesomeIcon icon={faArrowRight} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;
