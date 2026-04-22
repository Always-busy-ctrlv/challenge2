"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const STAGE_MAP: Record<string, { title: string; icon: string; color: string }> = {
  "voter-registration": { title: "Voter Registration", icon: "📋", color: "#3b82f6" },
  "primary-elections": { title: "Primary Elections", icon: "🗳️", color: "#8b5cf6" },
  "candidate-nomination": { title: "Candidate Nomination", icon: "🎤", color: "#06b6d4" },
  "campaign-period": { title: "Campaign Period", icon: "📢", color: "#f59e0b" },
  "election-day": { title: "Election Day", icon: "🏛️", color: "#10b981" },
  "results-certification": { title: "Results & Certification", icon: "✅", color: "#ef4444" },
};

const ALL_QUESTIONS = [
  { id:"vr-1", stageId:"voter-registration", type:"mcq" as const, difficulty:"easy" as const, question:"At what age can you register to vote in a U.S. federal election?", options:["16","17","18","21"], correctIndex:2, explanation:"You must be 18 by Election Day." },
  { id:"vr-2", stageId:"voter-registration", type:"true-false" as const, difficulty:"easy" as const, question:"North Dakota is the only state that does not require voter registration.", options:["True","False"], correctIndex:0, explanation:"Correct — ND has no voter registration requirement." },
  { id:"vr-3", stageId:"voter-registration", type:"mcq" as const, difficulty:"medium" as const, question:"What law requires voter registration at DMVs?", options:["Voting Rights Act 1965","NVRA 1993","HAVA 2002","For the People Act"], correctIndex:1, explanation:"The NVRA (Motor Voter Act) of 1993." },
  { id:"vr-4", stageId:"voter-registration", type:"mcq" as const, difficulty:"medium" as const, question:"How many states plus D.C. offer same-day registration?", options:["10","15","22","30"], correctIndex:2, explanation:"22 states plus D.C. as of 2024." },
  { id:"vr-5", stageId:"voter-registration", type:"mcq" as const, difficulty:"hard" as const, question:"Official federal voter registration website?", options:["register.gov","vote.gov","usa.gov/vote","elections.gov"], correctIndex:1, explanation:"Vote.gov is the official resource." },
  { id:"pe-1", stageId:"primary-elections", type:"mcq" as const, difficulty:"easy" as const, question:"Purpose of a primary election?", options:["Elect President","Choose party candidates","Amend Constitution","Select justices"], correctIndex:1, explanation:"Primaries choose each party's candidates." },
  { id:"pe-2", stageId:"primary-elections", type:"mcq" as const, difficulty:"medium" as const, question:"Who votes in closed primaries?", options:["Anyone","Registered party members","Independents only","All residents"], correctIndex:1, explanation:"Only registered party members." },
  { id:"pe-3", stageId:"primary-elections", type:"true-false" as const, difficulty:"easy" as const, question:"Super Tuesday has the most simultaneous state primaries.", options:["True","False"], correctIndex:0, explanation:"Correct — the largest number of states on one day." },
  { id:"pe-4", stageId:"primary-elections", type:"mcq" as const, difficulty:"hard" as const, question:"First U.S. presidential primary state?", options:["Iowa","New Hampshire","Florida","Wisconsin"], correctIndex:2, explanation:"Florida in 1901." },
  { id:"pe-5", stageId:"primary-elections", type:"mcq" as const, difficulty:"medium" as const, question:"How do Democrats allocate delegates?", options:["Winner-take-all","Proportionally","Randomly","Seniority"], correctIndex:1, explanation:"Proportionally with a 15% threshold." },
  { id:"cn-1", stageId:"candidate-nomination", type:"mcq" as const, difficulty:"easy" as const, question:"Where are presidential candidates formally nominated?", options:["Congress","National Conventions","White House","State Legislatures"], correctIndex:1, explanation:"At national conventions." },
  { id:"cn-2", stageId:"candidate-nomination", type:"mcq" as const, difficulty:"medium" as const, question:"Year of first televised presidential debate?", options:["1948","1956","1960","1976"], correctIndex:2, explanation:"Kennedy vs. Nixon in 1960." },
  { id:"cn-3", stageId:"candidate-nomination", type:"true-false" as const, difficulty:"medium" as const, question:"A brokered convention means a candidate won on the first ballot.", options:["True","False"], correctIndex:1, explanation:"It means NO candidate won on the first ballot." },
  { id:"cn-4", stageId:"candidate-nomination", type:"mcq" as const, difficulty:"hard" as const, question:"Lincoln nominated on which ballot in 1860?", options:["First","Second","Third","Fifth"], correctIndex:2, explanation:"The third ballot." },
  { id:"cn-5", stageId:"candidate-nomination", type:"mcq" as const, difficulty:"easy" as const, question:"Who picks the VP nominee?", options:["Delegates","Outgoing President","Presidential nominee","Party chair"], correctIndex:2, explanation:"The presidential nominee selects their running mate." },
  { id:"cp-1", stageId:"campaign-period", type:"mcq" as const, difficulty:"easy" as const, question:"Agency enforcing campaign finance laws?", options:["FBI","FEC","SEC","FCC"], correctIndex:1, explanation:"The Federal Election Commission." },
  { id:"cp-2", stageId:"campaign-period", type:"mcq" as const, difficulty:"medium" as const, question:"What can a Super PAC do?", options:["Donate to candidates","Coordinate with campaigns","Unlimited independent spending","All above"], correctIndex:2, explanation:"Unlimited independent expenditures only." },
  { id:"cp-3", stageId:"campaign-period", type:"true-false" as const, difficulty:"medium" as const, question:"The 2020 cycle cost ~$14 billion.", options:["True","False"], correctIndex:0, explanation:"Most expensive ever." },
  { id:"cp-4", stageId:"campaign-period", type:"mcq" as const, difficulty:"easy" as const, question:"Swing states are also called?", options:["Red states","Blue states","Battleground states","Safe states"], correctIndex:2, explanation:"Battleground states." },
  { id:"cp-5", stageId:"campaign-period", type:"mcq" as const, difficulty:"hard" as const, question:"First TV campaign ads?", options:["Truman","Eisenhower","Kennedy","Nixon"], correctIndex:1, explanation:"Eisenhower in 1952." },
  { id:"ed-1", stageId:"election-day", type:"mcq" as const, difficulty:"easy" as const, question:"When is federal Election Day?", options:["1st Monday Nov","1st Tue after 1st Mon Nov","Last Tue Oct","Nov 1"], correctIndex:1, explanation:"First Tuesday after the first Monday in November." },
  { id:"ed-2", stageId:"election-day", type:"mcq" as const, difficulty:"medium" as const, question:"First all-mail voting state?", options:["Washington","Colorado","Oregon","California"], correctIndex:2, explanation:"Oregon in 2000." },
  { id:"ed-3", stageId:"election-day", type:"true-false" as const, difficulty:"easy" as const, question:"All states require photo ID to vote.", options:["True","False"], correctIndex:1, explanation:"Requirements vary widely." },
  { id:"ed-4", stageId:"election-day", type:"mcq" as const, difficulty:"medium" as const, question:"Provisional ballots are for?", options:["Machine testing","Questioned eligibility","Military overseas","Early voting"], correctIndex:1, explanation:"Voters whose eligibility is questioned." },
  { id:"ed-5", stageId:"election-day", type:"mcq" as const, difficulty:"hard" as const, question:"2020 voters count?", options:["120M","140M","159M","175M"], correctIndex:2, explanation:"Over 159 million." },
  { id:"rc-1", stageId:"results-certification", type:"mcq" as const, difficulty:"easy" as const, question:"Electoral votes needed to win?", options:["218","260","270","300"], correctIndex:2, explanation:"270 of 538." },
  { id:"rc-2", stageId:"results-certification", type:"mcq" as const, difficulty:"medium" as const, question:"When is inauguration?", options:["Jan 6","Jan 15","Jan 20","Feb 1"], correctIndex:2, explanation:"January 20th." },
  { id:"rc-3", stageId:"results-certification", type:"mcq" as const, difficulty:"hard" as const, question:"Presidents who lost popular vote but won EC?", options:["2","3","5","7"], correctIndex:2, explanation:"Five times total." },
  { id:"rc-4", stageId:"results-certification", type:"true-false" as const, difficulty:"medium" as const, question:"In an EC tie, the Senate elects the President.", options:["True","False"], correctIndex:1, explanation:"The House elects the President; Senate elects VP." },
  { id:"rc-5", stageId:"results-certification", type:"mcq" as const, difficulty:"medium" as const, question:"States not using winner-take-all?", options:["CA & TX","ME & NE","AK & HI","VT & WY"], correctIndex:1, explanation:"Maine and Nebraska split by congressional district." },
];

