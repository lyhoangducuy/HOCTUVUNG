import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";
import TextInput from "../../../../components/inputs/TextInput";
import "./Test.css";

import { db } from "../../../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeAnswer(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bỏ dấu tiếng Việt
    .replace(/[^\p{L}\p{N}\s]/gu, "")  // bỏ ký tự thừa
    .replace(/\s+/g, " ")
    .trim();
}

export default function Test() {
  const { id } = useParams();

  const [pack, setPack] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [seed, setSeed] = useState(0); // để “làm lại” trộn mới
  const [loading, setLoading] = useState(true);

  // Lấy bộ thẻ từ Firestore theo id URL (collection: boThe)
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPack(null);

    const ref = doc(db, "boThe", String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setPack(data);
        setLoading(false);
      },
      () => {
        setPack(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  // Tạo danh sách câu hỏi từ pack (đảo thứ tự nếu pack.shuffle === true)
  useEffect(() => {
    if (!pack?.danhSachThe?.length) {
      setQuestions([]);
      setAnswers([]);
      setResult(null);
      setStatuses([]);
      return;
    }

    const base = pack.danhSachThe.slice();
    const source = pack.shuffle ? shuffle(base) : base;

    const qs = source.map((it) => ({
      tu: it.tu,
      nghia: it.nghia,
      isReversed: Math.random() < 0.5,
    }));

    setQuestions(qs);
    setAnswers(Array(qs.length).fill(""));
    setResult(null);
    setStatuses([]);
  }, [pack, seed]);

  const allAnswered = useMemo(
    () => answers.length && answers.every((a) => a.trim() !== ""),
    [answers]
  );

  const handleChangeAnswer = (idx, val) => {
    setAnswers((prev) => {
      const next = prev.slice();
      next[idx] = val;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!questions.length) return;

    let correct = 0;
    const st = questions.map((q, i) => {
      const user = normalizeAnswer(answers[i]);
      const correctRaw = q.isReversed ? q.tu : q.nghia;
      const target = normalizeAnswer(correctRaw);

      const ok = user === target;
      if (ok) correct += 1;

      return ok
        ? { isCorrect: true }
        : { isCorrect: false, correctAnswer: correctRaw };
    });

    setResult(correct);
    setStatuses(st);
  };

  const handleRetry = () => {
    setSeed((s) => s + 1); // reset + trộn lại
  };

  return (
    <div className="container">
      <HocBoThe_Header activeMode="test" />

      <div className="main">
        <h2 className="title">Bộ thẻ: {pack?.tenBoThe || "—"}</h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : !pack ? (
          <p>Không tìm thấy bộ thẻ.</p>
        ) : (
          <>
            <div className="question-list">
              {questions.map((q, idx) => (
                <div key={idx} className="question-item">
                  <p className="question-text">
                    Câu {idx + 1}: Nhập đáp án cho:{" "}
                    <strong>{q.isReversed ? q.nghia : q.tu}</strong>
                  </p>

                  <TextInput
                    type="text"
                    value={answers[idx]}
                    onChange={(e) => handleChangeAnswer(idx, e.target.value)}
                    disabled={result !== null}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && result === null) {
                        const next = e.currentTarget
                          .closest(".question-item")
                          ?.nextElementSibling?.querySelector("input");
                        next?.focus();
                      }
                    }}
                  />

                  {result !== null && (
                    <p className="feedback">
                      {statuses[idx]?.isCorrect ? (
                        <span className="correct">✔️ Đúng</span>
                      ) : (
                        <span className="incorrect">
                          Sai. Đáp án đúng là:{" "}
                          <strong>{statuses[idx].correctAnswer}</strong>
                        </span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="actions">
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={result !== null || !allAnswered}
                title={!allAnswered ? "Hãy trả lời hết các câu" : ""}
              >
                Nộp bài
              </button>

              <button
                className="retry-btn"
                onClick={handleRetry}
                disabled={!questions.length}
              >
                Làm lại
              </button>
            </div>

            {result !== null && (
              <p className="result">
                Bạn trả lời đúng {result}/{questions.length} câu.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
