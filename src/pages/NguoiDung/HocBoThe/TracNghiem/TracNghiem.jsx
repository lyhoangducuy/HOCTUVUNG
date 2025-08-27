import React, { useState, useEffect, useRef } from "react";
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
import "./TracNghiem.css";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";

import { db } from "../../../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

/* Trộn mảng đơn giản */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function TracNghiem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pack, setPack] = useState(null);
  const [danhsachthe, setDanhsachthe] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState();
  const [options, setOptions] = useState([]);
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [choice, setChoice] = useState(false);
  const [indexQuestion, setIndexQuestion] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy bộ thẻ từ Firestore theo id URL
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPack(null);
    setDanhsachthe([]);
    setIndexQuestion([]);
    setStep(0);
    setOptions([]);
    setCurrentQuestion(undefined);

    const ref = doc(db, "boThe", String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setPack(null);
          setDanhsachthe([]);
        } else {
          const data = snap.data();
          setPack(data);
          setDanhsachthe(Array.isArray(data?.danhSachThe) ? data.danhSachThe : []);
        }
        setLoading(false);
      },
      () => {
        setPack(null);
        setDanhsachthe([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  // Lấy ngẫu nhiên 1 câu chưa dùng
  const getRandomQuestion = () => {
    if (!danhsachthe.length) return null;
    if (indexQuestion.length === danhsachthe.length) return null;

    const index = Math.floor(Math.random() * danhsachthe.length);
    if (!indexQuestion.includes(index)) {
      setIndexQuestion((prev) => [...prev, index]);
      return danhsachthe[index];
    }
    return getRandomQuestion(); // thử lại
  };

  // Lấy 3 đáp án sai
  const getWrongAnswers = (answer) => {
    const wrong = danhsachthe
      .map((item) => item.nghia)
      .filter((nghia) => String(nghia).toLowerCase() !== String(answer.nghia).toLowerCase());

    const uniqueWrong = [...new Set(wrong)];
    return shuffle(uniqueWrong).slice(0, 3);
  };

  // Tạo câu hỏi + đáp án
  const generateQuestion = () => {
    const question = getRandomQuestion();
    if (!question) return;
    const wrongs = getWrongAnswers(question);
    const shuffled = shuffle([...wrongs, question.nghia]);
    setCurrentQuestion(question);
    setOptions(shuffled);
  };

  // Mỗi lần bước/nguồn dữ liệu đổi -> tạo câu hỏi
  useEffect(() => {
    if (danhsachthe.length && step < danhsachthe.length && step >= 0) {
      generateQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [danhsachthe, step]);

  const handleAnswer = (item) => {
    if (!currentQuestion) return;
    setChoice(true);
    const isCorrect = item === currentQuestion.nghia;
    setCorrect(isCorrect);
    setTimeout(() => setChoice(false), 1500);

    setStep((prev) => (prev < danhsachthe.length - 1 ? prev + 1 : prev));
  };

  const total = danhsachthe.length;
  const progress = Math.min(step + 1, total);

  return (
    <div className="container">
      <HocBoThe_Header activeMode="tracnghiem" />
      <div className="main">
        <div className="header">{pack?.tenBoThe || "Trắc nghiệm"}</div>

        <div className="study">
          {loading ? (
            <p>Đang tải...</p>
          ) : !total ? (
            <p>Không có dữ liệu để chơi.</p>
          ) : (
            <>
              <div className="questionGroup">
                <div className="question">
                  {currentQuestion?.tu}
                  <br />
                  <p className="tittle">Chọn đáp án đúng</p>
                </div>

                <div className="answer">
                  {options.map((item, index) => (
                    <div
                      className="answer-item"
                      key={index}
                      onClick={() => handleAnswer(item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {choice && (
                correct ? (
                  <p>ĐÚNG</p>
                ) : (
                  <p>
                    SAI. Đáp án đúng là <strong>{currentQuestion?.nghia}</strong>
                  </p>
                )
              )}

              <div className="progress">{`${progress}/${total}`}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TracNghiem;