type QuizState = "select" | "active" | "results";

function QuizContent() {
  const searchParams = useSearchParams();
  const preselectedStage = searchParams.get("stage");
  const [quizState, setQuizState] = useState<QuizState>(preselectedStage ? "active" : "select");
  const [selectedStage, setSelectedStage] = useState(preselectedStage || "");
  const [questions, setQuestions] = useState<typeof ALL_QUESTIONS>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<boolean[]>([]);

  const startQuiz = useCallback((stageId: string) => {
    setQuestions([...ALL_QUESTIONS.filter(q => q.stageId === stageId)].sort(() => Math.random() - 0.5));
    setSelectedStage(stageId);
    setIdx(0); setSelected(null); setRevealed(false); setScore(0); setHistory([]);
    setQuizState("active");
  }, []);

  useEffect(() => { if (preselectedStage && STAGE_MAP[preselectedStage]) startQuiz(preselectedStage); }, [preselectedStage, startQuiz]);

  const pick = (i: number) => { if (revealed) return; setSelected(i); setRevealed(true); const ok = i === questions[idx].correctIndex; if (ok) setScore(s => s + 1); setHistory(h => [...h, ok]); };
  const next = () => { if (idx + 1 >= questions.length) { setQuizState("results"); } else { setIdx(i => i + 1); setSelected(null); setRevealed(false); } };

  const q = questions[idx];
  const info = STAGE_MAP[selectedStage];
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  if (quizState === "select") return (
    <div className="container section">
      <div style={{ textAlign:"center", marginBottom:"3rem", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.75rem" }}>
        <span className="badge badge-primary">Knowledge Check</span>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900 }}>Election Quizzes</h1>
        <p style={{ color:"var(--text-secondary)", maxWidth:560 }}>Choose a stage to test your knowledge. 5 questions each with instant feedback.</p>
      </div>
      <div className="stagger-children" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1.25rem", maxWidth:960, margin:"0 auto" }}>
        {Object.entries(STAGE_MAP).map(([id, s]) => (
          <button key={id} onClick={() => startQuiz(id)} className="glass-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.75rem", textAlign:"center", cursor:"pointer", color:"inherit", fontFamily:"inherit", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width:72, height:72, borderRadius:"var(--radius-lg)", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${s.color}20,${s.color}08)`, border:`1px solid ${s.color}30` }}>
              <span style={{ fontSize:"2rem" }}>{s.icon}</span>
            </div>
            <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.125rem", fontWeight:700 }}>{s.title}</h3>
            <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>{ALL_QUESTIONS.filter(q => q.stageId === id).length} questions</p>
            <span style={{ fontSize:"0.875rem", fontWeight:600, color:s.color, marginTop:"auto" }}>Start Quiz →</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (quizState === "results") return (
    <div className="container section">
      <div className="animate-fade-in-up" style={{ maxWidth:640, margin:"0 auto", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:"1.5rem" }}>
        <div style={{ fontSize:"4rem" }}>{pct >= 70 ? "🎉" : "📚"}</div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"2rem", fontWeight:900 }}>{pct >= 70 ? "Congratulations!" : "Keep Learning!"}</h1>
        <p style={{ color:"var(--text-secondary)" }}>{pct >= 70 ? `You passed the ${info.title} quiz!` : "Review the material and try again."}</p>
        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg viewBox="0 0 120 120" style={{ width:160, height:160 }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={pct >= 70 ? "#10b981" : "#ef4444"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 327} 327`} transform="rotate(-90 60 60)" style={{ transition:"stroke-dasharray 1s" }} />
          </svg>
          <div style={{ position:"absolute", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <span style={{ fontSize:"2.5rem", fontWeight:800, fontFamily:"var(--font-display)" }}>{pct}%</span>
            <span style={{ fontSize:"0.875rem", color:"var(--text-muted)" }}>{score}/{questions.length}</span>
          </div>
        </div>
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:"0.5rem", textAlign:"left" }}>
          {questions.map((q, i) => (
            <div key={q.id} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 1rem", background:"rgba(255,255,255,0.02)", borderRadius:"var(--radius-sm)", border:"1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: history[i] ? "#10b981" : "#ef4444" }}>{history[i] ? "✓" : "✗"}</span>
              <span style={{ fontSize:"0.875rem", color:"var(--text-secondary)" }}>{q.question}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", justifyContent:"center" }}>
          <button onClick={() => startQuiz(selectedStage)} className="btn btn-primary">Retry</button>
          <button onClick={() => setQuizState("select")} className="btn btn-secondary">Other Stages</button>
        </div>
      </div>
    </div>
  );

  if (quizState === "active" && questions.length === 0) return (
    <div className="container section" style={{ textAlign: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Loading questions...</p>
    </div>
  );

  return (
    <div className="container section">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <span style={{ fontSize:"1.25rem" }}>{info.icon}</span>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:600 }}>{info.title}</span>
        </div>
        <span style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>Q {idx + 1}/{questions.length}</span>
      </div>
      <div className="progress-track" style={{ marginBottom:"2rem" }}><div className="progress-fill" style={{ width:`${((idx + (revealed ? 1 : 0)) / questions.length) * 100}%` }} /></div>
      <div className="glass-card animate-fade-in" key={q.id} style={{ maxWidth:720, margin:"0 auto", display:"flex", flexDirection:"column", gap:"1.5rem" }}>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <span className={`badge ${q.difficulty === "easy" ? "badge-success" : q.difficulty === "medium" ? "badge-warning" : "badge-primary"}`}>{q.difficulty}</span>
          <span className="badge badge-primary">{q.type === "true-false" ? "T/F" : "MCQ"}</span>
        </div>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.375rem", fontWeight:700, lineHeight:1.4 }}>{q.question}</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }} role="radiogroup">
          {q.options.map((opt, i) => {
            let bg = "rgba(255,255,255,0.02)", bc = "rgba(255,255,255,0.08)";
            if (revealed && i === q.correctIndex) { bg = "rgba(16,185,129,0.1)"; bc = "#10b981"; }
            else if (revealed && i === selected) { bg = "rgba(239,68,68,0.1)"; bc = "#ef4444"; }
            else if (!revealed && i === selected) { bg = `${info.color}15`; bc = info.color; }
            return (
              <button key={i} onClick={() => pick(i)} disabled={revealed} role="radio" aria-checked={selected === i}
                style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1rem 1.25rem", background:bg, border:`1px solid ${bc}`, borderRadius:"var(--radius-md)", cursor: revealed ? "default" : "pointer", color:"var(--text-primary)", fontFamily:"inherit", fontSize:"1rem", textAlign:"left", transition:"all 0.2s", width:"100%" }}>
                <span style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.875rem", fontWeight:700, flexShrink:0 }}>{String.fromCharCode(65+i)}</span>
                <span style={{ flex:1 }}>{opt}</span>
                {revealed && i === q.correctIndex && <span>✓</span>}
                {revealed && i === selected && i !== q.correctIndex && <span>✗</span>}
              </button>
            );
          })}
        </div>
        {revealed && (
          <div className="animate-fade-in-up" style={{ display:"flex", gap:"0.75rem", padding:"1rem 1.25rem", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"var(--radius-md)" }}>
            <span style={{ fontSize:"1.5rem" }}>{selected === q.correctIndex ? "✅" : "💡"}</span>
            <div>
              <p style={{ fontWeight:600, marginBottom:"0.25rem" }}>{selected === q.correctIndex ? "Correct!" : "Not quite!"}</p>
              <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", lineHeight:1.6 }}>{q.explanation}</p>
            </div>
          </div>
        )}
        {revealed && <button onClick={next} className="btn btn-primary" style={{ alignSelf:"flex-end" }}>{idx + 1 >= questions.length ? "See Results" : "Next"} →</button>}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return <Suspense fallback={<div className="container section" style={{ textAlign:"center" }}><p style={{ color:"var(--text-muted)" }}>Loading...</p></div>}><QuizContent /></Suspense>;
}
