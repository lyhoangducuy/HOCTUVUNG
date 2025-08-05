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
} from "@fortawesome/free-solid-svg-icons";
import "./TracNghiem.css";

function TracNghiem() {
  const { id } = useParams();
  const nagative = useNavigate();
  const [cards, setCards] = useState([]);
  const [danhsachthe, setDanhsachthe] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState();
  const [options, setOptions] = useState([]);
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [choice, setChoice] = useState(false);

  const getrandomQuetion = () => {
    const index = Math.floor(Math.random() * danhsachthe.length);
    return danhsachthe[index];
  };

  const getwrongAnswer = (answer) => {
    const wrong = danhsachthe.filter((item) => item.nghia !== answer.nghia);
    //xao tron dap an sai
    const arr = [...wrong];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr.slice(0, 3);
  };
  const generateQuestion = () => {
    const question = getrandomQuetion();
    const wrongs = getwrongAnswer(question);
    const allOptions = [...wrongs.map((w) => w.nghia), question.nghia];
    const shuffled = allOptions.sort(() => 0.5 - Math.random());
    setCurrentQuestion(question);
    setOptions(shuffled);
  };
  const nextQuestion = () => {
    if (step < danhsachthe.length - 1) {
      setStep((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };
  const handleAnswer = (item) => {
    setChoice(true);
    setTimeout(() => {
      setChoice(false);
    }, 1500);
    if (item === currentQuestion?.nghia) {
      setCorrect(true);

      if (step < danhsachthe.length - 1) {
        setStep((prev) => prev + 1);
      }
    } else {
      setCorrect(false);

        if (step < danhsachthe.length - 1) {
            setTimeout(
                () => {
                     setStep((prev) => prev + 1);
              }
          ,1000)
       
      }
    }
  };
  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selected"));
    if (selected) {
      setCards(selected);
      setDanhsachthe(selected.danhSachThe);
    }
  }, []);
  useEffect(() => {
    if (danhsachthe.length > 0 && step < danhsachthe.length && step >= 0) {
      generateQuestion();
    }
  }, [danhsachthe, step]);
  return (
    <div className="container">
      <div className="back" onClick={() => nagative("/giangvien")}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        {"Quay lại"}
      </div>

      <div className="studyChange">
        <div className="studyBtn " onClick={() => nagative(`/flashcard/${id}`)}>
          <FontAwesomeIcon icon={faClone} />
          <span>Flashcards</span>
        </div>
        <div className="studyBtn active ">
          <FontAwesomeIcon icon={faListCheck} />
          <span>Trắc nghiệm</span>
        </div>
        <div className="studyBtn" onClick={() => nagative(`/test/${id}`)}>
          <FontAwesomeIcon icon={faFilePen} />
          <span>Test</span>
        </div>
        <div className="studyBtn" onClick={() => nagative(`/game/${id}`)}>
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>Match game</span>
        </div>
        <div className="studyBtn" onClick={() => nagative(`/video/${id}`)}>
          <FontAwesomeIcon icon={faPlay} />
          <span>Học bằng video</span>
        </div>
      </div>

      <div className="main">
        <div className="header">{cards.tenBoThe}</div>

        <div className="study">
          <div className="questionGroup">
            {
              <div className="question">
                {currentQuestion?.tu}
                <br />
                <p className="tittle">Chọn đáp án đúng</p>
              </div>
            }
            {
              <div className="answer">
                {options.map((item, index) => (
                  <div
                    className="answer-item"
                    key={index}
                    onClick={() => handleAnswer(item)}
                  >
                    {true && item}
                  </div>
                ))}
              </div>
            }
          </div>
          {choice && (correct ? <p>ĐÚNG</p> : <p>SAI</p>)}

          <div className="btn-group">
            <div className="left" onClick={() => prevQuestion()}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </div>
            <span>
              {step + 1}/{danhsachthe.length}
            </span>
            <div className="right" onClick={() => nextQuestion()}>
              <FontAwesomeIcon icon={faArrowRight} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TracNghiem;
