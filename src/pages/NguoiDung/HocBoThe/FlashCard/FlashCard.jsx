import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./FlashCard.css";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";

import { db } from "../../../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function FlashCard() {
  const { id } = useParams();
  const [pack, setPack] = useState(null); // bộ thẻ đã chọn
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flip, setFlip] = useState(false);
  const [loading, setLoading] = useState(true);

  // Nạp bộ thẻ từ Firestore: collection "boThe", docId = id
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setPack(null);
    setCurrentCardIndex(0);
    setFlip(false);

    const ref = doc(db, "boThe", String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setPack(snap.data());
        else setPack(null);
        setCurrentCardIndex(0);
        setFlip(false);
        setLoading(false);
      },
      () => {
        setPack(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  const cards = Array.isArray(pack?.danhSachThe) ? pack.danhSachThe : [];
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
          {loading ? (
            <p>Đang tải...</p>
          ) : !pack ? (
            <p>Không tìm thấy bộ thẻ.</p>
          ) : currentCard ? (
            <div
              className={`card ${flip ? "flipped" : ""}`}
              onClick={() => setFlip(!flip)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <h3 className="word">{currentCard.tu}</h3>
                  <div className="acction">Hãy bấm để lật</div>
                </div>
                <div className="card-back">
                  <h3 className="word">{currentCard.nghia}</h3>
                  <div className="acction">Hãy bấm để lật</div>
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
              disabled={currentCardIndex === 0 || loading || !pack}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <span>
              {cards.length ? currentCardIndex + 1 : 0}/{cards.length}
            </span>
            <button
              className="right"
              onClick={handleNext}
              disabled={currentCardIndex >= cards.length - 1 || loading || !pack}
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
