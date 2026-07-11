"use client";

import { useEffect, useMemo, useState } from "react";

type Game = number[];
type Tab = "recommend" | "manual" | "check" | "feedback";

const COLORS = ["#f0bd30", "#2d91d2", "#ec5e55", "#6f7680", "#35a65a"];

function ballColor(number: number) {
  return COLORS[Math.min(4, Math.floor((number - 1) / 10))];
}

function LottoBall({ number, selected = false }: { number: number; selected?: boolean }) {
  return (
    <span
      className={`lotto-ball ${selected ? "selected" : ""}`}
      style={{ backgroundColor: ballColor(number) }}
    >
      {number}
    </span>
  );
}

function generateGame(): Game {
  for (;;) {
    const game = Array.from({ length: 45 }, (_, index) => index + 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
      .sort((a, b) => a - b);
    const odds = game.filter((number) => number % 2).length;
    const sum = game.reduce((total, number) => total + number, 0);
    if (odds >= 2 && odds <= 4 && sum >= 90 && sum <= 180) return game;
  }
}

function parseNumbers(text: string): number[] {
  return text
    .replaceAll(",", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);
}

function prize(matches: number, bonus: boolean) {
  if (matches === 6) return "1등";
  if (matches === 5 && bonus) return "2등";
  if (matches === 5) return "3등";
  if (matches === 4) return "4등";
  if (matches === 3) return "5등";
  return "낙첨";
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("recommend");
  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [manualGames, setManualGames] = useState<Game[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [winningText, setWinningText] = useState("12 15 19 22 24 36");
  const [bonusText, setBonusText] = useState("3");
  const [drawNo, setDrawNo] = useState("1232");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lottomind-manual-games");
    if (saved) setManualGames(JSON.parse(saved));
    navigator.serviceWorker?.register("/LottoMind-Mobile/sw.js");
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("lottomind-manual-games", JSON.stringify(manualGames));
  }, [manualGames]);

  const analysis = useMemo(() => {
    const winning = parseNumbers(winningText);
    const bonus = Number(bonusText);
    if (winning.length !== 6 || new Set(winning).size !== 6) return [];
    return [
      ...recommendations.map((game, index) => ({ label: `AI ${index + 1}`, game })),
      ...manualGames.map((game, index) => ({ label: `수동 ${index + 1}`, game })),
    ].map(({ label, game }) => {
      const matched = game.filter((number) => winning.includes(number));
      const bonusMatched = game.includes(bonus);
      return { label, game, matched, rank: prize(matched.length, bonusMatched) };
    });
  }, [winningText, bonusText, recommendations, manualGames]);

  function createRecommendations() {
    const games: Game[] = [];
    while (games.length < 5) {
      const game = generateGame();
      if (!games.some((saved) => saved.join() === game.join())) games.push(game);
    }
    setRecommendations(games);
    setMessage("AI 균형 조건으로 추천번호 5게임을 만들었습니다.");
  }

  function toggleNumber(number: number) {
    setMessage("");
    setSelected((current) =>
      current.includes(number)
        ? current.filter((value) => value !== number)
        : current.length < 6
          ? [...current, number].sort((a, b) => a - b)
          : current,
    );
  }

  function saveManualGame() {
    if (selected.length !== 6) {
      setMessage("번호를 정확히 6개 선택해 주세요.");
      return;
    }
    if (manualGames.some((game) => game.join() === selected.join())) {
      setMessage("이미 저장된 번호입니다.");
      return;
    }
    setManualGames((games) => [...games, selected]);
    setSelected([]);
    setMessage("수동번호를 휴대폰에 저장했습니다.");
  }

  async function installApp() {
    if (installPrompt && "prompt" in installPrompt) {
      await (installPrompt as Event & { prompt: () => Promise<void> }).prompt();
    } else {
      setMessage("아이폰: 공유 버튼 → 홈 화면에 추가 / 안드로이드: 브라우저 메뉴 → 앱 설치");
    }
  }

  async function shareApp() {
    if (navigator.share) {
      await navigator.share({ title: "LottoMind AI PRO", text: "모바일 체험판을 확인해 보세요.", url: location.href });
    } else {
      await navigator.clipboard.writeText(location.href);
      setMessage("주소를 복사했습니다.");
    }
  }

  function saveFeedback() {
    if (!feedback.trim()) return;
    const items = JSON.parse(localStorage.getItem("lottomind-feedback") || "[]");
    items.push({ text: feedback.trim(), date: new Date().toISOString() });
    localStorage.setItem("lottomind-feedback", JSON.stringify(items));
    setFeedback("");
    setMessage("의견을 저장했습니다. 개발자에게 화면을 보여주세요.");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">🍀</div>
        <div><strong>LottoMind</strong><span>AI PRO · Mobile Preview</span></div>
        <button className="icon-button" onClick={shareApp} aria-label="공유">↗</button>
      </header>

      <section className="hero">
        <span className="preview-badge">무료 체험판</span>
        <h1>이번 주 행운을<br />한눈에 확인하세요</h1>
        <p>AI 추천과 내 수동번호를 저장하고 추첨 결과와 바로 비교합니다.</p>
        <button className="install-button" onClick={installApp}>휴대폰에 앱 설치</button>
      </section>

      {message && <div className="toast" onClick={() => setMessage("")}>{message}</div>}

      <section className="content">
        {tab === "recommend" && (
          <>
            <div className="section-title"><div><small>AI PICK</small><h2>추천번호</h2></div><button onClick={createRecommendations}>새로 생성</button></div>
            {!recommendations.length ? (
              <button className="empty-card" onClick={createRecommendations}><b>✨ AI 추천 시작</b><span>균형 조건을 적용한 5게임을 생성합니다.</span></button>
            ) : recommendations.map((game, index) => (
              <article className="game-card" key={game.join()}>
                <div className="game-head"><b>AI {index + 1}게임</b><span>균형 추천</span></div>
                <div className="ball-row">{game.map((number) => <LottoBall key={number} number={number} />)}</div>
              </article>
            ))}
          </>
        )}

        {tab === "manual" && (
          <>
            <div className="section-title"><div><small>MY PICK</small><h2>수동번호 선택</h2></div><b>{selected.length}/6</b></div>
            <div className="number-grid">
              {Array.from({ length: 45 }, (_, index) => index + 1).map((number) => (
                <button key={number} className={selected.includes(number) ? "picked" : ""} onClick={() => toggleNumber(number)}>{number}</button>
              ))}
            </div>
            <button className="primary wide" onClick={saveManualGame}>선택번호 저장</button>
            <h3 className="saved-title">저장된 번호 · {manualGames.length}게임</h3>
            {manualGames.map((game, index) => (
              <article className="game-card compact" key={game.join()}>
                <div className="game-head"><b>수동 {index + 1}게임</b><button onClick={() => setManualGames((games) => games.filter((_, i) => i !== index))}>삭제</button></div>
                <div className="ball-row">{game.map((number) => <LottoBall key={number} number={number} />)}</div>
              </article>
            ))}
          </>
        )}

        {tab === "check" && (
          <>
            <div className="section-title"><div><small>RESULT</small><h2>당첨결과 비교</h2></div></div>
            <div className="form-card">
              <label>회차<input inputMode="numeric" value={drawNo} onChange={(e) => setDrawNo(e.target.value)} /></label>
              <label>당첨번호 6개<input value={winningText} onChange={(e) => setWinningText(e.target.value)} placeholder="예: 12 15 19 22 24 36" /></label>
              <label>보너스번호<input inputMode="numeric" value={bonusText} onChange={(e) => setBonusText(e.target.value)} /></label>
            </div>
            <p className="result-count">{drawNo || "-"}회 · 비교 대상 {analysis.length}게임</p>
            {analysis.length ? analysis.map((item) => (
              <article className="result-card" key={item.label}>
                <div className="game-head"><b>{item.label}</b><strong className={item.rank === "낙첨" ? "lose" : "win"}>{item.rank}</strong></div>
                <div className="ball-row">{item.game.map((number) => <LottoBall key={number} number={number} selected={item.matched.includes(number)} />)}</div>
                <small>일치번호 {item.matched.length ? item.matched.join(", ") : "없음"}</small>
              </article>
            )) : <div className="empty-note">추천번호를 생성하거나 수동번호를 저장해 주세요.</div>}
          </>
        )}

        {tab === "feedback" && (
          <>
            <div className="section-title"><div><small>FEEDBACK</small><h2>체험 의견 남기기</h2></div></div>
            <div className="feedback-card">
              <p>사용하면서 불편했던 점이나 추가했으면 하는 기능을 자유롭게 적어주세요.</p>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="예: 추천번호를 카카오톡으로 보내고 싶어요." />
              <button className="primary wide" onClick={saveFeedback}>의견 저장</button>
            </div>
            <div className="plan-card"><span>COMING SOON</span><h3>LottoMind PRO</h3><b>월 10,000원</b><p>회원 로그인 · 데이터 동기화 · 자동 업데이트 · 추천 성능 리포트</p></div>
            <p className="disclaimer">본 서비스는 번호 분석 도구이며 당첨을 보장하지 않습니다. 건전한 범위에서 이용해 주세요.</p>
          </>
        )}
      </section>

      <nav className="bottom-nav">
        <button className={tab === "recommend" ? "active" : ""} onClick={() => setTab("recommend")}><span>✨</span>AI 추천</button>
        <button className={tab === "manual" ? "active" : ""} onClick={() => setTab("manual")}><span>✋</span>수동번호</button>
        <button className={tab === "check" ? "active" : ""} onClick={() => setTab("check")}><span>🏆</span>결과확인</button>
        <button className={tab === "feedback" ? "active" : ""} onClick={() => setTab("feedback")}><span>💬</span>의견</button>
      </nav>
    </main>
  );
}
