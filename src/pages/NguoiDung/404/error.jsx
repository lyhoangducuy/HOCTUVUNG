import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./error.css";

export default function Error404({
  code = 404,
  message = "Trang không tồn tại",
  hint = "Có thể liên kết đã hết hạn hoặc bạn gõ nhầm.",
  showHome = false, // bạn có thể bật nếu muốn
}) {
  const nav = useNavigate();
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const STAR_NUM = Math.min(180, Math.floor((W * H) / 9000));
    const stars = new Array(STAR_NUM).fill(0).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 1 + 0.3,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random() * 0.6 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/1.2);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(0,0,0,0.15)");
      ctx.fillStyle = g;
      ctx.fillRect(0,0,W,H);

      for (const s of stars) {
        s.x += s.z;
        s.y -= s.z * 0.25;
        if (s.x > W + 2 || s.y < -2) { s.x = -2; s.y = Math.random() * H; }
        ctx.globalAlpha = s.a;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="evp-wrap">
      <canvas ref={canvasRef} className="evp-canvas" />

      <div className="evp-scene" aria-live="polite">
        <div className="evp-orb" aria-hidden="true" />

        <div className="evp-cube" aria-hidden="true">
          <span className="f" /><span className="b" /><span className="l" />
          <span className="r" /><span className="t" /><span className="bt" />
        </div>

        <div className="evp-card">
          <div className="evp-code" data-glitch={String(code)}>{String(code)}</div>
          <div className="evp-title">{message}</div>
          <p className="evp-hint">{hint}</p>
          <div className="evp-cta">
            {showHome && (
              <button className="evp-btn" onClick={() => nav("/")}>Về trang chủ</button>
            )}
            {/* Nút “Quay lại” có class riêng để đổi font */}
            <button className="evp-btn evp-btn--ghost evp-btn--back" onClick={() => nav(-1)}>
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
